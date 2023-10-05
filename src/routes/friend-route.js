const express = require('express')
const router = express.Router()
const authenticateMiddleware = require('../middlewares/authenticate')
const friendController = require('../controllers/friend-controller')

router.post('/:receiverId',authenticateMiddleware,friendController.requestFriend)

module.exports = router