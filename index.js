const express = require('express');
const router = express.Router();

const authRoutes = require('./routes/auth.route')
const roomRoutes = require('./routes/room.route')

router.use('/auth', authRoutes);
router.use('/room',roomRoutes)

module.exports = router