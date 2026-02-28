import {WebSocketServer, WebSocket} from 'ws'
import jwt from 'jsonwebtoken'

import {JWT_SECRET} from '@repo/backend-common/config'
import { prisma } from '@repo/db/prisma'

interface User{
    ws: WebSocket,
    rooms : number[],
    userId : string
}

const wss = new WebSocketServer({port : 8000})

const users: User[] = []

function checkUser(token: string): string | null{
    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        if(typeof(decoded) === 'string'){
            return null
        }
        if(!decoded || !decoded.userId){
            return null
        }

        return decoded.userId
    } catch (error) {
        return null
    }
}

console.log('ws running on port 8000')
wss.on('connection', (ws, request)=>{

    const url = request.url
    const queryParams = new URLSearchParams(url?.split('?')[1])
    const token = queryParams.get('token')

    if(!token){
        ws.close()
        return
    }

    const userId = checkUser(token)

    if(!userId){
        ws.close()
        return
    }
    const user: User = {
        ws,
        rooms: [],
        userId: userId
    }
    users.push(user)


    ws.on('message', async (data)=>{
        let parsed: any
        try {
            parsed = JSON.parse(data.toString())
        } catch {
            return ws.send("invalid json")
        }

        if(parsed.type === 'join_room'){
            const roomId = Number(parsed.roomId)
            if (Number.isNaN(roomId)) return ws.send("invalid roomId")
            
            const room = await prisma.room.findUnique({
                where : {
                    id: roomId
                }
            })
            if(!room){
                return ws.send("room does note exist")
            }
            if (!user.rooms.includes(room.id)) {
                user.rooms.push(room.id)
                
            }

            ws.send(`joined room ${room.id}`)
        }

        if(parsed.type === 'leave_room'){
            const roomId = Number(parsed.roomId)
            user.rooms = user.rooms.filter(r => r !== roomId)
            ws.send(`left room ${parsed.roomId}`)
        }

        if(parsed.type === 'chat'){
            
            const roomId = Number(parsed.roomId)
            const message = parsed.message

            if (!user.rooms.includes(roomId)) {
                return ws.send("not in room")
            }
            await prisma.chat.create({
                data : {
                    roomId,
                    message,
                    userId
                }
            })
            users.forEach(u => {
                if(u.rooms.includes(roomId)){
                    u.ws.send(JSON.stringify({
                        type: "chat",
                        message,
                        roomId
                    }))
                }
            })
        }
    })
    ws.on("close", () => {
        const index = users.findIndex(u => u.ws === ws)
        if (index !== -1) users.splice(index, 1)
    })
    
})