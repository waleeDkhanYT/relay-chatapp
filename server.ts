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

        socket.on('identify', async (userId: string) => {
            onlineUsers.set(userId, socket.id)
            io.emit('online_users', Array.from(onlineUsers.keys()))

            // Join all conversation rooms for this user
            try {
                const userConversations = await prisma.conversation.findMany({
                    where: {
                        members: {
                            some: { userId }
                        }
                    },
                    select: { id: true }
                });

                userConversations.forEach(conv => {
                    socket.join(conv.id);
                    // console.log(`Socket ${socket.id} joined room ${conv.id}`);
                });
            } catch (error) {
                console.error('Error joining rooms on identify:', error);
            }
        })

        socket.on('join_room', (roomId: string) => {
            socket.join(roomId)
        })

        socket.on('join_new_conversation', (data: { conversationId: string, memberIds: string[] }) => {
            // Tell all online members of this new conversation to join the room
            data.memberIds.forEach(userId => {
                const targetSocketId = onlineUsers.get(userId);
                if (targetSocketId) {
                    io.to(targetSocketId).emit('new_conversation_created', { conversationId: data.conversationId });
                }
            });
        });

        socket.on('send_message', async (data) => {
            // data: { id, content, senderId, conversationId, createdAt, sender }
            console.log('📨 New message:', data.content, 'in', data.conversationId);

            // Broadcast to room excluding sender
            socket.to(data.conversationId).emit('receive_message', data);

            // Save to DB and update conversation activity
            try {
                const result = await prisma.$transaction([
                    prisma.message.create({
                        data: {
                            id: data.id, // Use client-generated UUID
                            content: data.content,
                            senderId: data.senderId,
                            conversationId: data.conversationId,
                            createdAt: data.createdAt,
                        }
                    }),
                    prisma.conversation.update({
                        where: { id: data.conversationId },
                        data: { updatedAt: new Date() }
                    })
                ]);
                console.log('✅ Message saved to DB');
            } catch (error) {
                console.error('❌ Failed to save message:', error);
            }
        });

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
