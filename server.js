const WebSocket = require('ws')
const fs = require("fs")
const https = require("https")
const HTTPS_PORT = 8443;
// const koa = require("koa")
// const app = new koa()


// TLS
const tlsConfig = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
}

// Create a server for the client html page
const requestHandler = function(request, response) {
    // Render the single client html file for any request the HTTP server receives
    console.log('request received: ' + request.url);
  
    if(request.url === '/') {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(fs.readFileSync('public/index.html'));
    } else if(request.url === '/webrtc.js') {
        response.writeHead(200, {'Content-Type': 'application/javascript'});
        response.end(fs.readFileSync('public/webrtc.js'));
    } else if(request.url === '/websocket.js') {
        response.writeHead(200, {'Content-Type': 'application/javascript'});
        response.end(fs.readFileSync('public/websocket.js'));
        }
  };


const server = https.createServer(tlsConfig, requestHandler)


// WebSocket

const wss = new WebSocket.Server({ server });

wss.on("connection", function connection(ws) {
    ws.on("message", function incoming(message) {
        // Broadcast any received message to all clients
        console.log("New message arrived", message)
        wss.broadcast(message)
    })
})

wss.broadcast = function(data){
    this.clients.forEach(function(client){
        if(client.readyState === WebSocket.OPEN){
            client.send(data)
        }
    })
}

server.listen(HTTPS_PORT, '0.0.0.0')