/**
 * SRT处理器模块
 * 整合SRT解析、分词处理、时间分配等功能，提供完整的处理流程
 */

import { SRTEntry, WordSegment, WordEntry, ProcessConfig } from '../types';
import { parseSRTFile, writeSRTFile } from '../parsers/srtParser';
import { segmentText, batchSegment } from '../services/segmentService';
import {
  allocateTime,
  batchAllocateTime,
  TimeAllocationService,
} from '../services/timeAllocationService';
import * as path from 'path';

/**
 * SRT处理器类
 * 提供完整的SRT分词处理流程
 */
export class SRTProcessor {
  private config: ProcessConfig;
  private timeAllocationService: TimeAllocationService;

  /**
   * 构造函数
   * @param config 处理配置
   */
  constructor(config: ProcessConfig) {
    this.config = config;
    this.timeAllocationService = TimeAllocationService.getInstance();
  }

  /**
   * 执行完整的SRT分词处理流程
   * @returns 处理结果统计信息
   */
  public async process(): Promise<{
    success: boolean;
    inputFile: string;
    outputFile: string;
    originalEntries: number;
    processedEntries: number;
    totalWords: number;
    processingTime: number;
    message: string;
  }> {
    const startTime = Date.now();
    
    try {
      this.logVerbose('开始处理SRT文件...');
      
      // 1. 解析输入文件
      this.logVerbose(`读取输入文件: ${this.config.inputFile}`);
      const originalEntries = await parseSRTFile(this.config.inputFile);
      
      if (originalEntries.length === 0) {
        throw new Error('输入文件中没有找到有效的字幕条目');
      }
      
      this.logVerbose(`解析到 ${originalEntries.length} 个字幕条目`);
      
      // 2. 批量分词处理
      this.logVerbose('开始分词处理...');
      const texts = originalEntries.map(entry => entry.text);
      const segmentsList = batchSegment(texts);
      
      // 统计分词结果
      const totalWords = segmentsList.reduce(
        (sum, segments) => sum + segments.length,
        0
      );
      
      this.logVerbose(`分词完成，共生成 ${totalWords} 个词语`);
      
      // 3. 时间分配
      this.logVerbose('开始时间分配...');
      const wordEntries = batchAllocateTime(
        originalEntries,
        segmentsList,
        {
          minWordDuration: this.config.minWordDuration,
          maxWordDuration: this.config.maxWordDuration,
        }
      );
      
      // 4. 优化时间分配
      this.logVerbose('优化时间分配...');
      const optimizedEntries = this.timeAllocationService.optimizeTimeAllocation(
        wordEntries
      );
      
      // 5. 转换为SRT格式
      const srtEntries: SRTEntry[] = optimizedEntries.map(entry => ({
        index: entry.index,
        startTime: entry.startTime,
        endTime: entry.endTime,
        text: entry.word,
        duration: entry.duration,
      }));
      
      // 6. 写入输出文件
      this.logVerbose(`写入输出文件: ${this.config.outputFile}`);
      await writeSRTFile(srtEntries, this.config.outputFile);
      
      const processingTime = Date.now() - startTime;
      const message = `处理完成！原始条目: ${originalEntries.length}，生成词语: ${totalWords}，耗时: ${processingTime}ms`;
      
      this.logVerbose(message);
      
      return {
        success: true,
        inputFile: this.config.inputFile,
        outputFile: this.config.outputFile,
        originalEntries: originalEntries.length,
        processedEntries: srtEntries.length,
        totalWords,
        processingTime,
        message,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      return {
        success: false,
        inputFile: this.config.inputFile,
        outputFile: this.config.outputFile,
        originalEntries: 0,
        processedEntries: 0,
        totalWords: 0,
        processingTime,
        message: `处理失败: ${errorMessage}`,
      };
    }
  }

  /**
   * 处理单个字幕条目
   * @param entry 字幕条目
   * @returns 处理后的词语条目数组
   */
  public async processSingleEntry(entry: SRTEntry): Promise<WordEntry[]> {
    try {
      // 分词处理
      const segments = segmentText(entry.text);
      
      // 时间分配
      const wordEntries = allocateTime(entry, segments, {
        minWordDuration: this.config.minWordDuration,
        maxWordDuration: this.config.maxWordDuration,
      });
      
      return wordEntries;
    } catch (error) {
      throw new Error(
        `处理字幕条目失败 (索引: ${entry.index}): ${error}`
      );
    }
  }

  /**
   * 验证输入文件
   * @returns 验证结果
   */
  public async validateInput(): Promise<{
    valid: boolean;
    message: string;
  }> {
    try {
      // 检查输入文件是否存在
      const entries = await parseSRTFile(this.config.inputFile);
      
      if (entries.length === 0) {
        return {
          valid: false,
          message: '输入文件中没有找到有效的字幕条目',
        };
      }
      
      return {
        valid: true,
        message: `输入文件有效，包含 ${entries.length} 个字幕条目`,
      };
    } catch (error) {
      return {
        valid: false,
        message: `输入文件验证失败: ${error}`,
      };
    }
  }

  /**
   * 生成默认输出文件名
   * @param inputFile 输入文件路径
   * @returns 默认输出文件路径
   */
  public static generateDefaultOutputPath(inputFile: string): string {
    const parsed = path.parse(inputFile);
    return path.join(parsed.dir, `${parsed.name}_segmented${parsed.ext}`);
  }

  /**
   * 输出详细日志
   * @param message 日志消息
   */
  private logVerbose(message: string): void {
    if (this.config.verbose) {
      console.log(`[SRTProcessor] ${message}`);
    }
  }

  /**
   * 获取处理统计信息
   * @param inputFile 输入文件路径
   * @returns 统计信息
   */
  public static async getFileStats(inputFile: string): Promise<{
    totalEntries: number;
    totalCharacters: number;
    averageEntryLength: number;
    estimatedWords: number;
  }> {
    try {
      const entries = await parseSRTFile(inputFile);
      const totalEntries = entries.length;
      const totalCharacters = entries.reduce(
        (sum, entry) => sum + entry.text.length,
        0
      );
      const averageEntryLength = totalEntries > 0 ? totalCharacters / totalEntries : 0;
      
      // 粗略估算词语数量（中文平均每2-3个字符一个词）
      const estimatedWords = Math.round(totalCharacters / 2.5);
      
      return {
        totalEntries,
        totalCharacters,
        averageEntryLength: Math.round(averageEntryLength * 100) / 100,
        estimatedWords,
      };
    } catch (error) {
      throw new Error(`获取文件统计信息失败: ${error}`);
    }
  }
}

/**
 * 便捷的处理函数
 * @param config 处理配置
 * @returns 处理结果
 */
export async function processSRTFile(config: ProcessConfig) {
  const processor = new SRTProcessor(config);
  return await processor.process();
}