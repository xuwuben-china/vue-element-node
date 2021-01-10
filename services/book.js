const _ = require('lodash')
const Book = require("../model/Book");
const db = require('../db')
const { flatten, buildTree,treeTransformArr } = require('../utils')


const exists = (book) => {
  const { title, author, publisher } = book
  const sql = `select * from book where title='${title}' and author='${author}' and publisher='${publisher}'`
  return db.queryOne(sql)
}
const removeBook = async (book) => {
  if (book) {
    book.reset()
    if (book.fileName) {
      const removeBookSql = `delete from book where fileName='${book.fileName}'`
      await db.querySql(removeBookSql)
    }
  }
}
const insertContents = async (book) => {
  const contents = book.getContents()
  if (contents && contents.length > 0) {
    const flattenContents = flatten(contents, 'navPoint')
    let len = flattenContents.length
    for (let i = 0; i < len; i++) {
      const _content = _.pick(flattenContents[i], [
        'fileName',
        'href',
        'id',
        'label',
        'navId',
        'parentId',
        'pid',
        'src',
        'order',
        'text'
      ])
      await db.insert(_content, 'contents')
    }
    return flattenContents
  }
}

const insertBook = (book) => {
  return new Promise(async (resovle, reject) => {
    try {
      if (book instanceof Book) {
        const result = await exists(book)
        if (result) {
          await removeBook(book)
          reject(new Error('电子书已存在'))
        } else {
          await db.insert(book.toDb(), 'book')
          const contents = await insertContents(book)
          resovle(contents)
        }
      } else {
        reject(new Error('添加的图书对象不合法'))
      }
    } catch (e) {
      reject(e)
    }
  })
}
const getBook = (fileName) => {
  return new Promise(async (resolve, reject) => {
    const bookSql = `select * from book where fileName='${fileName}'`
    const contentsSql = `select * from contents where fileName='${fileName}'`
    const book = await db.queryOne(bookSql)
    const flattenContents = await db.querySql(contentsSql)
    
    let contents = []

    if (flattenContents[0].parentId) {
      const contentsTree = buildTree(flattenContents,
        {
          id: 'order',
          children: 'navPoint',
          parent_id: 'parentId'
        })
        contents = treeTransformArr(contentsTree, {
          key:'navPoint'
        })
    } else {
      contents = Book.genContentsTree(flattenContents)
    }
    if (book) {
      book.cover = Book.genCoverUrl(book)
      book.url = Book.genEpubUrl(book)
      resolve({ ...book, contents})
    } else {
      reject(new Error('电子书不存在'))
    }
  })
}
const updateBook = (book) => {
    return new Promise(async (resovle, reject) => {
      try {
        if (book instanceof Book) {
          const result = await getBook(book.fileName)
          if (result) {
            // const model = book.toDb()
            const model = _.pick(book, [
              'title',
              'author',
              'language',
              'publisher'
            ])
            if (+result.updateType === 0) {
              reject(new Error('内置图书，不能编辑'))
            } else {
              await db.update(model,'book',`where fileName='${book.fileName}'`)
              resovle()
            }
          } else {
            reject(new Error('图书不存在'))
          }
        } else {
          reject(new Error('添加的图书对象不合法'))
        }
      } catch (e) {
        reject(e)
      }
    })
}

const getCategory = async () => {
  const sql = 'select * from category order by category asc'
  const result = await db.querySql(sql)
  const categoryList = []
  result.forEach(item => {
    categoryList.push({
      label: item.categoryText,
      value: item.category,
      num:item.num
    })
  })
  return categoryList
}
const listBook = async (query) => {
  const {
    category,
    author,
    title,
    page = 1,
    pageSize = 20,
    sort,
  } = query
  const offset = (page -1)*pageSize
  let bookSql = `select * from book`
  let where = 'where'
  category && (where = db.andWhere(where,'category',category)) 
  author && (where = db.andLike(where,'author',author)) 
  title && (where = db.andLike(where,'title',title)) 
  if (where !== 'where') {
    bookSql = `${bookSql} ${where}`
  }
  if (sort) {
    const symbol = sort[0]
    const column = sort.slice(1,sort.length)
    const order = symbol === "+" ? 'asc' : 'desc'
    bookSql = `${bookSql} order by \`${column}\` ${order}`
  }
  let countSql = `select count(*) as count from book`
  if (where !== 'where') {
    countSql = `${countSql} ${where}`
  }
  const count = await db.querySql(countSql)
  bookSql = `${bookSql} limit ${pageSize} offset ${offset}`
  console.log(bookSql);
  const list = await db.querySql(bookSql)
  list.map(book=>book.cover = Book.genCoverUrl(book))
  return {
    list,
    page: +page,
    pageSize: +pageSize,
    total: +count[0].count
  }
}
const deleteBook = (fileName) => {
  return Promise(async (resovle, reject) => {
    let book = await getBook(fileName)
    if (book) {
      if (+book.updateType === 0) {
        reject(new Error('内置电子书不可删除'))
      } else {
        const bookObj = new Book(null,book)
        const sql = `delete from book where fileName='${fileName}'`
        db.querySql(sql).then(() => {
          bookObj.reset()
          resovle()
        })
      }
    } else {
      reject(new Error('电子书不存在'))
    }
  })
}
module.exports = {
  insertBook,
  getBook,
  updateBook,
  getCategory,
  listBook,
  deleteBook
}