# epub后台管理系统的 node服务

## 项目目录

```
|-db                              mysql 数据库
    |-config.js                       数据库配置
    |-index.js                        数据库操作方法
|-model                           封装的模型 
    |-Book.js                         封装book类
    |-Result.js                       封装服务端返回处理
|-router                          路由
    |-book.js                         book路由
    |-error.js                        错误处理
    |-index.js                        路由入口文件
    |-jwt.js                          jwt鉴权
    |-user.js                         user路由
|-services                        服务层 （负责处理数据库数据）
    |-book.js                         book接口
    |-user.js                         user接口
|-utils                           工具类
    |-constan.js                      常量
    |-epub.js                         epub解析
    |-index.js                        工具方法
|-app.js                          路口文件
|-package.json

```

主要功能

1、jwt登录鉴权
2、图书增删改查

技术湛

1、node
2、express
3、jwt
4、mysql