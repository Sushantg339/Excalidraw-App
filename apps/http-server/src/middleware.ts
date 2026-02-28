import { JWT_SECRET } from "@repo/backend-common/config";
import { RequestHandler } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken'

declare global{
    namespace Express{
        interface Request{
            userId : string
        }
    }
}

export const authMiddleware: RequestHandler = async (req , res , next)=>{
    try {
        const token = req.headers['authorization']?.split(' ')[1]

        if(!token){
            return res.status(401).json({
                msg : 'unauthorized'
            })
        }

        const decoded = jwt.verify(token , JWT_SECRET)

        req.userId = (decoded as JwtPayload).userId

        next()
    } catch (error) {
        return res.status(500).json({
            msg : "error in auth middleware"
        })
    }
}