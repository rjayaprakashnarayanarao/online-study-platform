const express = require('express')
const Router = express.Router();
const roomController = require('../controllers/rooms.controller')

Router.post('/createRoom',roomController.creatingRoom)

Router.get('/getRoom',roomController.getRoom)

Router.get('/getPublicRooms',roomController.getPublicRooms)

module.exports = Router