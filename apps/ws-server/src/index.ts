import {WebSocketServer} from 'ws'

const wss = new WebSocketServer({port : 8000})

wss.on('connection', (ws, request)=>{
    console.log('ws running on port 8000')

    const url = request.url
    const queryParams = new URLSearchParams(url?.split('?')[1])
    const token = queryParams.get('token')

    
    ws.on('message', (data)=>{
        ws.send('pong')
    })
})