# Third-party notices

本项目直接使用并在浏览器构建中包含以下依赖。完整许可证保留于 `docs/licenses/`：

- React / React DOM：MIT，Copyright Meta Platforms, Inc. and affiliates。
- PDF.js / pdfjs-dist：Apache-2.0，Mozilla Foundation 与项目贡献者。
- fflate：MIT，Arjun Barrett。

构建、类型与测试工具（Vite、TypeScript、Playwright 等）也有各自许可证，见其 npm 包。此文件不授予 CybeReader 项目源码的许可证。

- Rajdhani / Orbitron 字体：SIL OFL 1.1，完整许可见 `public/fonts/*-OFL.txt`。

## 示例书库

`public/library/pg24039.txt`（老子）、`pg23839.txt`（论语）、`pg23950.txt`（三国演义）为 Project Gutenberg 于 2026-10-18 获取的 UTF-8 原始 TXT 快照，未删除原文开头或末尾的声明及完整 Project Gutenberg License。来源、字节数、SHA-256 与原站授权说明登记在 `src/library.json`。原站标注美国公版；不将该标注扩大解释为所有司法辖区的保证。CybeReader 不隶属于 Project Gutenberg。

下载与导入均保留完整文本；阅读器只将首次阅读位置设在正文起始标记之后。书城为固定精选样本，不实时抓取第三方全量目录；更新时应复核来源、许可、长度与哈希。私人 `books/` 目录未参与打包。
