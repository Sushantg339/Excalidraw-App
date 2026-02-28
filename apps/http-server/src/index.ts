import express from 'express'
import {JWT_SECRET} from '@repo/backend-common/config'
import {CreateRoomSchema, CreateUserSchema, SigninUserSchema} from '@repo/common/types'
import {prisma} from '@repo/db/prisma'
import jwt from 'jsonwebtoken'
import { authMiddleware } from './middleware'

const app = express()

app.post('/api/user/signin', async (req , res)=>{
    try {
        const parsed = CreateUserSchema.safeParse(req.body)
        if(!parsed.success){
            return res.status(411).json({
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
            return res.status(400).json({
                msg : "user already exist!"
            })
        }

        const user = await prisma.user.create({
            data : {
                email : data.username,
                name : data.name,
                password : data.password,
                photo : data.photo
            }
        })

        const token = jwt.sign({userId : user.id} , JWT_SECRET)

        return res.status(201).json({
            msg : "user created successfully",
            token
        })
    } catch (error) {
        console.log(error)
    }
})

app.post('/api/user/signup', async (req , res)=>{
    try {
        const parsed = SigninUserSchema.safeParse(req.body)
        if(!parsed.success){
            return res.status(411).json({
                msg : "incorrect schema"
            })
        }

        const data = parsed.data

        const user = await prisma.user.findUnique({
            where : {
                email : data.username,
                password: data.password
            }
        })

        if(!user){
            return res.status(404).json({
                msg : "user not found"
            })
        }

        const token = jwt.sign({userId : user.id} , JWT_SECRET)

        return res.status(201).json({
            msg : "user logged in successfully",
            token
        })
    } catch (error) {
        console.log(error)
    }
    
})

app.post('/api/user/room', authMiddleware, async (req , res)=>{
    try {
        const parsed = CreateRoomSchema.safeParse(req.body)
        if(!parsed.success){
            return res.status(411).json({
                msg : "incorrect schema"
            })
        }

        const data = parsed.data

        const room = await prisma.room.create({
            data : {
                slug : data.roomName,
                adminId : req.userId
            }
        })

        return res.status(201).json({
            msg : "room created successfully",
            roomId : room.id
        })
    } catch (error) {
        console.log(error)
    }
})

app.listen(5000, ()=>{
    console.log('server is rrunning on port 5000')
})