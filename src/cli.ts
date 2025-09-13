#!/usr/bin/env node

/**
 * SRT分词工具命令行入口文件
 * 提供命令行界面，处理用户输入参数并执行分词处理
 */

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ProcessConfig, CLIOptions } from './types';
import { SRTProcessor, processSRTFile } from './processors/srtProcessor';
import { validateSRTFile } from './parsers/srtParser';

/**
 * CLI应用程序类
 * 封装命令行处理逻辑
 */
class CLIApp {
  private program: Command;
  private version: string;

  constructor() {
    this.program = new Command();
    this.version = '1.0.0'; // 从package.json读取
    this.setupCommands();
  }

  /**
   * 设置命令行选项和参数
   */
  private setupCommands(): void {
    this.program
      .name('srtseg')
      .description('SRT字幕分词工具 - 将SRT字幕文件从句子级别拆分为词语级别')
      .version(this.version, '-v, --version', '显示版本信息')
      .helpOption('-h, --help', '显示帮助信息');

    // 主命令
    this.program
      .option('-i, --input <file>', '输入的SRT文件路径')
      .option('-o, --output <file>', '输出的SRT文件路径')
      .option('--min-duration <ms>', '最小词语显示时间（毫秒）', '200')
      .option('--max-duration <ms>', '最大词语显示时间（毫秒）', '3000')
      .option('--verbose', '显示详细处理信息', false)
      .option('--stats', '显示文件统计信息', false)
      .action(async (options: any) => {
        await this.handleMainCommand(options);
      });

    // 验证命令
    this.program
      .command('validate')
      .description('验证SRT文件格式')
      .argument('<file>', 'SRT文件路径')
      .action(async (file: string) => {
        await this.handleValidateCommand(file);
      });

    // 统计命令
    this.program
      .command('stats')
      .description('显示SRT文件统计信息')
      .argument('<file>', 'SRT文件路径')
      .action(async (file: string) => {
        await this.handleStatsCommand(file);
      });
  }

  /**
   * 处理主命令
   * @param options 命令行选项
   */
  private async handleMainCommand(
    options: any
  ): Promise<void> {
    try {
      // 检查必需的输入文件参数
      if (!options.input) {
        throw new Error('请使用 -i 或 --input 指定输入文件路径');
      }
      
      // 解析命令行选项
      const cliOptions = this.parseOptions(options);
      
      // 验证输入文件
      await this.validateInputFile(cliOptions.input);
      
      // 生成输出文件路径
      const outputFile = this.resolveOutputPath(cliOptions);
      
      // 显示文件统计信息（如果需要）
      if (options.stats) {
        await this.showFileStats(cliOptions.input);
      }
      
      // 创建处理配置
      const config: ProcessConfig = {
        inputFile: cliOptions.input,
        outputFile,
        minWordDuration: parseInt(options.minDuration, 10),
        maxWordDuration: parseInt(options.maxDuration, 10),
        verbose: options.verbose,
      };
      
      // 执行处理
      console.log('🚀 开始处理SRT文件...');
      const result = await processSRTFile(config);
      
      // 显示结果
      this.displayResult(result);
      
      // 设置退出码
      process.exit(result.success ? 0 : 1);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * 处理验证命令
   * @param file 文件路径
   */
  private async handleValidateCommand(file: string): Promise<void> {
    try {
      console.log(`🔍 验证SRT文件: ${file}`);
      
      const isValid = await validateSRTFile(file);
      
      if (isValid) {
        console.log('✅ SRT文件格式有效');
        
        // 显示基本统计信息
        const stats = await SRTProcessor.getFileStats(file);
        console.log(`📊 统计信息:`);
        console.log(`   - 字幕条目数: ${stats.totalEntries}`);
        console.log(`   - 总字符数: ${stats.totalCharacters}`);
        console.log(`   - 平均条目长度: ${stats.averageEntryLength} 字符`);
        console.log(`   - 预估词语数: ${stats.estimatedWords}`);
        
        process.exit(0);
      } else {
        console.log('❌ SRT文件格式无效或文件不存在');
        process.exit(1);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * 处理统计命令
   * @param file 文件路径
   */
  private async handleStatsCommand(file: string): Promise<void> {
    try {
      await this.showFileStats(file);
      process.exit(0);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * 解析命令行选项
   * @param options 选项
   * @returns 解析后的选项
   */
  private parseOptions(
    options: any
  ): CLIOptions {
    return {
      input: path.resolve(options.input),
      output: options.output ? path.resolve(options.output) : undefined,
      verbose: options.verbose,
    };
  }

  /**
   * 验证输入文件
   * @param inputFile 输入文件路径
   */
  private async validateInputFile(inputFile: string): Promise<void> {
    try {
      await fs.access(inputFile);
      
      // 检查文件扩展名
      if (!inputFile.toLowerCase().endsWith('.srt')) {
        console.warn('⚠️  警告: 输入文件不是.srt扩展名');
      }
    } catch {
      throw new Error(`输入文件不存在: ${inputFile}`);
    }
  }

  /**
   * 解析输出文件路径
   * @param options CLI选项
   * @returns 输出文件路径
   */
  private resolveOutputPath(options: CLIOptions): string {
    if (options.output) {
      return options.output;
    }
    
    // 生成默认输出文件名
    return SRTProcessor.generateDefaultOutputPath(options.input);
  }

  /**
   * 显示文件统计信息
   * @param file 文件路径
   */
  private async showFileStats(file: string): Promise<void> {
    console.log(`📊 文件统计信息: ${file}`);
    
    const stats = await SRTProcessor.getFileStats(file);
    console.log(`   - 字幕条目数: ${stats.totalEntries}`);
    console.log(`   - 总字符数: ${stats.totalCharacters}`);
    console.log(`   - 平均条目长度: ${stats.averageEntryLength} 字符`);
    console.log(`   - 预估词语数: ${stats.estimatedWords}`);
    console.log('');
  }

  /**
   * 显示处理结果
   * @param result 处理结果
   */
  private displayResult(result: any): void {
    if (result.success) {
      console.log('✅ 处理完成!');
      console.log(`📁 输入文件: ${result.inputFile}`);
      console.log(`📁 输出文件: ${result.outputFile}`);
      console.log(`📊 原始条目: ${result.originalEntries}`);
      console.log(`📊 生成词语: ${result.totalWords}`);
      console.log(`⏱️  处理时间: ${result.processingTime}ms`);
    } else {
      console.log('❌ 处理失败!');
      console.log(`💬 错误信息: ${result.message}`);
    }
  }

  /**
   * 处理错误
   * @param error 错误对象
   */
  private handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error(`❌ 错误: ${message}`);
    process.exit(1);
  }

  /**
   * 运行CLI应用程序
   */
  public async run(): Promise<void> {
    try {
      await this.program.parseAsync(process.argv);
    } catch (error) {
      this.handleError(error);
    }
  }
}

/**
 * 主函数
 * 程序入口点
 */
async function main(): Promise<void> {
  const app = new CLIApp();
  await app.run();
}

// 运行程序
if (require.main === module) {
  main().catch(error => {
    console.error('程序运行失败:', error);
    process.exit(1);
  });
}

export { CLIApp };