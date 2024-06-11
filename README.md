# MQTT-UTIL
## MQTT-EXEC
本项目解决的问题：远程执行 Shell 命令，并查看执行结果。

相比于VPN，该项目代码可集成到只有 MQTT 交互的设备上，本项目的价值在于参考实现。

### 快速开始
1. 下载压缩包：[release page](./releases), 解压缩，并 chmod a+x `mproxy` `mpublish`
2. 跑 mqtt server， [这里](./shell/dev) 有如何快速跑测试 rmqtt 的例子，执行 `run_rmqtt.sh` 即可，生产环境参考 [prod](./shell/prod) 目录下的配置。
3. 编写配置文件：`mproxy.yml`,`mpublish.yml`, 可参考[agent](./agent) 目录下的同名文件，两者要和bin文件放在同一个目录下。 
```sh
# 执行 mproxy
./mproxy 
# or run with config
./mproxy where/path/mproxy.yml

# 向 mproxy 分发指令 
./mpublish -- ls -ls
# or run with config
./mpublish --config=where/path/mpublish.conf -- ls -ls

```

### 实现原理

在宿主上运行 `mproxy` 命令行可执行程序，通过 MQTT 连接 MQTT Server，并订阅 command 主题消息。
    
`mpublish`，通过MQTT发布指令消息到`mproxy`的订阅上，并获取指令返回值展示。

### 协议交互
交互协议走 json 字符串。
```json5
// Web websocket-mqtt send
// publish topic:  cmd/$clientId
{
  command: "ls",
  requestId: "random_to_track",
  t: "Cmd"
  //stream: false， // can be empty, default is false. this project now only support false.
}
```
```json5
// mproxy response
// publish topic: cmd/$client/resp
// success response        
{
  t: "D",
  data: "abc.txt/nccn.txt",
  reqId: "random_to_track",
  pid: 39512, //process id
  seq: 1 //some may resp more than one time, so set seq to keep order.
}
```
```json5
// failure response
{
  t: "Err",
  message: "response data",
  reqId: "random_to_track"
}
```
```json5
// finish response
{
  t: "Ok",
  reqId: "random_to_track",
  pid: 39512, //process id
}
```
### 配置文件
参考 [mproxy.yml](./agent/mproxy.yml) 和 [mpublish.yml](./agent/mpublish.yml)
mproxy 默认配置文件为当前目录 mproxy.yml
mpublish 默认配置文件为当前目录 mpublish.yml

### 开发
Install [Rust 1.70+](https://www.rust-lang.org/),
[mprocs](https://github.com/pvolok/mprocs). Then run
```shell
cd shell/dev && ./run_mqtt.sh && cd ../../
mprocs

# Check MQTT agent if is OK
cd agent && cargo run --bin mpublish -- --config=mpublish.yml -- ls -ls
```

### 限制
目前只支持普通的命令, 不支持 `sudo xxx` 需要额外输入，以及 `ls | grep xx` 使用 pipeline 的指令。

### 应用场景举例
1. 执行 `sshx`, 暴露 shell 给远端。
2. 执行 `free -h`, 查看当前服务状况。

### Linux Systemd部署
1. `chmod a+x mproxy && mv mproxy /usr/local/bin/`
2. 创建配置文件 `/etc/mproxy/mproxy.xml`
3. 将此文件 [./shell/mproxy.service](./shell/mproxy.service)  拷贝到 `/etc/systemd/system/mproxy.service`
4. 重启 systemd `systemctl daemon-reload`
5. `systemctl enable mproxy`, `systemctl start mproxy`


## MQTT-LOG
本项目基于MQTT解决远程查看日志的问题。提供Log Viewer Web 和 SDK（Typescript）。目录为 logViewer。

### MQTT 协议交互
```json5
// 下发配置, 并启动日志上传
// topic: conf/log/$clientId
{
logLevel: "debug",// debug/info/warn/error
qos: 0,// 0|1|2
}
```
```json5
// 上传日志
// topic: log/$client
// 参考 loglevel 的定义
{
time: 202030044123, //timestamp
log: ['',{},], //..... first message, others args(console.log format)
num: 0, // number to index log level:  trace:0, debug:1,info:2,warn:3,error:4
name: 'LoggerName', // undefined or string
}

```

### 快速开始
#### 部署 RMQTT Broker
生产环境可参考：生产环境参考 [rmqtt prod](./shell/prod) 目录下的README。
#### 客户端集成 mqtt.js
```shell
npm install --save mqtt
npm install --save abortcontroller-polyfill # this is for wechat mini program
```
```typescript
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only' // add it at app.ts

import log from 'loglevel'
import mqtt from "mqtt";


export async function start_mqtt_report(unionId:string) {
    const mqttServer = 'wx://???'
    const webMQTTServer = "ws://???"
    const webLogView = "http://???/login"
    const clientId =  `log_${unionId}_mini`

    await client_init(mqttServer, clientId)
    const auth = encodeURIComponent(JSON.stringify({
        server: webMQTTServer,
        clientId: `log_${unionId}_web`,
        topic: {
            topic: `log/${clientId}`,
            confTopic: `conf/log/${clientId}`,
            qos: 0,
            logLevel: 'debug',
        },

    }))
    return `${webLogView}?auth=${auth}`
}

let client: mqtt.MqttClient|undefined
export async function client_init(url: string, clientId: string){
    if(client) {return}
    const configTopic = `conf/log/${clientId}`
    const messageTopic = `log/${clientId}`
    client = mqtt.connect(url, {
        clientId,
        rejectUnauthorized: true,
        timerVariant: 'native',
    })

    client.on('message', (topic:string, payload) => {
        if (topic === configTopic) {
            const message = JSON.parse(payload.toString())
            log.setLevel(message.logLevel)
        }
    })

    client.subscribe(configTopic, {qos: 2, })
    const originalFactory = log.methodFactory
    log.methodFactory = (level,num, name) => {
        const rawMethod = originalFactory(level,num, name)
        return (...message) => {
            rawMethod(...message)
            if(client?.connected) {
                const data =
                    JSON.stringify({
                        time: Date.now(),
                        log: message,
                        num,
                        name,
                    })
                client?.publish(messageTopic, data, {qos: 0})
            }
        }
    }
}



```

#### 打开 MQTT Log Viewer
1. 自行编译 logViewer 项目，并部署

### 开发
Web [Figma UI](https://www.figma.com/design/iyL4dms3B8AWGZS14FCRuf/RMQTT-EXEC?node-id=0%3A1&t=rnIL1LSWwQIXfZdf-1)

install Node 20+, [mprocs](https://github.com/pvolok/mprocs). Then run
```shell
mprocs -c mprocs.log.yaml
```
### 应用场景
1. 微信小程序定位问题，需要多人查阅时。（没有接入第三方上报日志SDK）
2. TODO

## MQTT-AUTH-SERVER
针对上述场景，为 RMQTT 开发了简易 auth-server，代码在 [authServer](./authServer) 目录。
### Auth 和 ACL 规则
不校验 username 和 password， 只校验 clientID 构造方式是否满足。 Topic 订阅、发布ACL依据上述 MQTT 协议交互进行限制。
#### MQTT-EXEC
发布Shell指令端 clientID: `shell_${anything}_admin` 。
接收Shell指令端 clientID: `shell_${anything}_agent`。
#### MQTT-LOG
上报LOG端 clientID：`log_${anything}_mini`。
查收LOG端 clientID：`log_${anything}_web`。

### 部署
#### Docker
```
# port is 5800
docker run -d --network=host --name=auth-server ghcr.io/fornetcode/mqtt-util-auth-server:latest
```

### 注意
`MQTT-AUTH-SERVER` 只是模版性代码，切不可用于生产部署。
