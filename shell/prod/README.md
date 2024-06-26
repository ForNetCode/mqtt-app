## RMQTT Production Config

相比于默认配置:
1. 启用了 auth http plugin， 具体实现可参考 [authServer](../../authServer), authServer 部署参考项目 [README.md](../../README.md#mqtt-auth-server)
2. 禁用匿名链接: listener.tcp.external.allow_anonymous = false
3. 启用reuseport: listener.tcp.external.reuseport = true
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
