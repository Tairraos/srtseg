/**
 * SRT文件解析模块
 * 提供SRT字幕文件的读取、解析和生成功能
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { SRTEntry } from '../types';
import { calculateDuration } from '../utils/timeUtils';

/**
 * 读取并解析SRT文件
 * @param filePath SRT文件路径
 * @returns 解析后的字幕条目数组
 */
export async function parseSRTFile(filePath: string): Promise<SRTEntry[]> {
  try {
    // 检查文件是否存在
    await fs.access(filePath);

    // 读取文件内容
    const content = await fs.readFile(filePath, 'utf-8');

    // 解析SRT内容
    return parseSRTContent(content);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`读取SRT文件失败: ${error.message}`);
    }
    throw new Error(`读取SRT文件失败: ${filePath}`);
  }
}

/**
 * 解析SRT文件内容
 * @param content SRT文件内容字符串
 * @returns 解析后的字幕条目数组
 */
export function parseSRTContent(content: string): SRTEntry[] {
  const entries: SRTEntry[] = [];

  // 按空行分割字幕条目
  const blocks = content.trim().split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');

    // 每个字幕条目至少需要3行：序号、时间、文本
    if (lines.length < 3) {
      continue;
    }

    try {
      // 解析序号
      const index = parseInt(lines[0].trim(), 10);
      if (isNaN(index)) {
        console.warn(`跳过无效的字幕序号: ${lines[0]}`);
        continue;
      }

      // 解析时间行
      const timeLine = lines[1].trim();
      const timeMatch = timeLine.match(/^([\d:,]+)\s*-->\s*([\d:,]+)$/);

      if (!timeMatch) {
        console.warn(`跳过无效的时间格式: ${timeLine}`);
        continue;
      }

      const startTime = timeMatch[1].trim();
      const endTime = timeMatch[2].trim();

      // 解析文本内容（可能有多行）
      const text = lines.slice(2).join('\n').trim();

      if (!text) {
        console.warn(`跳过空文本的字幕条目: ${index}`);
        continue;
      }

      // 计算持续时间
      const duration = calculateDuration(startTime, endTime);

      entries.push({
        index,
        startTime,
        endTime,
        text,
        duration,
      });
    } catch (error) {
      console.warn(`解析字幕条目失败，跳过: ${block.substring(0, 50)}...`);
      continue;
    }
  }

  return entries;
}

/**
 * 生成SRT文件内容
 * @param entries 字幕条目数组
 * @returns SRT格式的文件内容
 */
export function generateSRTContent(entries: SRTEntry[]): string {
  const blocks: string[] = [];

  for (const entry of entries) {
    // 格式化每个字幕条目
    const block = [
      entry.index.toString(),
      `${entry.startTime} --> ${entry.endTime}`,
      entry.text,
    ].join('\n');

    blocks.push(block);
  }

  // 用双换行符连接所有条目
  return blocks.join('\n\n') + '\n';
}

/**
 * 将字幕条目数组写入SRT文件
 * @param entries 字幕条目数组
 * @param outputPath 输出文件路径
 */
export async function writeSRTFile(
  entries: SRTEntry[],
  outputPath: string
): Promise<void> {
  try {
    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // 生成SRT内容
    const content = generateSRTContent(entries);

    // 写入文件
    await fs.writeFile(outputPath, content, 'utf-8');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`写入SRT文件失败: ${error.message}`);
    }
    throw new Error(`写入SRT文件失败: ${outputPath}`);
  }
}

/**
 * 验证SRT文件格式
 * @param filePath SRT文件路径
 * @returns 是否为有效的SRT文件
 */
export async function validateSRTFile(filePath: string): Promise<boolean> {
  try {
    const entries = await parseSRTFile(filePath);
    return entries.length > 0;
  } catch {
    return false;
  }
}
