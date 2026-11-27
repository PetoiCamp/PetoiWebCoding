# PetoiWebCoding 发布分级使用说明

`APP_RELEASE_LEVEL` 是 [main.html](main.html) 中的 JavaScript 常量，用于设置编辑器的页眉标识和「快速连接 → 蓝牙」的选择流程。对外发布使用 `release`，需要在同一入口测试低功耗蓝牙和经典蓝牙串口时使用 `internal`。

## 两种分级的行为

| 配置值 | 页眉 | 「快速连接 → 蓝牙」 |
| --- | --- | --- |
| `release`（默认） | 显示版本日期，例如 `v2026.11.27`。 | 从连接方式菜单点击「蓝牙」，直接打开 Chrome 的 BLE 设备选择器。 |
| `internal` | 在版本日期旁显示「内部调试版」（英文 `Internal Debug`，日文「内部デバッグ版」）。 | 从连接方式菜单点击「蓝牙」，再选择「低功耗蓝牙 (BLE)」或「蓝牙串口」。前者打开 BLE 选择器，后者打开经典蓝牙串口选择流程。 |

两种分级均可使用「快速连接 → Wi-Fi」。两者也都提供 Console 面板的「详细」和「调试」按钮，刷新页面时默认关闭。

| Console 按钮 | 适用场景 |
| --- | --- |
| 📋 详细（Verbose） | 核对网页发送给机器人的命令和收到的应答。 |
| 🐛 调试（Debug） | 查看连接、程序执行、设备返回值解析等诊断信息。打开后，部分传感器积木也会自动输出读数。 |

## 在本地切换

1. 在测试分支或本地副本中打开 [main.html](main.html)，搜索 `const APP_RELEASE_LEVEL`。
2. 修改引号中的值并保存。内部联调使用以下设置。验证正式版时，把 `'internal'` 改回 `'release'`。两个值均为小写。

   ```js
   const APP_RELEASE_LEVEL = 'internal';
   ```

3. 如果本地服务已启动，在桌面 Chrome 刷新 [编辑器](http://127.0.0.1:8080/main.html)。如果页面仍显示旧配置，按 **Ctrl + F5** 强制刷新，再确认服务指向修改过的项目目录。
4. 对照上表检查页眉和蓝牙入口。测试 BLE 时开启系统蓝牙并选择机器人。测试经典蓝牙串口时先在系统中配对，再从 `internal` 的「蓝牙串口」入口选择设备。需要排查通信时，可按需打开 Console 的「详细」或「调试」。

## Windows 本地启动

有 Python 时，在 PowerShell 或命令提示符运行以下命令。显式指定目录可以避免因终端当前位置不对而出现 `main.html` 404。

```powershell
python -m http.server 8080 --bind 127.0.0.1 --directory "D:\Petoi\web_coding_block\PetoiWebCoding"
```

使用项目的 npm 启动脚本时，先确保终端能运行 Node.js 和 npm。以下命令用于 PowerShell。首次缺少依赖时执行 `npm install`，之后可直接运行 `npm start`。

```powershell
Set-Location -LiteralPath "D:\Petoi\web_coding_block\PetoiWebCoding"
npm install
npm start
```

任选一种服务，保持终端窗口运行，在 Chrome 打开 [本地编辑器](http://127.0.0.1:8080/main.html)。测试结束后回到终端按 **Ctrl + C**。直接打开 `index.html` 可快速检查界面。遇到 `file://` 来源的资源加载错误时，用本地 HTTP 服务复测。

## 对外发布与内部部署

- **对外发布**。在准备发布的 `main` 代码中确认 `const APP_RELEASE_LEVEL = 'release';`，检查页眉和蓝牙入口后，按仓库流程推送到 `main`。GitHub Pages 工作流会将静态文件原样打包部署，仓库配置的正式域名为 `code.petoi.com`。[部署工作流](.github/workflows/deploy-pages.yml) · [域名配置](CNAME)
- **内部联调**。在测试分支或本地副本中设为 `internal`。团队需要共享测试站时，可部署同一份静态代码到由部署环境控制访问权限的独立地址。仓库现有工作流的自动触发分支为 `main`。
- **配置位置**。切换时直接修改 `main.html` 并重新载入页面。该变量是浏览器读取的静态源码配置，内部站点的访问权限由部署环境配置。
