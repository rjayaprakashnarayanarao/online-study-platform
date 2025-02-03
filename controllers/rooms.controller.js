const rooms = require('../services/rooms.service')

// write controller for creating rooms 
exports.creatingRoom = async (req, res) => {
    try {
        const result = await rooms.createRoom(req.body)
        res.status(201).json(result)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

exports.getRoom = async (req, res) => {
    try {
        const result = await rooms.getRoom(req.params.id)
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json({ message: error.message })
    }
}

exports.getPublicRooms = async(req,res)=>{
    try {
        const result = await rooms.getPublicRooms(req.params.id)
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json({ message: error.message })
    }
}