# PetoiWebCoding 开发交接 · 2026-11-26

接续 2026-11-25 的连接功能开发。当前基线为本地 `main` 的 `470f274`，`main.html` 和 `lang/translations.js` 还有待验证的 macOS 蓝牙串口与 BLE 筛选改动。先用 `git status --short --branch` 和 `git diff -- main.html lang/translations.js` 核对基线，并带着这两处改动开始验收。当天改动与代码级检查见 [2026-11-25 工作总结](PetoiWebCoding_工作总结_2026-11-25.md)。

## 启动与准备

在项目根目录执行 `npm start`，用桌面 Chrome 打开 [本地积木编辑器](http://localhost:8080/main.html)。缺少 `http-server` 时执行 `npm install`。项目是静态页面，无构建步骤，仓库未配置自动化测试套件。验证 Wi-Fi 运行时，让电脑和机器人接入同一局域网。首次验证各链路时，可用只查询设备身份的短程序，便于比对发送指令和响应。

## 实机验收顺序

| 顺序 | 场景与操作 | 通过标准 |
| --- | --- | --- |
| 1 | **macOS 蓝牙串口**。在 macOS 配对机器人，在 Chrome 选择「快速连接 → 蓝牙 → 蓝牙串口」。如果出现同一设备的多个条目，选择 `cu.` 项。再分别验证取消选择、选中 USB 项，以及选择后打开失败的情况。 | 正确条目连接成功，`?` 收到设备响应，积木值可用于运行。实际设备名可用时显示设备名，仅有通用标签时允许显示 `Bluetooth SPP`。取消或失败后可重选。点击已连接的蓝牙串口名称，关闭成功后返回连接方式窗口。积木仍指向该设备时恢复默认值。 |
| 2 | **BLE 筛选与重连**。用 Quaddle 及其他可用的 BLE 机型，记录真实广播名后打开 Chrome BLE 选择框。条件允许时，同时开启 JDY-23 和广播自定义名称的样机。连接、运行、断开后再连接。 | Chrome 接受整组筛选条件，符合规则的设备可见并能建立 GATT 连接。广播 `0xFFE0` 的设备被排除。连接后积木、按钮和监视器显示同一 BLE 名称。断开时，如果积木仍显示该名称，恢复连接前的值。 |
| 3 | **USB 查询 Wi-Fi 地址**。分别在 USB 已打开和未打开时选择「快速连接 → Wi-Fi」。后者先取消一次端口选择，再选中机器人 USB 端口。另测设备返回默认 AP 地址、超时和 NyBoard。 | 已打开的 USB 端口直接复用，首次连接弹出 USB 选择框。`w` 仅经 USB 查询路径发送，监视器可见 `> w`。有效 IP 同步到积木和按钮，默认 AP 地址或无有效响应进入配置窗口。NyBoard 跳过自动 `w` 查询。 |
| 4 | **运行链路与关闭回归**。保持 USB 在线，在积木选中已查到的 IP 后运行，再关闭 USB。另测积木仍指向 USB 时关闭串口，以及指向默认地址时点击「运行」后的选择、取消和重选。对支持相机或手势的设备补测 Wi-Fi 返回值。 | IP 选中后，运行及传感器读取走 Wi-Fi，关闭 USB 后 IP 仍保留。关闭仍被积木引用的 USB 端口后，积木恢复 `192.168.4.1`。按「运行」可重新选择 USB，取消保持待机，重选成功后继续运行。 |
| 5 | **其他平台与语言**。在可用的 Windows 或 Linux 桌面 Chrome 验证蓝牙串口选择和 USB 连接。切换中文、英文、日文，并核对积木、监视器和按钮。 | 各平台的连接入口可用，macOS 专用提示仅在 macOS 出现。快速连接说明与帮助页一致，切换语言后已连接的设备名称仍可辨认。 |

每个场景记录系统与 Chrome 版本、机器人型号、板卡与固件版本、选择框显示名、连接前后积木值、发送指令与实际链路、预期和实际结果。异常时保留串口监视器与浏览器控制台日志。实机测试结果待填写。

## 后续完善

1. **先确认 BLE 筛选兼容性**。当前实现会传入 3,084 条完整名称条件，代码检查只覆盖条件生成。按实机结果核对 Chrome 是否接受整组条件，以及已支持固件是否存在小写十六进制编号、不同大小写前缀或自定义广播名。有漏选时先记录真实广播名和固件版本，再调整匹配规则并回归 SSP 与 JDY-23 的排除行为。
2. **再完善 macOS 选择失败后的恢复**。网页目前靠端口元数据初筛，`cu.` 条目由用户在 Chrome 选择框中识别。若发现选错同名条目、端口被占用或打开失败后难以重选，保留浏览器错误和端口元数据，优先修正提示及重试流程。
3. **补齐连接切换的回归结果**。重点记录取消选择、串口写入流或端口关闭超时，以及积木已选中 Wi-Fi IP 时再关闭串口的行为。依据验收结果更新帮助页中的三语操作说明。

## 代码入口

| 位置 | 职责 |
| --- | --- |
| [main.html](main.html) · `quickConnect()`、`showQuickConnectChooser()`、`connectQuickWifiOverSerial()` | 连接方式弹窗、关闭当前 SPP 后重选、选择或复用 USB |
| [main.html](main.html) · `openSerialPort()`、`openSerialPortWithRetry()`、`getSerialDevice()`、`closeSerialPort()` | 系统端口选择、连接与释放、串口名称和积木默认值 |
| [main.html](main.html) · `buildBleDeviceNameFilters()`、`connectBleSerial()`、`showBleNameOnConnectionBlock()`、`restoreConnectionBlockAddress()` | BLE 设备筛选、GATT 连接、积木设备名称和断开恢复 |
| [main.html](main.html) · `queryWifiAddressOverSerial()`、`ingestSerialChunk()`、`selectWifiAddress()` | 发送 `w`、解析回复、同步 Wi-Fi 地址和回退配置 |
| [main.html](main.html) · `runCode()`、`executeRunCode()`；[blocks/generators.js](blocks/generators.js) | 运行链路选择、生成指令、动作完成等待、相机与手势响应 |
| [lang/translations.js](lang/translations.js) · `quickConnectMacSerialHint`、`quickConnectHint`；[help.html](help.html) · `manualQuickConnectDesc` | 三语连接提示和帮助文案 |
