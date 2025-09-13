/**
 * 分词处理服务模块
 * 使用NodeJieba进行中文分词处理
 */

import * as nodejieba from 'nodejieba';
import { WordSegment } from '../types';

/**
 * 分词服务类
 * 封装NodeJieba的分词功能，提供文本分词和词语统计
 */
export class SegmentService {
  private static instance: SegmentService;
  private initialized = false;

  /**
   * 获取分词服务单例实例
   * @returns SegmentService实例
   */
  public static getInstance(): SegmentService {
    if (!SegmentService.instance) {
      SegmentService.instance = new SegmentService();
    }
    return SegmentService.instance;
  }

  /**
   * 初始化分词引擎
   * 确保NodeJieba正确加载
   */
  private initialize(): void {
    if (!this.initialized) {
      try {
        // NodeJieba初始化（通常在首次调用时自动完成）
        nodejieba.load();
        this.initialized = true;
      } catch (error) {
        throw new Error(`分词引擎初始化失败: ${error}`);
      }
    }
  }

  /**
   * 对文本进行中文分词
   * @param text 待分词的文本
   * @returns 分词结果数组
   */
  public segmentText(text: string): WordSegment[] {
    this.initialize();
    
    if (!text || text.trim().length === 0) {
      return [];
    }
    
    try {
      // 清理文本：移除多余的空白字符
      const cleanText = text.trim().replace(/\s+/g, ' ');
      
      // 使用NodeJieba进行分词
      const words = nodejieba.cut(cleanText);
      
      // 转换为WordSegment格式
      const segments: WordSegment[] = [];
      let position = 0;
      
      for (const word of words) {
        // 跳过空字符串和纯空白字符
        if (word.trim().length === 0) {
          position += word.length;
          continue;
        }
        
        segments.push({
          word: word.trim(),
          length: this.getCharacterCount(word.trim()),
          position,
        });
        
        position += word.length;
      }
      
      return segments;
    } catch (error) {
      throw new Error(`文本分词失败: ${error}`);
    }
  }

  /**
   * 获取文本的字符数（考虑中英文差异）
   * @param text 文本内容
   * @returns 字符数
   */
  private getCharacterCount(text: string): number {
    // 使用Unicode字符长度，正确处理中文字符
    return Array.from(text).length;
  }

  /**
   * 批量分词处理
   * @param texts 文本数组
   * @returns 分词结果数组
   */
  public batchSegment(texts: string[]): WordSegment[][] {
    return texts.map(text => this.segmentText(text));
  }

  /**
   * 获取分词统计信息
   * @param text 待分析的文本
   * @returns 分词统计信息
   */
  public getSegmentStats(text: string): {
    totalWords: number;
    totalCharacters: number;
    averageWordLength: number;
    segments: WordSegment[];
  } {
    const segments = this.segmentText(text);
    const totalWords = segments.length;
    const totalCharacters = segments.reduce((sum, seg) => sum + seg.length, 0);
    const averageWordLength = totalWords > 0 ? totalCharacters / totalWords : 0;
    
    return {
      totalWords,
      totalCharacters,
      averageWordLength: Math.round(averageWordLength * 100) / 100,
      segments,
    };
  }

  /**
   * 验证分词结果的完整性
   * @param originalText 原始文本
   * @param segments 分词结果
   * @returns 是否完整
   */
  public validateSegmentation(
    originalText: string,
    segments: WordSegment[]
  ): boolean {
    try {
      // 重新组合分词结果
      const reconstructed = segments.map(seg => seg.word).join('');
      
      // 移除空白字符后比较
      const cleanOriginal = originalText.replace(/\s+/g, '');
      const cleanReconstructed = reconstructed.replace(/\s+/g, '');
      
      return cleanOriginal === cleanReconstructed;
    } catch {
      return false;
    }
  }
}

/**
 * 导出分词服务的便捷函数
 */

/**
 * 对文本进行分词
 * @param text 待分词的文本
 * @returns 分词结果数组
 */
export function segmentText(text: string): WordSegment[] {
  return SegmentService.getInstance().segmentText(text);
}

/**
 * 批量分词处理
 * @param texts 文本数组
 * @returns 分词结果数组
 */
export function batchSegment(texts: string[]): WordSegment[][] {
  return SegmentService.getInstance().batchSegment(texts);
}

/**
 * 获取分词统计信息
 * @param text 待分析的文本
 * @returns 分词统计信息
 */
export function getSegmentStats(text: string) {
  return SegmentService.getInstance().getSegmentStats(text);
}