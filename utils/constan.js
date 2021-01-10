const UPLOAD_PATH = 'C:/upload/admin-upload-ebook'
const UPLOAD_URL = 'http://book.youbaobao.xyz:8000/admin-upload-ebook'
const COVER_PATH = 'C:/upload/admin-upload-ebook/img'

const OLD_UPLOAD_URL = 'https://www.youbaobao.xyz/book/res/img'

module.exports = {
  JWT_EXPIRED: 60*60,
  PRIVATE_KEY:"admin_imooc_node_test_youbaobao_xyz",
  CODE_ERROR: -1,
  CODE_TOKEN_EXPIRED:-2,
  CODE_SUCCESS: 0,
  debug: false,
  PWD_SALT: "admin_imooc_node",
  UPLOAD_PATH,
  UPLOAD_URL,
  OLD_UPLOAD_URL,
  MIME_TYPE_EPUB: 'application/epub'
}