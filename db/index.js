const mysql = require("mysql")
const config = require("./config")
const {debug} = require("../utils/constan")
const {isObject} = require('../utils')

const connect = () => {
  return mysql.createConnection({
    ...config,
    multipleStatements:true
  })
}

const querySql = (sql) => {
  const conn = connect()
  debug && console.log(sql);
  return new Promise((resolve, reject) => {
    try {
      conn.query(sql, (err, res) => {
        if (err) {
          debug && console.log('查询失败，原因:' + JSON.stringify(err))
          reject(err)
        } else {
          debug && console.log('查询成功', JSON.stringify(res))
          resolve(res)
        }
      })
    } catch (e){
      reject(e)
    } finally {
      conn.end()
    }
  })
}
const queryOne = (sql) => {
  return new Promise((resolve, reject) => {
    querySql(sql).then(res => {
      if (res && res.length > 0) {
        resolve(res[0])
      } else {
        resolve(null)
      }
    }).catch(err => {
      reject(err)
    })
  })
}
const insert = (model,tableName) => {
  return new Promise((resolve, reject) => {
    if (!isObject(model)) {
      reject(new Error('插入数据库失败，插入对象不合法'))
    } else {
      const keys = []
      const values = []
      Object.keys(model).forEach(key => {
        if (model.hasOwnProperty(key)) {
          keys.push(`\`${key}\``)
          values.push(`'${model[key]}'`)
        }
      })
      if (keys.length>0&&values.length>0) {
        let sql = `INSERT INTO \`${tableName}\` (`
        const keysString = keys.join(',')
        const valuesString = values.join(',')
        sql = `${sql}${keysString}) VALUES (${valuesString})`

        debug && console.log(sql);
        const conn = connect()
        try {
          conn.query(sql, (err, res) => {
            if (err) {
              reject(err)
            } else {
              resolve(res)
            }
          })
        } catch (e) {
          reject(e)
        } finally {
          conn.end()
        }
      } else {
        reject(new Error('对象不能为空'))
      }
    }
  })
}
const update = (model,tableName,where) => {
  return new Promise((resovle, reject) => {
    if (!isObject(model)) {
      reject(new Error('插入数据库失败，插入数据不是对象'))
    } else {
      const entry = []
      Object.keys(model).forEach(key => {
        if (model.hasOwnProperty(key)) {
          entry.push(`\`${key}\`='${model[key]}'`)
        }
      })
      if (entry.length > 0) {
        let sql = `UPDATE \`${tableName}\` SET`
        sql = `${sql} ${entry.join(',')} ${where}`
        debug && console.log(sql);
        const conn = connect()
        try {
          conn.query(sql, (err, res) => {
            if (err) {
              reject(err)
            } else {
              resovle(res)
            }
          })
        } catch (e) {
          reject(e)
        } finally {
          conn.end()
        }
      }
    }
  })
}
const andWhere = (where, k, v) => {
  if (where==='where') {
    return `${where} \`${k}\`='${v}'`
  } else {
    return `${where} and \`${k}\`='${v}'`
  }
}
const andLike = (where, k, v) => {
  if (where==='where') {
    return `${where} \`${k}\` like '%${v}%'`
  } else {
    return `${where} and \`${k}\` like '%${v}%'`
  }
}
module.exports = {
  connect,
  querySql,
  queryOne,
  insert,
  update,
  andWhere,
  andLike
}