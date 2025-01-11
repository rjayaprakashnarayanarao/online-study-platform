const express = require('express');
const router = express.Router();

const authRoutes = require('./routes/signup.route')

router.use('/auth', authRoutes);

module.exports = router