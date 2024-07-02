import express from 'express'
import path from 'path'
import http from 'http'
import { Server } from 'socket.io'
import { fileURLToPath } from 'url'

//path actual dir
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = http.createServer(app)

const io = new Server(server)

app.use("/public", express.static(path.resolve(__dirname, '..', 'public', 'assets')))

//pagina inicial da aplicação
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'public', 'index.html'))
})

//conexão websocket
io.on('connection', (socket) => {

    console.log('connected')

    socket.on('offer', (offer) => {
        socket.broadcast.emit('offer', offer);
    });

    socket.on('answer', (answer) => {
        socket.broadcast.emit('answer', answer);
    });

    socket.on('candidate', (candidate) => {
        socket.broadcast.emit('candidate', candidate);
    });

    //sinalização do webrtc recebe a oferta do front e devolve a resposta para estabelecer a conexão
    // socket.on('signal', (data) => {
    //     socket.broadcast.emit('signal', data)
    // })

    //desconexão
    socket.on('disconnect', () =>{
        console.log('exit')
    })
})

server.listen(3000, () => {
    console.log('Server started at port 3000')
})

// server.listen(3000,'192.168.15.170', () => {
//     console.log('Server started at port 3000')
// })