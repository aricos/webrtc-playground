// Dependencies

var fs = require("fs")
var https = require("https")
var path = require("path")
var url = require("url")
var querystring = require("querystring")
var WebSocket = require('ws')
var uuid = require("node-uuid")


// Runtime options

var options = {
    debug: !!process.env.DEBUG || true,
    
    http: {
        https_port: process.env.HTTPS_PORT || process.env.HTTP_PORT || 8443,
        contentRoot: path.join(__dirname, "public")
    },
    
    tls: {
        key: fs.readFileSync(process.env.TLS_KEY_PATH || 'key.pem'),
        cert: fs.readFileSync(process.env.TLS_CERT_PATH || 'cert.pem')
    },
    
    mimetypes: {
        ".txt": "text/plain",
        ".html": "text/html",
        ".js": "application/javascript",
        ".json": "application/json",
        ".css": "text/css"
    }
}


// Create https server

var server = https.createServer(options.tls, function(req, res)
{
    var pathname = url.parse(req.url).pathname
    
    if (pathname === "/")
    {
        pathname = "/index.html"
    }
  

    // Serve static files
    
    var resourcePath = path.join(options.http.contentRoot, pathname)
  
    var fileStream = fs.createReadStream(resourcePath)
  
    fileStream.on("error", function(err)
    {
        var headers = {
            "Content-Type": "text/plain"
        }
    
        if (options.debug)
        {
            headers["Internal-Error-Message"] = err.message
        }
    
        res.writeHead(404, headers)
    
        res.end("Not Found\n")
        
        console.info(`not found: url=${pathname}`)
    })
  
    fileStream.on("open", function()
    {
        var contentType = options.mimetypes[path.extname(resourcePath)] || "text/plain"
        
        var headers = {
            "Content-Type": contentType
        } 
    
        res.writeHead(200, headers)
    
        fileStream.pipe(res)
        
        console.info(`serve file: pathname=${pathname}`)
    })
})


// WebSocket

var roomSocket = new WebSocket.Server({ 
    noServer: true
})

roomSocket.on("connection", function connection(ws, req, uid) 
{    
    var operator = {
        cmd: "identity.assign",
        open: true,
        uid: uid || uuid.v4(),
        serverConnectionDate: new Date()
    }
    
    console.info(`open connection: operator=${operator.uid}, returning=${!!uid}`)
    

    // send identity to operator
    
    ws.send(JSON.stringify(operator))
    
    operator.cmd = "operator.join"
    
    roomSocket.broadcast(JSON.stringify(operator))
    
    
    ws.on("message", function incoming(message) 
    {
        console.info(`received message: operator=${operator.uid}, size=${message.length}`)
        
        try
        {
            var decoded = JSON.parse(message)
            
            switch (decoded.cmd)
            {
            case "message.post":
                roomSocket.broadcast(message)
                break
                
            default:
                break
            }
        }
        
        catch (error)
        {
            console.error("could not parse message:", error.message)
        }
    })
    
    ws.on("close", function()
    {
        var duration = new Date().getTime() - operator.serverConnectionDate.getTime()
        
        operator.open = false
        
        operator.cmd = "operator.leave"
        
        roomSocket.broadcast(JSON.stringify(operator))
        
        console.info(`closed connection: operator=${operator.uid}, duration=${duration}`)
    })
})

roomSocket.broadcast = function(data)
{
    this.clients.forEach(function(client)
    {
        if(client.readyState === WebSocket.OPEN)
        {
            client.send(data)
        }
    })
}


// Handle WebSocket upgrades

server.on('upgrade', function upgrade(req, socket, head) 
{
    var urlinfo = url.parse(req.url)
    
    var pathname = urlinfo.pathname
    
    var identityUid = null
    
    if (urlinfo.query)
    {
        var query = querystring.parse(urlinfo.query)

        identityUid = query.identity
    }
    
    if (pathname === "/room" || pathname === "/")
    {
        roomSocket.handleUpgrade(req, socket, head, function(ws)
        {
            roomSocket.emit("connection", ws, req, identityUid)
        })
    } 
  
    else 
    {
        socket.destroy()
    }
})


// Start https server

server.listen(options.http.https_port, "0.0.0.0", function()
{
    console.info(`started https server: port=${server.address().port}, address=${server.address().address}`)
})
