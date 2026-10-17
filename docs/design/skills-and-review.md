# 两个技能的来源与应用记录

核验日期：2026-10-18。用户确认指的是 **claude-design** 和 **sketch** 两个技能，而非名为 `claude-design/sketch` 的单个技能。

## 来源与安全审查

固定仓库：[NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent/tree/e6f57427c198cfd96854522b7a9159eb007e13c2)，commit `e6f57427c198cfd96854522b7a9159eb007e13c2`。

- [claude-design](https://github.com/NousResearch/hermes-agent/blob/e6f57427c198cfd96854522b7a9159eb007e13c2/skills/creative/claude-design/SKILL.md)：v1.1.0，作者字段 BadTechBandit。CLI/API 场景下的设计流程、界面类型、上下文、方案与验证。
- [sketch](https://github.com/NousResearch/hermes-agent/blob/e6f57427c198cfd96854522b7a9159eb007e13c2/optional-skills/creative/sketch/SKILL.md)：v1.0.1，作者字段 Hermes Agent，注明改编自 GSD；用于可丢弃的 2–3 个 HTML 交互草图，而非直接产出生产组件。
- 两个目录各只有 `SKILL.md`，无脚本、二进制、依赖清单或密钥要求；仓库 [MIT LICENSE](https://github.com/NousResearch/hermes-agent/blob/e6f57427c198cfd96854522b7a9159eb007e13c2/LICENSE) 与技能声明一致。
- 社区实现，不是 Anthropic 官方技能；不把名称相近的其他仓库、Sketch 绘图风格或 Claude Design 网页产品冒称为此来源。
- 用官方本机 skill-installer 的固定 SHA 稀疏安装方式安装到 `~/.codex/skills/claude-design` 和 `sketch`，附许可证及 `SOURCE.json` 哈希。本轮已手动读取并应用；下轮可作为已安装技能使用。
- 上游提到的 Hermes 专属浏览器工具映射为现有 Playwright / 截图工具；不执行示例中的可选 npx/GSD 安装，不增加模型服务、全局 hook 或外部 CDN。隐私和既定项目约束高于示例默认值。

## 先审视而非重做

使用当前 `f60bc10` / `20261018-selection-library` 的代码、截图和发布回执作为基线，不重复实现选字、主题或书城。固定视觉是 2077；任务表面是 Operate / Read。

只读控件盘点后，未把“隐藏文件 input”这种常见原生触发模式或可键盘激活的按钮误判为缺陷。选择的实际改善点是：首次进入的空态指引；播放与原文之间的视线/焦点衔接；重复示例造成的副本；加载时的状态播报；空书签的可操作解释。

## 两个草图与结论

- `sketches/001-guided-reading/index.html`：保留双窗口，只在首次进入给出任务路径，播放与回看互相可达。
- `sketches/002-focus-lane/index.html`：速读优先，原文折叠；更少干扰，但需要额外打开原文，削弱已确认的选字主路径。

采用第一个的原则，不把草图当成生产代码直接复制，不更改定位/权限/收费/存储架构。第二个仅作对比，不部署。

## 已实现与验收边界

采用双窗口方向实现：首次阅读引导；示例复用原文档与进度；显式播放/回看焦点跳转；静态播放状态和键盘帮助；书城下载/校验状态播报；空书签说明。不增加持续动画、不按播放节拍播报每个文字片段。

本地 5 项单元测试、TypeScript/Vite 构建、既有浏览器回归与选字/书城回归均通过。两个草图在 1440px / 390px 上进行真实状态切换、溢出与页面错误检查，并查看截图。新增 `tests/product-journey-browser.mjs` 纳入 CI，覆盖首次试读、示例去重/进度、双向焦点、回看暂停、键盘与加载状态。发布时以独立 `docs/releases/` 回执记录线上结果与回滚，不用本地测试代替生产验收。

保留限制：实体 iPhone/iPad/Safari 的系统选字手柄尚未实机验证；不把桌面 Chrome 的窄屏测试称作 iOS 验收。原有浏览器本地存储边界、备份仅导出和扫描 PDF 需要 OCR 等限制未改变。

发布回执：[`20261018-product-journey`](../releases/20261018-product-journey.json)。线上已通过原有回归、选字/书城回归、新用户路径回归，15 个文件 SHA-256 与产物一致；仅更新 CybeReader 独立容器。

## 其他机器复现安装

用该机器的 skill-installer，从 `NousResearch/hermes-agent` 的固定 commit `e6f57427c198cfd96854522b7a9159eb007e13c2` 安装两个路径：`skills/creative/claude-design` 和 `optional-skills/creative/sketch`。先核对 `SKILL.md`、MIT 许可及目录仍无可执行依赖；不要用名称相近的技能替代。技能安装是本机操作，不随本项目的 Docker 镜像自动安装。
