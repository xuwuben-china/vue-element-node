const crypto = require("crypto")
const jwt = require("jsonwebtoken")
const { PRIVATE_KEY } = require("../utils/constan")

const md5 = (s) => {
  return crypto.createHash("md5")
    .update(String(s)).digest("hex")
}
const decoded = (req) => {
  const token = req.get("Authorization")
  let t = token
  if (token.indexOf("Bearer") === 0) {
    t = token.replace("Bearer ", '')
  }
  return jwt.verify(t, PRIVATE_KEY)
}
/** 
 * 创建一个从 object 中选中的属性的对象。
 * @param {Object} obj
 * @param {(string|string[])} paths
 * @returns {Object}
 * 
  */
const pick = (obj, paths) => {
  let o = {}
  if (Array.isArray(paths)) {
    paths.forEach(item => {
      o[item] = obj[item]
    })
  } else {
    o[paths] = obj[[paths]]
  }
  return o
}

const isObject = (o) => {
  return Object.prototype.toString.call(o) === '[object Object]'
}

/**
 * @description 扁平化数组
 * @param {Array} array
 * @param {String} key
 * @param {boolean} isRetain
  */
const flatten = (arr, key, isRetain = true) => {
  return arr.reduce((result, item) => {
    if (key) {
      if (isRetain) {
        return result.concat(Array.isArray(item[key]) ? flatten(item[key], key, true) : item).concat(Array.isArray(item[key]) ? item : []);
      }
      return result.concat(Array.isArray(item[key]) ? flatten(item[key], key) : item);
    }
    return result.concat(Array.isArray(item) ? flatten(item) : item).concat(Array.isArray(item) ? item : []);
  }, []);
}

function buildTree(list,options){
  const {
    id = 'id',
    children = 'children',
    parent_id = 'parent'
} = options
  let temp = {};
  let tree = {};
  for(let i in list){
      temp[list[i][id]] = list[i];
  }
  for(let i in temp){
    if (+temp[i][parent_id]!==0) {
          if(!temp[temp[i][parent_id]][children]) {
              temp[temp[i][parent_id]][children] = new Object();
          }
          temp[temp[i][parent_id]][children][temp[i][id]] = temp[i];
      } else {
          tree[temp[i][id]] = temp[i];
      }
  }
  return tree;
}
const treeTransformArr = (tree, options) => {
  const {
    key = 'children'
  } = options
  let arr = []
  for (let i in tree) {
    arr.push(tree[i])
    if (tree[i][key]) {
      tree[i][key] = treeTransformArr(tree[i][key], options)
    } 
  }
  return arr
}

module.exports = {
  md5,
  pick,
  decoded,
  isObject,
  flatten,
  buildTree,
  treeTransformArr
}