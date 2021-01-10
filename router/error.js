const {CODE_ERROR,CODE_TOKEN_EXPIRED} = require("../utils/constan")
const Result = require("../model/Result")

module.exports = (err, req, res, next) => {
  if (err.name&&err.name === "UnauthorizedError") {
    let { status = 401 ,message = "UnauthorizedError"} = err
    new Result(null, "Token验证失败", {
      error: status,
      errorMsg:message
    }).jwtError(res.status(status))
  } else {
    const msg = (err&&err.message)||"服务器打酱油了！！！"
    const statusCode = (err.output&&err.output.statusCode)||500
    const errorMsg = (err.output&&err.output.payload&&err.output.payload.error)||err.massage
    new Result(null, msg, {
      error: statusCode,
      errorMsg
    }).fail(res.status(statusCode))
  }
}