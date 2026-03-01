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

        socket.on('mark_read', async (data: { conversationId: string, userId: string }) => {
            // Mark all unread messages in conv as read by user
            try {
                // Fetch unread messages
                const unread = await prisma.message.findMany({
                    where: {
                        conversationId: data.conversationId,
                        NOT: {
                            readBy: { has: data.userId }
                        }
                    },
                    select: { id: true }
                });

                if (unread.length > 0) {
                    // In a loop for now (not efficient but works for MVP without raw SQL)
                    await prisma.$transaction(
                        unread.map(msg => prisma.message.update({
                            where: { id: msg.id },
                            data: {
                                readBy: { push: data.userId }
                            }
                        }))
                    );

                    // Broadcast to room that messages were read
                    socket.to(data.conversationId).emit('messages_read', {
                        conversationId: data.conversationId,
                        readerId: data.userId,
                        messageIds: unread.map(m => m.id)
                    });
                }
            } catch (error) {
                console.error('❌ Failed to mark messages read:', error);
            }
        });

        socket.on('delete_message', async (data: { messageId: string, userId: string, deleteForEveryone: boolean, conversationId: string }) => {
            try {
                if (data.deleteForEveryone) {
                    const msg = await prisma.message.findUnique({ where: { id: data.messageId } });
                    if (msg && msg.senderId === data.userId) {
                        await prisma.message.update({
                            where: { id: data.messageId },
                            data: { isDeleted: true }
                        });
                        // Notify everyone in the room
                        io.to(data.conversationId).emit('message_deleted', {
                            messageId: data.messageId,
                            conversationId: data.conversationId,
                            deleteForEveryone: true
                        });
                    }
                } else {
                    // Delete for me
                    await prisma.message.update({
                        where: { id: data.messageId },
                        data: {
                            deletedForUserIds: { push: data.userId }
                        }
                    });
                    // Notify only the user socket(s)
                    // If user has multiple tabs, we want to update all of them.
                    // The user is joined to their own room usually, but here we can just target the socket or room.
                    const userSocketId = onlineUsers.get(data.userId);
                    if (userSocketId) {
                        io.to(userSocketId).emit('message_deleted', {
                            messageId: data.messageId,
                            conversationId: data.conversationId,
                            deleteForEveryone: false
                        });
                    }
                }
            } catch (error) {
                console.error('❌ Failed to delete message:', error);
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
