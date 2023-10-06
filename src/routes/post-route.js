const express = require('express')

const authenticateMiddleware = require('../middlewares/authenticate')
const uploadMiddleware = require('../middlewares/upload')
const postController = require('../controllers/post-controller')

const router = express.Router()

router.post('/',authenticateMiddleware, uploadMiddleware.single('image'),postController.createPost)

module.exports = router