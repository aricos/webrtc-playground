
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
            date: new Date()
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
            }
        })
        
    
        // EventHandlers
        
        var onclose = null    
        var oncommand = null
        var onconnect = null
        var onmessage = null
        var onerror = null
        var ondata = null
        var onchange = null
        
        Object.defineProperties(room, {
            
            onclose: {
                enumerable: true,
                get: function()
                {
                    return onclose
                },

                set: function(newValue)
                {
                    onclose = newValue
                }
            },
            
            oncommand: {
                enumerable: true,
                get: function()
                {
                    return oncommand
                },

                set: function(newValue)
                {
                    oncommand = newValue
                }
            },
            
            onconnect: {
                enumerable: true,
                get: function()
                {
                    return onconnect
                },

                set: function(newValue)
                {
                    onconnect = newValue
                }
            },
            
            onmessage: {
                enumerable: true,
                get: function()
                {
                    return onmessage
                },

                set: function(newValue)
                {
                    onmessage = newValue
                }
            },
            
            ondata: {
                enumerable: true,
                get: function()
                {
                    return ondata
                },

                set: function(newValue)
                {
                    ondata = newValue
                }
            },
            
            onerror: {
                enumerable: true,
                get: function()
                {
                    return onerror
                },

                set: function(newValue)
                {
                    onerror = newValue
                }
            },
            
            onchange: {
                enumerable: true,
                get: function()
                {
                    return onchange
                },

                set: function(newValue)
                {
                    onchange = newValue
                }
            },
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
                    case "operator.leave":
                        emit("change", decoded)
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
                enumerable: false,
                value: sendMessage
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