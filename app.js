const express = require("express")
const router = require("./router")
const bodyParser = require("body-parser")
const cors = require("cors")

const app = express()

app.use(cors())
app.use(bodyParser.json())
// 创建 application/x-www-form-urlencoded 编码解析
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/",router)


const server = app.listen(18082, () => {
  const { address, port } = server.address()
  console.log("服务启动成功：http://", address, port);
})