const express = require('express')
const app = express()

require('./index.js')() 

//routes
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
})

//Listen on port 3000
server = app.listen(3000)

//socket.io instantiation
const io = require("socket.io")(server)

//listen on every connection
io.on('connection', (socket) => {

    socket.on('new_message1', (data) => {
        //send message to others except caller
        console.log(data);
        socket.broadcast.emit('new_message1', data);
    })
    
})
