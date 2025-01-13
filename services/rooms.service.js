const rooms = require('../models/rooms.model')

exports.createRoom = async (data) => {
    try {

        //create a unique id
        const room_id = Math.round(Math.random()*99999)+999999

        const newRoom = new rooms({
            creatorName: data.creatorName,
            admin_name: data.admin_name,
            room_name: data.roomName,
            room_id: room_id,
            room_type: data.roomType
        })
        await newRoom.save()
        console.log('Room created', newRoom.dataValues)
        return newRoom.dataValues
    } catch (error) {
        console.log(error)
        //throw error
        throw new Error("error creating room: ", error);

    }
}

exports.getRoom = async (data) => {
    try {
        const room = await rooms.findOne({ room_id: data.room_id })
        console.log('room found')
        return room
    } catch (error) {
        console.log(error)
        //throw error
        throw new Error("error getting room: ", error);
    }
}