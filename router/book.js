const express = require("express")
const multer = require("multer")
const boom = require("boom")
const Result = require("../model/Result")
const Book = require("../model/Book")
const {UPLOAD_PATH} = require("../utils/constan")
const { decoded } = require("../utils")
const bookService = require('../services/book')

const router = express.Router()

router.post(
  "/upload",
  multer({dest:`${UPLOAD_PATH}/book`}).single("file"),
  (req, res, next) => {
    if (!req||req.file.length === 0) {
      new Result("上传失败").fail(res)
    } else {
      let book = new Book(req.file)
      book.parse().then(data => {
        new Result(data,"上传成功").success(res)
      }).catch(err => {
        next(boom.badImplementation(err))
      })
    }
  }
)

router.post(
  "/create",
  (req, res, next) => {
    const decode = decoded(req)
    const { username, password } = decode
    const body = req.body
    if (username) {
      body.username = username
    }
    const book = new Book(null,body)
    bookService.insertBook(book, "book").then((data) => {
      new Result(data,'添加电子书成功').success(res)
    }).catch(err => {
      next(boom.badImplementation(err))
    })
  }
  
  )
router.get(
  "/getBook",
  (req, res, next) => {
    const { fileName } = req.query
    console.log(req.query);
    if (!fileName) {
      next(boom.badRequest(new Error('参数fileName不能为空')))
    } else {
      bookService.getBook(fileName).then(data => {
        new Result(data,'获取图书成功').success(res)
      }).catch(err => {
        next(boom.badImplementation(err))
      })
    }
  }
)
router.post(
  '/update',
  (req, res, next) => {
    const decode = decoded(req)
    const { username, password } = decode
    const body = req.body
    if (username) {
      body.username = username
    }
    const book = new Book(null,body)
    bookService.updateBook(book, "book").then((data) => {
      new Result(data,'更新电子书成功').success(res)
    }).catch(err => {
      next(boom.badImplementation(err))
    })
  }
)

router.get('/getCategory', (req, res, next) => {
  bookService.getCategory().then(data => {
    new Result(data,'获取分类成功').success(res)
  }).catch(err => {
    next(boom.badImplementation(err))
  })
})

router.get('/getList', (req, res, next) => {
  bookService.listBook(req.query).then(data => {
    new Result(data,'获取图书列表成功').success(res)
  }).catch(err => {
    next(boom.badImplementation(err))
  })
})
router.delete('/deleteBook/:fileName', (req, res, next) => {
  
  const {fileName} = req.params
  bookService.deleteBook(fileName).then(res => {
    new Result('删除成功').success(res)
  }).catch(e => {
    next(boom.badImplementation(e))
  })
  
})

module.exports = router