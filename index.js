const express = require("express")
const app = express()
const http = require("http")
const SocketIO = require("socket.io")
const {createClient} = require("redis")
const redisClient = createClient()

app.set("view engine", "ejs")
const server = http.createServer(app)
const io = SocketIO(server, {cors: {origin:'*'}})

async function sendMessages(socket) {
    redisClient.lrange("messages", 0, -1, (err,data) => {
        console.log(data);
        data.map(item => {
            const [username,message] = item.split(":")
            socket.emit("message", {
                username, message
            })
        })
    })
}

io.on("connection", async socket => {
    sendMessages(socket)
    socket.on("message", ({username, message}) => {
        redisClient.rpush("messages", `${username}:${message}`)
        io.emit("message", {username, message})
    })
})

app.get("/", (req,res) => {
    res.render("login.ejs")
})

app.get("/chat", (req,res) => {
    const {username} = req.query
    res.render("chat", {username})
})

server.listen(3000, () => {
    console.log("running on port 3000");
})