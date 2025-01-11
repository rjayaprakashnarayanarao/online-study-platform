const express = require('express')
const Router = express.Router()
const auth = require('../controllers/auth.controller')

Router.post('/signup', auth.register);

Router.post('/login', auth.login);

Router.post('/forgetPassword', auth.forgetPassword)

Router.post('/verifyOtpForPassword',auth.verifyPassword)

module.exports = Router