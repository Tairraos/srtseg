/**
 * SRT分词工具类型定义文件
 * 定义项目中使用的所有接口和类型
 */

/**
 * 原始SRT条目接口
 * 表示从SRT文件中解析出的单个字幕条目
 */
export interface SRTEntry {
  /** 字幕序号 */
  index: number;
  /** 开始时间戳 (HH:MM:SS,mmm格式) */
  startTime: string;
  /** 结束时间戳 (HH:MM:SS,mmm格式) */
  endTime: string;
  /** 字幕文本内容 */
  text: string;
  /** 持续时间（毫秒，计算得出） */
  duration?: number;
}

/**
 * 分词结果接口
 * 表示对文本进行分词后的单个词语信息
 */
export interface WordSegment {
  /** 分词后的词语内容 */
  word: string;
  /** 词语字符长度 */
  length: number;
  /** 在原句中的位置索引 */
  position: number;
}

/**
 * 处理后的词语条目接口
 * 表示分配时间后的单个词语字幕条目
 */
export interface WordEntry {
  /** 新的序号 */
  index: number;
  /** 词语内容 */
  word: string;
  /** 分配的开始时间 */
  startTime: string;
  /** 分配的结束时间 */
  endTime: string;
  /** 持续时间（毫秒） */
  duration: number;
  /** 原始字幕条目序号 */
  originalIndex: number;
}

/**
 * 时间格式转换工具类型
 * 用于时间戳的解析和格式化
 */
export interface TimeStamp {
  /** 小时 */
  hours: number;
  /** 分钟 */
  minutes: number;
  /** 秒 */
  seconds: number;
  /** 毫秒 */
  milliseconds: number;
}

/**
 * 处理配置接口
 * 定义工具的运行配置参数
 */
export interface ProcessConfig {
  /** 输入文件路径 */
  inputFile: string;
  /** 输出文件路径 */
  outputFile: string;
  /** 最小词语显示时间（毫秒） */
  minWordDuration?: number;
  /** 最大词语显示时间（毫秒） */
  maxWordDuration?: number;
  /** 是否显示详细日志 */
  verbose?: boolean;
}

/**
 * 命令行选项接口
 * 定义CLI工具接受的命令行参数
 */
export interface CLIOptions {
  /** 输入文件路径 */
  input: string;
  /** 输出文件路径（可选） */
  output?: string;
  /** 是否显示详细信息 */
  verbose?: boolean;
}