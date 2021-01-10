const {querySql,queryOne} = require("../db")

const login = (username, password) => {
  return  querySql(`select * from admin_user where username='${username}' && password='${password}'`)
  
}
const findUser = (username,password)=>{
  return queryOne(`select * from admin_user where username='${username}' && password='${password}'`)
}

module.exports = {
  login,
  findUser
}