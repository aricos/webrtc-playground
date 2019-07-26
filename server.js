// Dependencies

var fs = require("fs")
var https = require("https")
var path = require("path")
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
        ".json": "application/json"
    }
}


// Create https server

var server = https.createServer(options.tls, function(req, res)
{
    if (req.url === "/")
    {
        req.url = "index.html"
    }
  

    // Serve static files
    
    var resourcePath = path.join(options.http.contentRoot, req.url)
  
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
        
        console.info(`not found: url=${req.url}`)
    })
  
    fileStream.on("open", function()
    {
        var contentType = options.mimetypes[path.extname(resourcePath)] || "text/plain"
        
        var headers = {
            "Content-Type": contentType
        } 
    
        res.writeHead(200, headers)
    
        fileStream.pipe(res)
        
        console.info(`serve file: url=${req.url}`)
    })
})


// WebSocket

var wss = new WebSocket.Server({ 
    server: server
})

wss.on("connection", function connection(ws) 
{
    var operator = {
        open: true,
        uid: uuid.v4(),
        connectionDate: new Date()
    }
    
    console.info(`open connection: operator=${operator.uid}`)
    
    ws.on("message", function incoming(message) 
    {
        console.info(`received message: operator=${operator.uid}, message=${message}`)
        
        wss.broadcast(message)
    })
    
    ws.on("close", function()
    {
        var duration = new Date().getTime() - operator.connectionDate.getTime()
        
        operator.open = false
        
        console.info(`closed connection: operator=${operator.uid}, duration=${duration}`)
    })
})

wss.broadcast = function(data)
{
    this.clients.forEach(function(client)
    {
        if(client.readyState === WebSocket.OPEN)
        {
            client.send(data)
        }
    })
}


// Start https server

server.listen(options.http.https_port, "0.0.0.0", function()
{
    console.info(`started https server: port=${server.address().port}, address=${server.address().address}`)
})
