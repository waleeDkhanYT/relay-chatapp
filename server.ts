import 'dotenv/config'
import { createServer } from 'node:http'
import next from 'next'
import { Server } from 'socket.io'
import { prisma } from './src/lib/prisma'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000
const app = next({ dev, hostname, port })
const handler = app.getRequestHandler()

app.prepare().then(() => {
    const httpServer = createServer(handler)
    const io = new Server(httpServer)
    const onlineUsers = new Map<string, string>() // userId -> socketId

    io.on('connection', (socket) => {
        // console.log('Client connected:', socket.id)

        socket.on('identify', (userId: string) => {
            onlineUsers.set(userId, socket.id)
            io.emit('online_users', Array.from(onlineUsers.keys()))
        })

        socket.on('join_room', (roomId: string) => {
            socket.join(roomId)
        })

        socket.on('send_message', async (data) => {
            // data: { content, senderId, conversationId }

            // Broadcast to room
            io.to(data.conversationId).emit('receive_message', data)

            // Save to DB
            try {
                await prisma.message.create({
                    data: {
                        content: data.content,
                        senderId: data.senderId,
                        conversationId: data.conversationId,
                        createdAt: data.createdAt, // Optional, rely on default
                    }
                })
            } catch (error) {
                console.error('Failed to save message:', error)
            }
        })

        socket.on('disconnect', () => {
            // Find user by socketId and remove
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId)
                    break
                }
            }
            io.emit('online_users', Array.from(onlineUsers.keys()))
        })
    })

    httpServer
        .once('error', (err) => {
            console.error(err)
            process.exit(1)
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`)
        })
})
