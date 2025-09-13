/**
 * 时间工具模块
 * 提供SRT时间戳的解析、格式化和计算功能
 */

import { TimeStamp } from '../types';

/**
 * 将SRT时间戳字符串解析为TimeStamp对象
 * @param timeStr SRT时间戳字符串 (格式: HH:MM:SS,mmm)
 * @returns 解析后的TimeStamp对象
 */
export function parseTimeStamp(timeStr: string): TimeStamp {
  // 匹配SRT时间格式: HH:MM:SS,mmm
  const timeRegex = /^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/;
  const match = timeStr.trim().match(timeRegex);

  if (!match) {
    throw new Error(`无效的时间格式: ${timeStr}`);
  }

  return {
    hours: parseInt(match[1], 10),
    minutes: parseInt(match[2], 10),
    seconds: parseInt(match[3], 10),
    milliseconds: parseInt(match[4], 10),
  };
}

/**
 * 将TimeStamp对象格式化为SRT时间戳字符串
 * @param timestamp TimeStamp对象
 * @returns SRT格式的时间戳字符串
 */
export function formatTimeStamp(timestamp: TimeStamp): string {
  const { hours, minutes, seconds, milliseconds } = timestamp;

  // 确保各部分都是两位数或三位数（毫秒）
  const h = hours.toString().padStart(2, '0');
  const m = minutes.toString().padStart(2, '0');
  const s = seconds.toString().padStart(2, '0');
  const ms = milliseconds.toString().padStart(3, '0');

  return `${h}:${m}:${s},${ms}`;
}

/**
 * 将TimeStamp对象转换为总毫秒数
 * @param timestamp TimeStamp对象
 * @returns 总毫秒数
 */
export function timeStampToMilliseconds(timestamp: TimeStamp): number {
  const { hours, minutes, seconds, milliseconds } = timestamp;
  return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
}

/**
 * 将毫秒数转换为TimeStamp对象
 * @param totalMs 总毫秒数
 * @returns TimeStamp对象
 */
export function millisecondsToTimeStamp(totalMs: number): TimeStamp {
  // 确保毫秒数为非负整数
  const ms = Math.max(0, Math.round(totalMs));

  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  return { hours, minutes, seconds, milliseconds };
}

/**
 * 计算两个时间戳之间的持续时间（毫秒）
 * @param startTime 开始时间戳字符串
 * @param endTime 结束时间戳字符串
 * @returns 持续时间（毫秒）
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const start = parseTimeStamp(startTime);
  const end = parseTimeStamp(endTime);

  const startMs = timeStampToMilliseconds(start);
  const endMs = timeStampToMilliseconds(end);

  return endMs - startMs;
}

/**
 * 在指定时间基础上添加毫秒数
 * @param timeStr 基础时间戳字符串
 * @param addMs 要添加的毫秒数
 * @returns 新的时间戳字符串
 */
export function addMilliseconds(timeStr: string, addMs: number): string {
  const timestamp = parseTimeStamp(timeStr);
  const totalMs = timeStampToMilliseconds(timestamp) + addMs;
  const newTimestamp = millisecondsToTimeStamp(totalMs);
  return formatTimeStamp(newTimestamp);
}
