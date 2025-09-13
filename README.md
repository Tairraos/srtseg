# SRT分词工具 (srtseg)

一个基于Node.js的命令行工具，用于将SRT字幕文件从句子级别拆分为词语级别，提高字幕的精细化显示效果。

## 功能特性

- 🔤 **中文分词**: 使用NodeJieba进行精准的中文分词处理
- ⏱️ **智能时间分配**: 根据词语字数比例分配时间，确保总时长一致
- 📁 **批量处理**: 支持处理包含多个字幕条目的SRT文件
- 🎯 **精确控制**: 可设置最小/最大词语显示时间
- 📊 **统计信息**: 提供详细的处理统计和文件分析
- 🛠️ **易于使用**: 简洁的命令行界面，支持多种参数配置

## 安装

### 全局安装

```bash
npm install -g srtseg
```

### 本地安装

```bash
npm install srtseg
```

## 使用方法

### 基本用法

```bash
# 处理SRT文件，自动生成输出文件
srtseg input.srt

# 指定输出文件
srtseg input.srt output.srt

# 使用-o参数指定输出文件
srtseg -i input.srt -o output.srt
```

### 高级选项

```bash
# 设置最小和最大词语显示时间
srtseg input.srt --min-duration 300 --max-duration 2000

# 显示详细处理信息
srtseg input.srt --verbose

# 显示文件统计信息
srtseg input.srt --stats
```

### 其他命令

```bash
# 验证SRT文件格式
srtseg validate input.srt

# 显示文件统计信息
srtseg stats input.srt

# 显示帮助信息
srtseg --help

# 显示版本信息
srtseg --version
```

## 命令行参数

| 参数 | 描述 | 默认值 |
|------|------|--------|
| `<input>` | 输入的SRT文件路径 | 必需 |
| `[output]` | 输出的SRT文件路径 | `{输入文件名}_segmented.srt` |
| `-o, --output <file>` | 指定输出文件路径 | - |
| `--min-duration <ms>` | 最小词语显示时间（毫秒） | 200 |
| `--max-duration <ms>` | 最大词语显示时间（毫秒） | 3000 |
| `--verbose` | 显示详细处理信息 | false |
| `--stats` | 显示文件统计信息 | false |
| `-h, --help` | 显示帮助信息 | - |
| `-v, --version` | 显示版本信息 | - |

## 处理示例

### 输入文件 (input.srt)

```
1
00:00:01,000 --> 00:00:04,000
今天天气真不错，我们去公园散步吧。

2
00:00:05,000 --> 00:00:08,000
好的，我们一起去看看花开了没有。
```

### 输出文件 (input_segmented.srt)

```
1
00:00:01,000 --> 00:00:01,400
今天

2
00:00:01,400 --> 00:00:01,800
天气

3
00:00:01,800 --> 00:00:02,000
真

4
00:00:02,000 --> 00:00:02,400
不错

5
00:00:02,400 --> 00:00:02,600
，

6
00:00:02,600 --> 00:00:03,000
我们

7
00:00:03,000 --> 00:00:03,200
去

8
00:00:03,200 --> 00:00:03,600
公园

9
00:00:03,600 --> 00:00:04,000
散步

10
00:00:04,000 --> 00:00:04,000
吧
```

## 编程接口

除了命令行工具，srtseg也提供了编程接口：

```typescript
import { processSRTFile, SRTProcessor } from 'srtseg';

// 使用便捷函数
const result = await processSRTFile({
  inputFile: 'input.srt',
  outputFile: 'output.srt',
  minWordDuration: 200,
  maxWordDuration: 3000,
  verbose: true,
});

// 使用处理器类
const processor = new SRTProcessor({
  inputFile: 'input.srt',
  outputFile: 'output.srt',
});

const result = await processor.process();
console.log(result);
```

## 技术架构

- **Node.js**: 运行环境
- **TypeScript**: 开发语言
- **NodeJieba**: 中文分词引擎
- **Commander.js**: 命令行参数解析
- **ESLint + Prettier**: 代码规范
- **Jest**: 单元测试

## 算法原理

1. **SRT解析**: 读取SRT文件，提取字幕序号、时间戳和文本内容
2. **中文分词**: 使用NodeJieba对每句字幕文本进行分词
3. **时间分配**: 根据词语字数比例从原句总时长中分配时间
4. **时间优化**: 对分配结果进行微调，确保时间分配合理
5. **SRT生成**: 将分词后的词语按新的时间分配生成SRT文件

## 开发

### 环境要求

- Node.js >= 18.0.0
- pnpm (推荐) 或 npm

### 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式运行
pnpm dev input.srt

# 构建项目
pnpm build

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

### 发布

```bash
# 更新版本
pnpm version:patch  # 补丁版本
pnpm version:minor  # 次要版本
pnpm version:major  # 主要版本

# 发布到npm
pnpm publish:npm
```

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 更新日志

### v1.0.0

- 🎉 初始版本发布
- ✨ 支持中文分词处理
- ✨ 智能时间分配算法
- ✨ 命令行工具
- ✨ 编程接口
- ✨ 完整的文档和示例