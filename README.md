# dsh-compactui

把 DeepSeek Harness（DSH）左侧栏改成 Codex 风格的紧凑布局：顶部大 Logo + 内联搜索，中间「置顶 + 工作区」，底部把插件类入口收进一个浮层菜单，需要哪条再从浮层里加回侧栏。

仓库：<https://github.com/ifengz/dsh-compactUI>

![侧栏](1-sidebar.png)

## 三件事

| 序号 | 你在界面上做什么 |
| --- | --- |
| 1 | 顶部一行放完 Logo、搜索、菜单；下面是细条「新会话」、置顶、工作区 |
| 2 | 点菜单按钮，插件类入口从竖排变成浮层里的一小串，每条右边有 ＋，点一下就加回侧栏 |
| 3 | 点放大镜，搜索框原地顶掉 Logo，边打边过滤会话；置顶区单独一块，可以折叠 |

## 1. 侧栏整体

（就是文首那张图）顶部一行放完 Logo、搜索、菜单，下面按「新会话 → 置顶 → 工作区」竖排。

- **品牌行**：高度 56px，Logo 26px，名称 16px/600；右侧紧挨着「搜索」和「菜单」两个 28px 图标按钮。
- **新会话**：从居中大按钮改成贴左、34px 高的细条按钮。
- **置顶**：有置顶会话时才出现的可折叠区块，排在「工作区」上方。
- **工作区**：完全保持宿主原样（项目分组 + 会话行 + 展开其余会话）。

## 2. 入口收进浮层

侧栏里那些插件类入口（插件、插件市场、自动化任务、更多……）原本竖排占好几行，现在全部搬进浮层，浮层贴着菜单按钮弹出。

![浮层菜单](2-popover.png)

### 2-1 点 ＋ 加回侧栏

浮层里每一条右侧都有一个淡蓝 ＋，点它就把这条加回侧栏。

![点 ＋ 添加](2-1-add.png)

### 2-2 加回来的样子

入口以普通竖排行出现在「新会话」正下方，位置与原生面板行一致；右侧有一个弱化减号（`−`，默认 35% 透明度，悬停变实），点它把入口收回浮层。

![常驻行与减号](2-2-promoted.png)

已经加回侧栏的条目，在浮层里显示为勾号而不再是 ＋。像「更多」这种本身会弹子菜单的入口，点开后子菜单直接贴在浮层下方展开（不再弹回宿主原来的位置），主浮层保持打开。

## 3. 内联搜索

点放大镜后，搜索框占据左侧 Logo 的位置（Logo 与两个按钮暂时隐藏），边打边过滤侧栏会话；回车打开第一条命中项，Esc 或 ✕ 退出并复原。

![内联搜索](3-search.png)

### 3-1 置顶区

置顶会话单独一块，标题「置顶」可折叠；每行右侧 ✕ 是「取消置顶」，点条目本身则打开对应会话。

![置顶区](3-1-pin.png)

关键点：**置顶列表持久化在 localStorage**。DSH 在项目折叠时会把该项目的会话行从 DOM 卸载，纯靠扫描 DOM 的实现会在折叠后丢失置顶项；本插件把置顶会话记录在本地，折叠项目后条目仍在，点条目会自动展开对应项目再打开会话。

侧栏常驻的导航行同样持久化在 `localStorage["dsh-compactui:promoted"]`，重启后仍在；宿主里新增或删除插件时，浮层每次打开都重新读取宿主导航，所以新插件会自动出现在浮层里、可以直接「添加」。

## 4. 切回原生布局（不用重启）

浮层里有一条「切换为原生布局」：点一下，注入的样式与代理节点立刻撤掉，侧栏马上变回 DSH 原样，**不需要重载页面、也不需要停用插件**。切过去之后，想切回来就点侧栏里的「更多」——子菜单最下面多了一条「切回紧凑布局」，点它立刻回到紧凑布局。两种状态记在 `localStorage["dsh-compactui:native"]`，重载或重启后保持。

> 为什么不做「停用插件即恢复」：宿主在进程启动时就把客户端插件清单注册好了，停用插件后**页面重载无效**（实测停用后重载，注入的 `<style>` 与按钮仍在）。停用要彻底生效只能退出整个 DSH 再打开。所以恢复原生布局走上面这个即时开关。

## 实现方式

全部改动在浏览器端（`client.js`），宿主侧 `index.js` 只是一个空 `apply()` 占位，用来让 cordis 认作合法插件。

1. **样式注入**：`<style id="dsh-compactui:style">` 一次性注入，选择器统一写成 `[class*="_logoRow"]` 这类稳定片段。DSH 的 CSS Modules 类名带构建期哈希（`_logoRow_1abc2_3`），写死哈希的插件一升级就失效，所以这里只匹配局部片段。
2. **不移动宿主节点**：React 管理的 DOM 被搬走后，下次重渲染会把界面拆掉。因此原「面板导航」行用 CSS 隐藏，浮层里放**克隆按钮**，点击时按文案找回仍然活着的原按钮并 `.click()`，交给宿主自己的逻辑处理跳转。
3. **置顶持久化**：置顶会话记录成 `[{ "t": "会话标题" }]`，写入 `localStorage["dsh-compactui:pinned"]`。每次渲染先扫一遍 DOM 里活着的置顶行（`aria-label` 含「已置顶」）补写记录；宿主里被取消置顶的行会被移除记录。首次启动且本地列表为空时，会临时展开折叠的项目扫一遍再收回，保证已有置顶不丢。
4. **跟随重渲染**：`MutationObserver` + `requestAnimationFrame` 去抖，宿主重渲染后补齐自己的节点；`ctx.effect` 的 dispose 负责把注入的样式与节点全部移除。
5. **添加入口**：浮层与侧栏常驻行都是宿主原行的**克隆**，点击时按文案找回活的原行再 `.click()`；「添加 / 减号」只改 `localStorage["dsh-compactui:promoted"]` 里的文案列表，然后重建克隆节点，不动宿主 DOM。
6. **不挡窗口拖动**：侧栏顶部两行是宿主的窗口拖拽区（`data-window-drag`），拖拽区会吞掉鼠标事件。浮层打开时插件把拖拽区临时改成 `no-drag`，浮层自己也是 `no-drag`，所以浮层周边都点得动，拖动窗口仍然只靠那两行空白处。
7. **原生 / 紧凑切换**：切原生时移除 `<style id="dsh-compactui:style">`（宿主被隐藏的节点靠 CSS 还原，所以撤样式即复位），同时删掉自己插入的代理节点（品牌行工具条、常驻行、置顶区、搜索框），用一个 `state.native` 标记让 `ensure()` 直接短路、不再重建。原生态下监听侧栏「更多」那一行的 `pointerdown`，等宿主子菜单出现后，克隆一条菜单项挂进同一个菜单容器，文案改为「切回紧凑布局」，点它就反向执行一遍切回紧凑。标记存 `localStorage["dsh-compactui:native"]`，重载后自动恢复上次状态。

## 兼容性

- 开发与验证环境：DSH 桌面版 **0.2.2-rc.1**（Windows 与 macOS 都跑过；macOS 上顶部两行单独压紧，Windows 布局不受影响）。
- 只作用于 Web/桌面渲染层（`dsh.client.platform = "web"`），不涉及服务端；CLI 与纯 API 使用不受影响。
- 依赖的是**类名局部片段**和 `aria-label` 文案（「搜索会话」「已置顶」「取消置顶」「置顶会话」）。宿主大改侧栏结构或改这些文案时需要跟着调整。
- 与其它改侧栏的插件可能互相覆盖（同一批 DOM、同一批 CSS 优先级）。已经用了同类侧栏插件的话，建议只留一个。

## 安装

从 npm（发布后）：

```bash
dsh plugin --profile web add dsh-compactui
```

从本地目录或压缩包：

```bash
dsh plugin --profile web add file:C:/path/to/dsh-compactui
dsh plugin --profile web add C:/path/to/dsh-compactui-0.5.11.tgz
```

装完后刷新页面（桌面版在 DevTools 里 `location.reload()`，或重启 DSH）。

## 卸载

```bash
dsh plugin --profile web remove dsh-compactui
```

卸载后需要重开 DSH 才会回到原样（插件客户端代码在启动时注册）；如果只是想要原生布局，用浮层里的「切换为原生布局」即可，不必卸载。`localStorage` 里会留下 `dsh-compactui:pinned`、`dsh-compactui:promoted`、`dsh-compactui:native` 三条记录，需要的话手动清掉。

## 已知限制

- 置顶记录按**会话标题**匹配。会话改名后，旧记录不会自动跟随，需要重新置顶一次。
- 会话被彻底删除后，其置顶记录只能通过条目上的 ✕ 手动清除。
- 首次启动的「临时展开项目扫一遍」会让折叠的项目闪一下，这是为了让已有置顶在第一次就能显示出来。
- 常驻行同样按**入口文案**记录，宿主把某个入口改名后会变成一条点不动的旧记录，用减号收回即可。

## 目录结构

```
dsh-compactui/
├── index.js           # 宿主侧空插件（cordis 占位）
├── client.js          # 全部界面逻辑与样式
├── cordis.patch.yml   # 注册插件：- insert: [{ id: compactui, name: dsh-compactui }]
├── package.json       # dsh.bundle.patch + dsh.client.platform=web
├── 1-sidebar.png      # 侧栏整体
├── 2-popover.png      # 浮层菜单
├── 2-1-add.png        # 点 ＋ 加回侧栏
├── 2-2-promoted.png   # 加回来的常驻行与减号
├── 3-search.png       # 内联搜索
├── 3-1-pin.png        # 置顶区
├── screenshots.json   # 插件市场截图清单（顺序同上）
└── README.md
```

## 收录到插件市场

按 [awesome-dsh-plugin 投稿规范](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md) 准备：

- `package.json` 已声明 `dsh.bundle.patch`（这是能被 `dsh plugin add` 安装的关键，只写 `dsh.client` 会被拒）。
- 仓库根有 `cordis.patch.yml`。
- 截图按规范放在包目录的 `screenshots.json`（1–8 张，相对路径）。
- 投稿 PR 只加一个文件 `data/plugins/<owner>__<repo>.yml`，模板见同目录 [`awesome-entry.yml`](awesome-entry.yml)。
- 仓库需加 `dsh-plugin` topic，且创建满 1 天。

细节与清单见 [`SUBMIT.md`](SUBMIT.md)。

## License

MIT
