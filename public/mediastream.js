// Video Session Controller

var VideoSessionController = function(captureDevice, room)
{    
    this.device = captureDevice
    this.room = room
    
    this.connectionConfig = {
        "iceServers": [
            {
                "urls": "stun:stun.stunprotocol.org:3478"
            },
    
            {
                "urls": "stun:stun.l.google.com:19302"
            }
        ]
    }
    

    // set up peer connection
    
    var controller = this
    
    var peerConnection = this.peerConnection = new RTCPeerConnection(this.connectionConfig)

    peerConnection.onicecandidate = function(evt)
    {
        // controller.receivedIceCandidate
        if (event.candidate != null) 
        {
            controller.room.sendCommand("videosession.icecandidate", {
                "ice": event.candidate, 
                "uuid": controller.room.uid,
                "receiver": captureDevice.uid
            })
        }
    }
    
    peerConnection.ontrack = function(evt)
    {
        // debugger
        
        controller.device.addTrack(evt.track)
                
        // var video = document.querySelector(".capture-device:last-child video")
        //
        // video.srcObject = track.streams[0]
        

        // receivedRemoteStream
    }
    
    // this.upateDeviceStream()
}

VideoSessionController.prototype.emit = function(eventName, argv)
{
    var callback = this[`on${eventName.toLowerCase()}`]
    
    if (typeof callback !== "function")
    {
        return
    }
    
    callback.apply(this, Array.isArray(argv) ? argv : [argv])
}

VideoSessionController.prototype.upateDeviceStream = function()
{
    // if (!captureDevice.isReady || this.peerConnection.getStreams().indexOf(captureDevice.mediaStream) !== -1)
   //  {
   //      return
   //  }
   //
   //  this.peerConnection.addStream(captureDevice.mediaStream)
}

VideoSessionController.prototype.sendInvitation = function(invitee, localDevice)
{
    var controller = this
    
    if (localDevice.isReady)
    {
        // FIXME: Should not be called twice
        controller.peerConnection.addStream(localDevice.mediaStream)
    }
    
    controller.peerConnection
    .createOffer()
    .then(setDescription)
    .catch(errorHandler)
    
    function setDescription(description)
    {   
        controller.peerConnection
        .setLocalDescription(description)
        .then(reportOffer)
        .catch(errorHandler)
    }
  
    function reportOffer()
    {
        controller.room.sendCommandTo(invitee, "videosession.start", {
            "sdp": controller.peerConnection.localDescription, 
            "uuid": controller.room.uid
        })
    }
  
    function errorHandler(error)
    {
        alert("Failed to start video connection:\n" + error)
    
        console.error("error", arguments)
    }
}

VideoSessionController.prototype.acceptInvitation = function(command)
{
    var controller = this
    
    if (command.sender === controller.room.uid)
    {
        return
    }
    
    if (command.sdp) 
    {
        var description = new RTCSessionDescription(command.sdp)
    
        controller.peerConnection.setRemoteDescription(description).then(function()
        {
            // Only create answers in response to offers
            if (command.sdp.type === "offer")
            {
                controller.peerConnection
                .createAnswer()
                .then(setDescription)
                .catch(errorHandler)
            }
        }).catch(errorHandler)
    } 
  
    else if (command.ice) 
    {
        var iceCandidate = new RTCIceCandidate(command.ice)
        
        controller.peerConnection.addIceCandidate(iceCandidate).catch(errorHandler)
    }
  

    // callbacks
  
    function setDescription(description)
    {
        controller.peerConnection
        .setLocalDescription(description)
        .then(reportOffer)
        .catch(errorHandler)
    }
  
    function reportOffer()
    {
        room.sendCommandTo(command.sender, "videosession.start", {
            "sdp": controller.peerConnection.localDescription, 
            "uuid": controller.room.uid
        })
    }
  
    function errorHandler(error)
    {
        alert("Failed to join video connection:\n" + error)
    
        console.error("error", arguments)
    }
}


// Video Session
/*
var videoPeerConnectionConfig = {
    "iceServers": [
        {
            "urls": "stun:stun.stunprotocol.org:3478"
        },
    
        {
            "urls": "stun:stun.l.google.com:19302"
        }
    ]
}

var videoPeerConnection

function receivedIceCandidate(event) 
{
    if (event.candidate != null) 
    {
        room.sendCommand("videosession.icecandidate", {
            "ice": event.candidate, 
            "uuid": room.uid
        })
        // room.socket.send(JSON.stringify({'ice': event.candidate, 'uuid': uuid}));
    }
}

function receivedRemoteStream(event)
{
    console.log('got remote stream', event)
    // debuggers
    // remoteVideo.srcObject = event.streams[0];
}


function startVideoConnection()
{
    videoPeerConnection = new RTCPeerConnection(videoPeerConnectionConfig)
    videoPeerConnection.onicecandidate = receivedIceCandidate
    videoPeerConnection.ontrack = receivedRemoteStream
    videoPeerConnection.addStream(captureDevice.mediaStream)

    videoPeerConnection
    .createOffer()
    .then(setDescription)
    .catch(errorHandler)
  
    // callbacks
  
    function setDescription(description)
    {
        videoPeerConnection.setLocalDescription(description)
        .then(reportOffer)
        .catch(errorHandler)
    }
  
    function reportOffer()
    {
        room.sendCommand("videosession.start", {
            "sdp": videoPeerConnection.localDescription, 
            "uuid": room.uid
        })
    }
  
    function errorHandler(error)
    {
        alert("Failed to start video connection:\n" + error)
    
        console.error("error", arguments)
    }
}

function joinVideoConnection(command)
{
    if (command.sender === room.uid || videoPeerConnection)
    {
        return
    }


    console.dir(command)
    
    videoPeerConnection = new RTCPeerConnection(videoPeerConnectionConfig)
    videoPeerConnection.onicecandidate = receivedIceCandidate
    videoPeerConnection.ontrack = receivedRemoteStream
    videoPeerConnection.addStream(captureDevice.mediaStream)
  
    // Ignore messages from ourself
    if (command.sender === room.uid)
    {
        return
    }

    if (command.sdp) 
    {
        var description = new RTCSessionDescription(command.sdp)
    
        videoPeerConnection.setRemoteDescription(description).then(function()
        {
            // Only create answers in response to offers
            if (command.sdp.type === "offer")
            {
                videoPeerConnection
                .createAnswer()
                .then(setDescription)
                .catch(errorHandler)
            }
        }).catch(errorHandler)
    } 
  
    else if (command.ice) 
    {
        var iceCandidate = new RTCIceCandidate(command.ice)
        
        videoPeerConnection.addIceCandidate(iceCandidate).catch(errorHandler)
    }
  

    // callbacks
  
    function setDescription(description)
    {
        videoPeerConnection.setLocalDescription(description)
        .then(reportOffer)
        .catch(errorHandler)
    }
  
    function reportOffer()
    {
        room.sendCommand("videosession.start", {
            "sdp": videoPeerConnection.localDescription, 
            "uuid": room.uid
        })
    }
  
    function errorHandler(error)
    {
        alert("Failed to join video connection:\n" + error)
    
        console.error("error", arguments)
    }
}
*/