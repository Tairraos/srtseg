/**
 * SRT分词工具主入口文件
 * 导出所有核心功能模块，提供编程接口
 */

// 类型定义
export * from './types';

// 工具函数
export * from './utils/timeUtils';

// 解析器
export * from './parsers/srtParser';

// 服务模块
export * from './services/segmentService';
export * from './services/timeAllocationService';

// 处理器
export * from './processors/srtProcessor';

// CLI应用（可选导出）
export { CLIApp } from './cli';

/**
 * 版本信息
 */
export const VERSION = '1.0.0';

/**
 * 默认配置
 */
export const DEFAULT_CONFIG = {
  minWordDuration: 200,
  maxWordDuration: 3000,
  verbose: false,
};