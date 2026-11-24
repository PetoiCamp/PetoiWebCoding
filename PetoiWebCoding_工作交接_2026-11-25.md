# PetoiWebCoding 工作交接 · 2026-11-25

交接自 2026-11-24。连接方式切换和 USB 关闭后恢复已完成代码修改与模拟验证，优先用实机确认浏览器选择框、实际端口名和指令走向。改动仍在本地工作树中，继续开发前先用 `git status --short` 和 `git diff` 核对。

## 启动

在项目根目录运行 `npm start`，打开 [本地积木编辑器](http://localhost:8080/main.html)。如果缺少 `http-server`，先执行 `npm install`。Wi-Fi 实测时，让电脑和机器人处于同一网络，使用本地页面。项目没有配置自动化测试套件。

## 实机验收顺序

1. **复测 USB 关闭后重连**。未连接设备时，通过「Connect Serial Port」选择 USB 串口。核对积木显示真实端口名或 `USB Serial`，运行一个简短的积木程序。点击串口监视器的「Close」，确认积木恢复为 `192.168.4.1`。再次点击「运行」，确认弹出 USB 选择框。先取消一次，确认保持待机，再次选择设备并确认程序通过 USB 继续运行。
2. **复测从串口切换到 Wi-Fi**。USB 保持连接时点击「快速连接」。在支持查询的设备上确认收到有效 IP 后，积木和按钮都显示该 IP。保持 USB 连接并运行，确认程序通过该 IP 的 WebSocket 执行。随后关闭 USB，确认积木仍显示已选择的 Wi-Fi IP。另测一次设备回复 `192.168.4.1` 或无响应时的配置弹窗。
3. **复测蓝牙**。有对应设备时，分别验证蓝牙串口（SPP）和 BLE。核对积木显示蓝牙名称，运行使用所选蓝牙链路。确认直接连接和正常运行期间没有自动发送 `w`。
4. **验证 Wi-Fi 传感器**。保留 USB 连接并让积木指向 Wi-Fi IP。设备有相机或手势传感器时，确认积木读取的是 Wi-Fi 返回值，尤其是在 Wi-Fi 没有有效数据时。

记录浏览器和系统版本、设备型号与固件版本、选择框显示的名称、积木值、实际链路和异常日志。标准 Web Serial 不提供系统端口名。选择框显示 `COM90` 而积木显示 `USB Serial` 时，可手填 `COM90` 验证 USB 运行。

## 代码入口

| 位置 | 用途 |
|---|---|
| [main.html](main.html) 中的 `runCode()`、`executeRunCode()` | 读取积木值、选择运行链路、发送程序指令 |
| [main.html](main.html) 中的 `getSerialDevice()`、`openSerialPort()`、`closeSerialPort()` | 获取设备显示名、连接和关闭串口、恢复积木默认值 |
| [main.html](main.html) 中的 `queryWifiAddressOverSerial()`、`ingestSerialChunk()`、`selectWifiAddress()` | 查询和解析 IP，同步积木与「快速连接」按钮 |
| [blocks/generators.js](blocks/generators.js) | 连接积木代码生成、动作完成等待、相机与手势响应 |
| [lang/translations.js](lang/translations.js) 和 [help.html](help.html) | 界面提示及用户帮助 |

今天的改动和已完成验证见 [2026-11-24 工作总结](PetoiWebCoding_工作总结_2026-11-24.md)。
