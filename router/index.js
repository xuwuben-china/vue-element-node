const express = require("express")
const boom = require("boom")
const jwtAuth = require("../router/jwt")
const userRouter = require("./user")
const bookRouter = require("./book")
const errorRouter = require("./error")
const {
  CODE_ERROR
} = require("../utils/constan")

const router = express.Router()
router.use(jwtAuth)
router.get("/", (req, res) => {
  res.send("歡迎光臨")
})
router.use("/user",userRouter)
router.use("/book",bookRouter)
router.use((req, res, next) => {
  next(boom.notFound("接口不存在"))
})
router.use(errorRouter)


module.exports = router