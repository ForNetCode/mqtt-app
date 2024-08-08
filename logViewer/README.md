## LogViewer

日志使用simpleLog 渲染，所有日志以dom的形式全量渲染，存在内存溢出的风险。后面需要采用 VirtualLog 来处理。


### VirtualLog TODO
#### - [ ] 1. 关键字高亮要集中于具体字
目前实现的是一行一行的search。 Next Prev 以行数跳动，这样不行。需要实现：
**Line 高亮字段UI展示形式，需要配合日志解析处理。**
为此需要做构建日志语法树，并进行匹配。

#### - [ ] 2. 解决多行文本问题
参考 https://github.com/NadiaIdris/ts-log-viewer

#### - [ ] 3. SearchBar 尽量少维护数据
只维护一个搜索总数和当前查询index即可。

**突然想到：直接复用 Chrome 的 Dev console 是否就结束了？**
