import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'


import {JWT_SECRET} from '@repo/backend-common/config'
import {CreateRoomSchema, CreateUserSchema, SigninUserSchema} from '@repo/common/types'
import {prisma} from '@repo/db/prisma'
import { authMiddleware } from './middleware'


const app = express()

app.use(express.json())

app.post('/api/user/signup', async (req , res)=>{
    try {
        const parsed = CreateUserSchema.safeParse(req.body)
        if(!parsed.success){
            return res.status(400).json({
                msg : "incorrect schema"
            })
        }

        const data = parsed.data

        const isUser = await prisma.user.findUnique({
            where : {
                email : data.username
            }
        })

        if(isUser){
            return res.status(409).json({
                msg : "user already exist!"
            })
        }

        const hashedPassword = await bcrypt.hash(data.password, 10)

        const user = await prisma.user.create({
            data : {
                email : data.username,
                name : data.name,
                password : hashedPassword,
            }
        })

        const token = jwt.sign({userId : user.id} , JWT_SECRET, {expiresIn: '7d'})

        return res.status(201).json({
            msg : "user created successfully",
            token
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            msg : "internal server erroe"
        })
    }
})

app.post('/api/user/signin', async (req , res)=>{
    try {
        const parsed = SigninUserSchema.safeParse(req.body)
        if(!parsed.success){
            return res.status(400).json({
                msg : "invalid schema"
            })
        }

        const data = parsed.data

        const user = await prisma.user.findUnique({
            where : {
                email : data.username,
            }
        })

        if(!user){
            return res.status(401).json(({
                msg : "invalid credentials"
            }))
        }

        const isPasswordValid = await bcrypt.compare(data.password, user.password)

        if(!isPasswordValid){
            return res.status(401).json(({
                msg : "invalid credentials"
            }))
        }

        const token = jwt.sign({userId : user.id} , JWT_SECRET, {expiresIn: '7d'})

        return res.status(200).json({
            msg : "user logged in successfully",
            token
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            msg : "internal server erroe"
        })
    }
    
})

app.post('/api/user/room', authMiddleware, async (req , res)=>{
    try {
        const parsed = CreateRoomSchema.safeParse(req.body)
        if(!parsed.success){
            return res.status(400).json({
                msg : "invalid schema"
            })
        }

        const data = parsed.data

        if(!req.userId){
            return res.status(401).json({
                msg : "unauthorized"
            })
        }

        const isRoom = await prisma.room.findUnique({
            where : {slug : data.roomName}
        })

        if(isRoom){
            return res.status(409).json({
                msg : "room name already taken"
            })
        }

        let room
        try {
            room = await prisma.room.create({
                data: {
                slug: data.roomName,
                adminId: req.userId
                }
            })
        } catch (e: any) {
            if (e.code === "P2002") {
                return res.status(409).json({ msg: "room name already taken" })
            }
            throw e
        }

        return res.status(201).json({
            msg : "room created successfully",
            roomId : room.id
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            msg : "internal server erroe"
        })
    }
})


app.get('/api/chat/:roomId', async(req , res)=>{
    try {
        const roomId = Number(req.params.roomId)
        if (Number.isNaN(roomId)) {
            return res.status(400).json({ msg: "invalid roomId" })
        }
        const messages = await prisma.chat.findMany({
            where: {
                roomId: roomId
            },
            take: 5,
            orderBy: {
                id: "desc"
            }
        })

        return res.status(200).json({
            msg : "meseeges fetched successfully",
            messages
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            msg : "iinternal server error"
        })
    }
})


app.get('/api/room/:slug', async (req , res)=>{
    try {
        const {slug}: {slug : string} = req.params
        const room = await prisma.room.findUnique({
            where : {slug}
        })

        if(!room){
            return res.status(404).json({
                msg : "invalid room name"
            })
        }

        return res.status(200).json({
            msg : "room fetched successfully",
            room
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            msg : "internal server error"
        })
    }
})

app.listen(5000, ()=>{
    console.log('server is rrunning on port 5000')
})