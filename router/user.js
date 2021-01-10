const express = require("express")
const {body,validationResult} = require("express-validator")
const boom = require("boom")
const jwt = require("jsonwebtoken")
const Result = require("../model/Result")
const { login,findUser } = require("../services/user")
const { md5,pick,decoded} = require("../utils")
const {PWD_SALT,JWT_EXPIRED,PRIVATE_KEY} = require("../utils/constan")

const router = express.Router()

router.post("/login",
  [
    body("username").isString().withMessage("用户名必须为字符串"),
    body("password").isString().withMessage("密码必须为字符串")
  ],
  (req, res, next) => {
  const err = validationResult(req)
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors
    next(boom.badRequest(msg))
  } else {
    let { username, password } = req.body
    password = md5(`${password}${PWD_SALT}`)
    let resArr = ["username","role","nickname","avatar"]
    
    login(username, password).then(user => {
      if (!user || user.length === 0) {
        new Result("登录失败").fail(res)
      } else {
        const token = jwt.sign(
          { username, password},
          PRIVATE_KEY,
          {
            expiresIn:JWT_EXPIRED
          }
        )
        let data = pick(user[0],resArr) 
        new Result({...data,token},"登录成功").success(res)
      }
    })
  }
})
router.get("/info", (req, res) => {
  const decode = decoded(req)
  const { username, password } = decode
  let resArr = ["username","role","nickname","avatar"]
  if (username&&password) {
    findUser(username,password).then(user => {
      if (user) {
        let data = pick(user, resArr)
        data.roles = [data.role]
        new Result(data,"用户信息查询成功").success(res)
      } else {
        new Result("用户信息查询失败").fail(res)
      }
    })
  } else {
    new Result("用户信息查询失败").fail(res)
  }
})

module.exports = router