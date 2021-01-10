const fs = require("fs")
const path = require('path')
const Epub = require("../utils/epub")
const {MIME_TYPE_EPUB, UPLOAD_PATH,UPLOAD_URL,OLD_UPLOAD_URL} = require("../utils/constan")
const xml2js = require('xml2js').parseString


class Book {
  constructor(file, data) {
    if (file) {
      this.createBookFromFile(file)
    } else {
      this.createBookFromData(data)
    }
  }
  createBookFromFile(file) {
    const {
      destination,
      filename,
      originalname,
      mimetype = MIME_TYPE_EPUB,
      path
    } = file
    // 电子书后缀名
    const suffix = mimetype===MIME_TYPE_EPUB?'.epub':''
    // 电子书原有路径
    const oldBookPath = path
    // 电子书的新路径
    const bookPath = `${destination}/${filename}${suffix}`
    // 电子书下载url
    const url = `${UPLOAD_URL}/book/${filename}${suffix}`
    // 电子书解压后的路径
    const unzipPath = `${UPLOAD_PATH}/unzip/${filename}`
    // 电子书解压后的文件夹url
    const unzipUrl = `${UPLOAD_URL}/unzip/${filename}`
    if (!fs.existsSync(unzipPath)) {
      fs.mkdirSync(unzipPath,{recursive:true})
    }
    if (fs.existsSync(oldBookPath)&&!fs.existsSync(bookPath)) {
      fs.renameSync(oldBookPath,bookPath)
    }
    // 文件名
    this.fileName = filename
    // epub相对路径
    this.path = `/book/${filename}${suffix}`
    // 
    this.filePath = this.path
    // epub解压后相对路径
    this.unzipPath = `/unzip/${filename}`
    // epub下载路径
    this.url = url
    // 书名
    this.title = ""
    // 作者
    this.author = ''
    // 出版社
    this.publisher = ''
    // 目录
    this.contents = []
    // 封面图
    this.cover = ''
    // 封面图片相对路径
    this.coverPath = ''
    // 分类ID
    this.category= ''
    // 分类名称
    this.categoryText = ''
    // 语言
    this.language = ''
    //解压后文件夹链接
    this.unzipUrl = unzipUrl
    // 电子书原文件名
    this.originalName = originalname

  }
  createBookFromData(data) {
    this.fileName = data.fileName
    this.cover = data.coverPath
    this.title = data.title
    this.author = data.author
    this.publisher = data.publisher
    this.bookId = data.fileName
    this.language = data.language
    this.rootFile = data.rootFile
    this.originalName = data.originalName
    this.path = data.path || data.filePath
    this.filePath = data.path || data.filePath
    this.unzipPath = data.unzipPath
    this.coverPath = data.coverPath
    this.createUser = data.username
    this.createDt = new Date().getTime()
    this.updateDt = new Date().getTime()
    this.updateType = data.updateType === 0 ? data.updateType : 1
    this.category = data.category || 99
    this.categoryText = data.categoryText || '自定义'
    this.contents = data.contents || []
  }
  parse() {
    return new Promise((resolve, reject) => {
      const bookPath = `${UPLOAD_PATH}${this.filePath}`
      if (!fs.existsSync(bookPath)) {
        reject(new Error('电子书不存在'))
      }
      const epub = new Epub(bookPath)
      epub.on('error', err => {
        reject(err)
      })
      epub.on("end", err => {
        if (err) {
          reject(err)
        } else {
          const {
            language,
            creator,
            creatorFileAs,
            title,
            cover,
            publisher
          } = epub.metadata
          if (!title) {
            reject(new Error("图书标题为空"))
          } else {
            this.title = title
            this.language = language || 'en'
            this.author = creator || creatorFileAs || 'unKnown'
            this.publisher = publisher || 'unKnow'
            this.rootFile = epub.rootFile
            try {
              this.unzip()
              this.parseContents(epub)
              const handleGetImage = (err, file, mimeType) =>{
                if (err) {
                  reject(err)
                } else {
                  const suffix = mimeType.split("/")[1]
                  const coverPath = `${UPLOAD_PATH}/img/${this.fileName}.${suffix}`
                  const coverUrl = `${UPLOAD_URL}/img/${this.fileName}.${suffix}`
                  
                  if (!fs.existsSync(`${UPLOAD_PATH}/img`)) {
                    fs.mkdirSync(`${UPLOAD_PATH}/img`,{recursive:true})
                  }
                  fs.writeFileSync(coverPath,file,'binary')
                  this.coverPath = `/img/${this.fileName}.${suffix}`
                  this.cover = coverUrl
                  resolve(this)
                }
              }
              epub.getImage(cover,handleGetImage)
            } catch (e){
              reject(e)
            }
          }
        }
      })
      epub.parse()
    })
  }
  unzip() {
    const AdmZip = require('adm-zip')
    const zip = new AdmZip(Book.genPath(this.path))
    zip.extractAllTo(Book.genPath(this.unzipPath),true)
  }
  parseContents(epub) {
    const getNcxFilePath = ()=>{
      const spine = epub && epub.spine
      const manifset = epub &&epub.manifset
      const ncx = spine.toc &&spine.toc.href
      const id = spine.toc && spine.toc.id
      if (ncx) {
        return ncx
      } else {
        return manifset[id].href
      }
    }
    const findParent = (arr, { dir, fileName,pid='', unzipPath, ord = '',chapterTotal }) => {
      
      return arr.map((item,index) => {
        let src = item.content['$'].src
        let order = ord?ord+'-'+(index+1):index+1+''
        let obj = {
          fileName,
          src:`${UPLOAD_URL}${dir}/${src}`,
          id: src,
          href: `${dir}/${src}`.replace(unzipPath, ''),
          navId: item['$'].id,
          order,
          chapterTotal,
          pid,
          parentId:ord?ord:0,
          label: item.navLabel.text || '',
          text:item.navLabel.text || ''
        }
        if (item.navPoint) {
          if (Array.isArray(item.navPoint)&&item.navPoint.length>0) {
            return {
              ...obj,
              navPoint:findParent(item.navPoint,{dir,pid:item['$'].id,fileName,unzipPath,ord:order,chapterTotal})
            }
          } else if (item.navPoint.keys().length > 0) {
            const nav = item.navPoint
            const _src = nav.content['$'].src
            obj.navPoint = [{
              fileName,
              src:`${UPLOAD_URL}${dir}/${_src}`,
              id: _src,
              href: `${dir}/${_src}`.replace(unzipPath, ''),
              navId: nav['$'].id || 0,
              order:ord+'-'+1,
              chapterTotal,
              pid,
              parentId:ord,
              label: nav.navLabel.text || '',
              text:nav.navLabel.text || ''
            }]
            return  obj
          }
        } else {
          return obj
        }
      })
    }
    const ncxFilePath = Book.genPath(`${this.unzipPath}/${getNcxFilePath()}`)
    
    if (fs.existsSync(ncxFilePath)) {
      return new Promise((resolve, reject) => {
        const xml = fs.readFileSync(ncxFilePath,'utf-8')
        const dir = path.dirname(ncxFilePath).replace(UPLOAD_PATH, '')
        const fileName = this.fileName
        const unzipPath = this.unzipPath
        xml2js(
          xml,
          {
            explicitArray: false,
            ignoreAttrs:false
          },
          (err,json) => {
            if (err) {
              reject(err)
            } else {
              const navMap = json.ncx.navMap
              const chapterTotal = navMap.navPoint.length
              if (navMap.navPoint && chapterTotal > 0) {
                this.contents = findParent(navMap.navPoint,{dir,fileName,unzipPath,chapterTotal})
                resolve()
              } else {
                reject(new Error('目录解析失败，目录数为0'))
              }
            }
          }
        )
      })
    } else {
      throw new Error('目录文件不存在')
    }
  }
  getContents() {
    return this.contents
  }
  toDb() {
    return {
      fileName: this.fileName,
      cover: this.coverPath,
      title: this.title,
      author: this.author,
      publisher: this.publisher,
      bookId: this.fileName,
      language: this.language,
      rootFile: this.rootFile,
      originalName: this.originalName,
      filePath: this.filePath,
      unzipPath: this.unzipPath,
      coverPath: this.coverPath,
      createUser: this.createUser,
      createDt: this.createDt,
      updateDt: this.updateDt,
      updateType: this.updateType,
      category: this.category,
      categoryText: this.categoryText
    }
  }
  reset() {
    if (Book.pathExists(this.filePath)) {
      fs.unlinkSync(Book.genPath(this.filePath))
    }
    if (Book.pathExists(this.coverPath)) {
      fs.unlinkSync(Book.genPath(this.coverPath))
    }
    if (Book.pathExists(this.unzipPath)) {
      fs.rmdirSync(Book.genPath(this.unzipPath),{recursive:true})
    }
  }
  static genPath(path) {
    if (!path.startsWith('/')) {
      path = `/${path}`
    }
    return `${UPLOAD_PATH}${path}`
  }
  static pathExists(path) {
    if (path.startsWith(UPLOAD_PATH)) {
      return fs.existsSync(path)
    } else {
      return fs.existsSync(Book.genPath(path))
    }

  }
  static genContentsTree(contents) {
    if (contents) {
      const contentsTree = []
      contents.forEach(c => {
        c.navPoint = [];
        !c.text && (c.text = c.label);
        console.log(c);
        if (c.pid === '') {
          contentsTree.push(c)
        } else {
          const parent = contents.find(_ => _.navId === c.pid)
          console.log(parent);
          !parent.navPoint && (parent.navPoint = [])
          parent.navPoint.push(c)
        }
      })
      return contentsTree
    }
  }
  static genCoverUrl(book) {
    const { cover } = book
    if (+book.updateType === 0) {
      if (cover) {
        if (cover.startsWith('/')) {
          return `${OLD_UPLOAD_URL}${cover}`
        } else {
          return `${OLD_UPLOAD_URL}/${cover}`
        }
      } else {
        return null
      }
    } else {
      if (cover) {
        if (cover.startsWith('/')) {
          return `${UPLOAD_URL}${cover}`
        } else {
          return `${UPLOAD_URL}/${cover}`
        }
      } else {
        return null
      }
    }
  }
  static genEpubUrl(book) {
    const { url, filePath } = book
    if (url&& url.startsWith('http')) {
      return url
    }
    return `${UPLOAD_URL}${filePath}`
  }
}

module.exports = Book