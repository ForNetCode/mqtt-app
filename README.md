# MQTT-EXEC
本项目解决的问题：在浏览器里远程执行 Shell 命令，并查看执行结果。

相比于VPN，该项目代码可集成到只有 MQTT 交互的设备上，本项目的价值在于参考实现。

## 实现原理

在宿主上运行 `mproxy` 命令行可执行程序，通过 MQTT 连接 MQTT Server，并订阅 command 主题消息。
    
浏览器通过 MQTT Websocket 连接 MQTT，获取订阅消息并展示。

### 协议交互
交互协议走 json 字符串。
```json5
# Web websocket-mqtt send
# publish topic:  $clientId/cmd
{
  cmd: "ls",
  requestId: "random_to_track",
  #stream: false， # can be empty, default is false. this project now only support false.
}

# mproxy response
# publish topic: $client/cmd/resp
# success response        
{
  type: "Ok"      
  data: "abc.txt/nccn.txt",
  requestId: "random_to_track",
  pid: 39512, #process id
  seq: 1 #some may resp more than one time, so set seq to keep order.
}
# failure response
{
  type: "Err",
  message: "response data"
  requestId: "random_to_track"
}
```
### 配置文件
参考 [config.yml](./agent/config.yml)

### 开发
Install [Rust 1.70+](https://www.rust-lang.org/),
[Node v18](https://nodejs.org/), [NPM v9](https://www.npmjs.com/), and
[mprocs](https://github.com/pvolok/mprocs). Then, run
```shell
cd web && npm ci && cd ../
cd develop && ./run_mqtt.sh && cd ../
mprocs

# this is check MQTT agent if is OK
cd agent && cargo run --example publish_command.rs
```
Web [Figma UI](https://www.figma.com/design/iyL4dms3B8AWGZS14FCRuf/RMQTT-EXEC?m=dev&node-id=0%3A1&t=aXOx1pkofASiwbPa-1)
## 限制
目前只支持普通的命令, 不支持 `sudo xxx` 之类命令。

### 应用场景举例
1. 执行 `sshx`, 暴露 shell 给远端。
2. 执行 `free -h`, 查看当前服务状况。
