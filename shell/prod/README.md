## RMQTT Production Config

相比于开发配置:
1. 禁用了 websocket socket。
2. 在 rmqtt-acl 添加了简单的权限配置。


### 使用 RMQTT 注意事项
#### 默认 ACL 注意事项
1. connect 和 pubsub 要单独配置，例如
```toml
rules = [
  ["allow", { user = "nodes", password ="password" }, "connect"],
  ["allow", { user = "nodes" }, "pubsub", ["cmd/%c", "cmd/%c/resp"]] 
]
```
2. clientId 会和 user 一一对应，不要随意更改。
#### 重启
目前 RMQTT 使用docker restart 重启，会出现端口占用问题 https://github.com/rmqtt/rmqtt/issues/58
