# 收录到 dsh 插件市场（awesome-dsh-plugin）

投稿规范见 https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md

仓库已发布：<https://github.com/ifengz/dsh-compactUI>

## 本仓库已满足的部分

| 规范要求 | 状态 |
| --- | --- |
| `package.json` 声明 `dsh.bundle.patch` | 已声明（`./cordis.patch.yml`） |
| 仓库根有 `cordis.patch.yml` | 已提供 |
| 真实可用代码，非占位 | `client.js` 约 1000 行，实机验证 |
| 浏览器端 UI 需声明 `dsh.client.platform` | 已声明 `web` |
| 截图：包目录放 `screenshots.json`（1–8 张） | 已提供 `["sidebar.png","menu.png"]` |
| 官方 `@deepseek-ai/*` 依赖用 peerDependencies | 本插件无任何依赖，无需 peers |
| 不是纯聚合包（自带行为） | 是插件本体，非聚合包 |
| `package.json` 的 `repository` / `homepage` / `bugs` | 已填 `github.com/ifengz/dsh-compactUI` |

## 还需要在 GitHub 上做的

1. 给仓库加 topic：`dsh-plugin`。
2. 仓库创建满 1 天后才能通过 CI 的年龄检查。
3. 往 awesome-dsh-plugin 提一个 PR，只加一个文件 `data/plugins/ifengz__dsh-compactUI.yml`，内容见同目录 `awesome-entry.yml`。

## 可选

- **发 npm**：`npm publish`。发布包的 `repository` 字段必须指回被收录的那个仓库，市场才会把两者关联起来；不发布也不影响收录。
- **发预构建包**：把 `npm pack` 产出的 tgz 传 GitHub Release，条目里加 `tarball:` 指向它，安装可跳过构建授权。
