# MQTT-SHELL
本项目解决的问题：在浏览器里远程执行 Shell 命令，并查看执行结果。

相比于VPN，该项目代码可集成到其他 MQTT 客户端逻辑上，本项目的价值在于参考实现。

## 实现原理

在宿主上运行 `mshell` 命令行可执行程序，通过 MQTT 连接 MQTT Server，并订阅 command 主题消息。

浏览器通过 MQTT Websocket 连接 MQTT，获取订阅消息并展示。


### 应用场景举例
1. 执行 `sshx`, 暴露 shell 给远端。
2. 执行 `free -h`, 查看当前服务状况。
