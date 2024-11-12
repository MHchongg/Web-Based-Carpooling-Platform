const { Server } = require("socket.io")

const setupSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:3000",
            methods: ["GET", "POST"],
        },
    })

    io.on("connection", (socket) => {
        socket.on("join_groupChat", (data) => {
            socket.join(data)
        });

        socket.on("send_message", (data) => {
            socket.to(data.carpool_id).emit("receive_message", data)
        })
    })

    return io
}

module.exports = setupSocket
