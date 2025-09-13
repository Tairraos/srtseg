/**
 * 时间分配服务模块
 * 根据词语字数比例分配时间段，确保总时长一致
 */

import { SRTEntry, WordSegment, WordEntry } from '../types';
import {
  calculateDuration,
  addMilliseconds,
  millisecondsToTimeStamp,
  formatTimeStamp,
  parseTimeStamp,
  timeStampToMilliseconds,
} from '../utils/timeUtils';

/**
 * 时间分配服务类
 * 提供词语级别的时间分配算法
 */
export class TimeAllocationService {
  private static instance: TimeAllocationService;

  // 默认配置
  private readonly DEFAULT_MIN_DURATION = 200; // 最小词语显示时间（毫秒）
  private readonly DEFAULT_MAX_DURATION = 3000; // 最大词语显示时间（毫秒）

  /**
   * 获取时间分配服务单例实例
   * @returns TimeAllocationService实例
   */
  public static getInstance(): TimeAllocationService {
    if (!TimeAllocationService.instance) {
      TimeAllocationService.instance = new TimeAllocationService();
    }
    return TimeAllocationService.instance;
  }

  /**
   * 根据词语长度分配时间
   * @param originalEntry 原始字幕条目
   * @param segments 分词结果
   * @param options 分配选项
   * @returns 分配时间后的词语条目数组
   */
  public allocateTime(
    originalEntry: SRTEntry,
    segments: WordSegment[],
    options: {
      minWordDuration?: number;
      maxWordDuration?: number;
    } = {}
  ): WordEntry[] {
    if (segments.length === 0) {
      return [];
    }

    const minDuration = options.minWordDuration ?? this.DEFAULT_MIN_DURATION;
    const maxDuration = options.maxWordDuration ?? this.DEFAULT_MAX_DURATION;

    // 计算原始条目的总时长
    const totalDuration = calculateDuration(
      originalEntry.startTime,
      originalEntry.endTime
    );

    // 计算总字符数
    const totalCharacters = segments.reduce((sum, seg) => sum + seg.length, 0);

    if (totalCharacters === 0) {
      return [];
    }

    // 按比例分配时间
    const wordEntries: WordEntry[] = [];
    let currentStartTime = originalEntry.startTime;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      // 计算该词语应分配的时间（按字符数比例）
      const proportionalDuration = Math.round(
        (segment.length / totalCharacters) * totalDuration
      );

      // 应用最小和最大时长限制
      let wordDuration = Math.max(minDuration, proportionalDuration);
      wordDuration = Math.min(maxDuration, wordDuration);

      // 对于最后一个词语，确保结束时间与原始条目一致
      if (i === segments.length - 1) {
        wordDuration = this.calculateRemainingDuration(
          currentStartTime,
          originalEntry.endTime
        );
      }

      // 计算结束时间
      const currentEndTime = addMilliseconds(currentStartTime, wordDuration);

      wordEntries.push({
        index: i + 1, // 临时索引，后续会重新编号
        word: segment.word,
        startTime: currentStartTime,
        endTime: currentEndTime,
        duration: wordDuration,
        originalIndex: originalEntry.index,
      });

      // 更新下一个词语的开始时间
      currentStartTime = currentEndTime;
    }

    // 验证总时长是否一致
    this.validateTotalDuration(wordEntries, totalDuration, originalEntry);

    return wordEntries;
  }

  /**
   * 计算剩余时间
   * @param startTime 开始时间
   * @param endTime 结束时间
   * @returns 剩余时间（毫秒）
   */
  private calculateRemainingDuration(
    startTime: string,
    endTime: string
  ): number {
    return Math.max(0, calculateDuration(startTime, endTime));
  }

  /**
   * 验证总时长是否一致
   * @param wordEntries 词语条目数组
   * @param expectedDuration 期望的总时长
   * @param originalEntry 原始字幕条目（可选，用于输出详细信息）
   */
  private validateTotalDuration(
    wordEntries: WordEntry[],
    expectedDuration: number,
    originalEntry?: SRTEntry
  ): void {
    if (wordEntries.length === 0) {
      return;
    }

    const firstEntry = wordEntries[0];
    const lastEntry = wordEntries[wordEntries.length - 1];

    const actualDuration = calculateDuration(
      firstEntry.startTime,
      lastEntry.endTime
    );

    // 允许1毫秒的误差
    const tolerance = 1;
    if (Math.abs(actualDuration - expectedDuration) > tolerance) {
      // 输出详细的时间分配警告信息
      console.warn('\n=== 时间分配警告 ===');
      console.warn(`期望时长: ${expectedDuration}ms`);
      console.warn(`实际时长: ${actualDuration}ms`);
      console.warn(
        `时长差异: ${Math.abs(actualDuration - expectedDuration)}ms`
      );

      if (originalEntry) {
        console.warn(
          `原始时间轴: ${originalEntry.startTime} --> ${originalEntry.endTime}`
        );
        console.warn(`原始字幕文字: "${originalEntry.text}"`);
      }

      console.warn(
        `分配后时间轴: ${firstEntry.startTime} --> ${lastEntry.endTime}`
      );

      // 输出所有分词的详细信息
      console.warn('分词详情:');
      wordEntries.forEach((entry, index) => {
        console.warn(
          `  ${index + 1}. "${entry.word}" (${entry.startTime} --> ${entry.endTime}, ${entry.duration}ms)`
        );
      });
      console.warn('==================\n');
    }
  }

  /**
   * 批量处理多个字幕条目
   * @param entries 原始字幕条目数组
   * @param segmentsList 对应的分词结果数组
   * @param options 分配选项
   * @returns 所有词语条目的数组
   */
  public batchAllocateTime(
    entries: SRTEntry[],
    segmentsList: WordSegment[][],
    options: {
      minWordDuration?: number;
      maxWordDuration?: number;
    } = {}
  ): WordEntry[] {
    if (entries.length !== segmentsList.length) {
      throw new Error('字幕条目数量与分词结果数量不匹配');
    }

    const allWordEntries: WordEntry[] = [];
    let globalIndex = 1;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const segments = segmentsList[i];

      const wordEntries = this.allocateTime(entry, segments, options);

      // 重新编号
      for (const wordEntry of wordEntries) {
        wordEntry.index = globalIndex++;
        allWordEntries.push(wordEntry);
      }
    }

    return allWordEntries;
  }

  /**
   * 优化时间分配
   * 对分配结果进行微调，确保时间分配更加合理
   * @param wordEntries 词语条目数组
   * @returns 优化后的词语条目数组
   */
  public optimizeTimeAllocation(wordEntries: WordEntry[]): WordEntry[] {
    if (wordEntries.length <= 1) {
      return wordEntries;
    }

    const optimized = [...wordEntries];

    // 平滑处理：避免相邻词语时长差异过大
    for (let i = 1; i < optimized.length - 1; i++) {
      const prev = optimized[i - 1];
      const current = optimized[i];
      const next = optimized[i + 1];

      // 如果当前词语时长明显异常，进行调整
      const avgDuration = (prev.duration + next.duration) / 2;
      const threshold = avgDuration * 0.3; // 30%的阈值

      if (Math.abs(current.duration - avgDuration) > threshold) {
        // 重新计算当前词语的时长
        const adjustedDuration = Math.round(
          (current.duration + avgDuration) / 2
        );

        current.duration = adjustedDuration;
        current.endTime = addMilliseconds(current.startTime, adjustedDuration);

        // 调整后续词语的开始时间
        if (i < optimized.length - 1) {
          optimized[i + 1].startTime = current.endTime;
        }
      }
    }

    return optimized;
  }
}

/**
 * 导出时间分配服务的便捷函数
 */

/**
 * 根据词语长度分配时间
 * @param originalEntry 原始字幕条目
 * @param segments 分词结果
 * @param options 分配选项
 * @returns 分配时间后的词语条目数组
 */
export function allocateTime(
  originalEntry: SRTEntry,
  segments: WordSegment[],
  options?: {
    minWordDuration?: number;
    maxWordDuration?: number;
  }
): WordEntry[] {
  return TimeAllocationService.getInstance().allocateTime(
    originalEntry,
    segments,
    options
  );
}

/**
 * 批量处理多个字幕条目
 * @param entries 原始字幕条目数组
 * @param segmentsList 对应的分词结果数组
 * @param options 分配选项
 * @returns 所有词语条目的数组
 */
export function batchAllocateTime(
  entries: SRTEntry[],
  segmentsList: WordSegment[][],
  options?: {
    minWordDuration?: number;
    maxWordDuration?: number;
  }
): WordEntry[] {
  return TimeAllocationService.getInstance().batchAllocateTime(
    entries,
    segmentsList,
    options
  );
}
