
var createRoom = function(options)
{   
    return function()
    {
        // This
        
        var room = this
        
        
        // Identity
        
        var identity = {
            open: false,
            uid: options ? options.uid : null,
            connectionDate: null,
            date: new Date(),
            reconnect: true,
            reconnectTime: options ? options.reconnectTime || 500 : 500
        }
        
        Object.defineProperties(room, {
            uid: {
                enumerable: true,
                get: function()
                {
                    return identity.uid
                }
            },
            
            isOpen: {
                enumerable: true,
                get: function()
                {
                    return identity.open
                }
            },
            
            shouldReconnect: {
                enumerable: true,
                get: function()
                {
                    return identity.reconnect
                },
                
                set: function(newValue)
                {
                    identity.reconnect = newValue
                }
            },
            
            reconnectTime: {
                enumerable: true,
                get: function()
                {
                    return identity.reconnectTime
                },
                
                set: function(newValue)
                {
                    identity.reconnectTime = newValue
                }
            }
        })
       
        function emit(eventName, argv)
        {
            var handlerName = "on" + eventName
            
            var handler = room[handlerName]
            
            if (handler)
            {
                console.log("arguments", arguments)
                handler.call(room, argv)
            }
        }
        
    
        // WebSocket
        
        var socket = null
        
        Object.defineProperties(room, {
            socket: {
                enumerable: true,
                get: function()
                {
                    return socket
                }
            },
            
            connectWebSocket: {
                enumerable: false,
                value: connectWebSocket
            },
            
            connect: {
                enumerable: true,
                value: connectWebSocket
            }
        })
        
    
        function connectWebSocket()
        {            
            var urlInfo = wsInfoForPath()

            if (identity.uid)
            {
                urlInfo.url += "?identity=" + identity.uid
            }
    
            socket = new WebSocket(urlInfo.url)
            
            // Initialize Socket
    
            socket.addEventListener("open", function()
            {                
                identity.open = true
                
                emit("connect")
            })
    
            socket.addEventListener("error", function(error)
            {
                emit("error", error)
            })
    
            socket.addEventListener("close", function()
            {
                identity.open = false
                
                emit("close")
                
                // reconnect if needed
                
                if (identity.reconnect)
                {
                    setTimeout(connectWebSocket, identity.reconnectTime)
                }
            })
    
            socket.addEventListener("message", function(message)
            {
                if (message.data)
                {
                    var decoded = null
                    
                    try
                    {
                        var decoded = JSON.parse(message.data)
                    }
                    
                    catch (error)
                    {
                        emit("data", message.data)
                        
                        return
                    }
                                            
                    switch (decoded.cmd)
                    {
                    case "message.post":
                    case "message.edit":
                    case "message.remove":
                        emit("message", decoded)
                        break
                        
                    case "identity.assign":
                        Object.assign(identity, decoded)
                        emit("ready")
                        emit("change", decoded)
                        break
                        
                    case "operator.join":
                        emit("operatorjoin", decoded)
                        emit("change", decoded)
                        break
                        
                    case "operator.leave":
                        emit("operatorleave", decoded)
                        emit("change", decoded)
                        break
                        
                    case "videosession.start":
                        emit("invitation", decoded)
                        break
                        
                    case "videosession.icecandidate":
                        emit("icecandidate", decoded)
                        break
                    
                    default:
                        emit("command", decoded)
                        break
                    }
                }    
            })
        }
                
        
        // Messages
        
        Object.defineProperties(room, {
            send: {
                enumerable: true,
                value: send
            },
            
            sendMessage: {
                enumerable: true,
                value: sendMessage
            },
            
            sendCommand: {
                enumerable: true,
                value: sendCommand
            }
        })
        
        function send(data)
        {
            if (!socket)
            {
                emit("error", "message sent before connecting")
                
                return
            }   
            
            socket.send(data)
        }
        
        function sendMessage(bodyText)
        {            
            sendCommand("message.post", {
                body: bodyText
            })
        }
        
        function sendCommand(commandName, info)
        {
            var command = {}
            
            Object.assign(command, info)
            
            command.cmd = commandName,
            command.sender = identity.uid
            
            send(JSON.stringify(command))
        }
    
        // return the instance
        
        return this
    }.apply({})
}


// utils

function wsInfoForPath(pathname, options)
{
    var opts = options || {}
    
    var info = {
        host: opts.host || window.location.hostname,
        port: opts.port || window.location.port,
        protocol: window.location.protocol.indexOf("https") === 0 ? "wss" : "ws"
    }
    
    info.url = info.protocol + "://" + info.host + ":" + info.port
    
    return info
}