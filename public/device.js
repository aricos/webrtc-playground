

var CaptureDevice = function(uid, type)
{
    this.uid = uid
    this.isReady = false
    this.isOffline = true
    this.mediaStream = null
    this.type = type || CaptureDevice.UNKNOWN
}

CaptureDevice.UNKNOWN   = 1 << 1
CaptureDevice.LOCAL     = 1 << 2
CaptureDevice.REMOTE    = 1 << 3


Object.defineProperties(CaptureDevice.prototype, {
    audioEnabled: {
        get: function()
        {
            if (!this.mediaStream)
            {
                return true
            }
            
            var audio = this.mediaStream.getAudioTracks()
            
            if (audio.length === 0)
            {
                return true
            }
            
            return audio[0].enabled // TODO: check if this works well with more tracks
        },
        
        set: function(newValue)
        {
            if (!this.mediaStream)
            {
                return
            }
            
            var audio = this.mediaStream.getAudioTracks()
            
            if (audio.length === 0)
            {
                return
            }
            
            audio[0].enabled = newValue // TODO: check if this works well with more tracks
        }
    },
    
    videoEnabled: {
        get: function()
        {
            if (!this.mediaStream)
            {
                return true
            }
            
            var video = this.mediaStream.getVideoTracks()
            
            if (video.length === 0)
            {
                return true
            }
            
            return video[0].enabled // TODO: check if this works well with more tracks
        },
        
        set: function(newValue)
        {
            if (!this.mediaStream)
            {
                return
            }
            
            var video = this.mediaStream.getVideoTracks()
            
            if (video.length === 0)
            {
                return
            }
            
            video[0].enabled = newValue // TODO: check if this works well with more tracks
        }
    },
    
    
    // Camera Controll
    
    videoTrack: {
        get: function()
        {
            if (!this.mediaStream)
            {
                return null
            }
            
            return this.mediaStream.getVideoTracks()[0]
        }
    },
    
    zoom: {
        set: function(newValue)
        {
            var videoTrack = this.videoTrack
            debugger
            if (!videoTrack)
            {
                return
            }
            
            var constraints = videoTrack.getConstraints()
            
            constraints.zoom = newValue
            
            videoTrack.applyConstraints(constraints)
            
            .then(() => {
                // Do something with the track such as using the Image Capture API.
                debugger
              })
              .catch(e => {
                // The constraints could not be satisfied by the available devices.
                  debugger
              })
            
  
        },
        
        get: function() {
            return this.videoSettings.zoom || -1
        }
    },
    
    videoSettings: {
        get: function()
        {
            var videoTrack = this.videoTrack
            
            if (!videoTrack)
            {
                return {}
            }
            

            return videoTrack.getSettings() || {}
        }
    },
    
    facingMode: {
        set: function(newValue)
        {
            var videoTrack = this.videoTrack
            
            if (!videoTrack)
            {
                return
            }
            
            var constraints = videoTrack.getConstraints()
            
            constraints.facingMode = { "ideal": newValue }
            
            videoTrack.applyConstraints(constraints)
            
            .then(() => {
                // Do something with the track such as using the Image Capture API.
                debugger
              })
              .catch(e => {
                // The constraints could not be satisfied by the available devices.
                  debugger
              })
        },
        
        get: function() {
            var videoTrack = this.videoTrack
            
            if (!videoTrack)
            {
                return "none"
            }
            
            return videoTrack.getConstraints().facingMode || "none"
        }
    }
})


CaptureDevice.prototype.setUp = function()
{
    var stream = new MediaStream()
    
    var offlineTracks = offlineStream.getTracks()

    for (var i = 0; i < offlineTracks.length; i++)
    {
        stream.addTrack(offlineTracks[i])
    }
    
    this.setUpWithStream(stream)

    this.isOffline = true
}

CaptureDevice.prototype.setUpWithStream = function(stream)
{   
    this.mediaStream = stream
    this.isReady = true
}

CaptureDevice.prototype.setUpWithUserMedia = function(mediaTypes, cb)
{
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
    {
        cb(new Error("This browser does not support media devices"))
    }
    
    var device = this
    
    var successHandler = function(stream)
    {
        device.mediaStream = stream
        device.isReady = true
        device.type = CaptureDevice.LOCAL
        
        cb(null)
    }
    
    var errorHandler = function(error)
    {
        device.type = CaptureDevice.UNKNOWN
        device.mediaStream = null
        device.isReady = false
        
        cb(error)
    }
    
    navigator.mediaDevices
             .getUserMedia(mediaTypes)
             .then(successHandler)
             .catch(errorHandler)
}


CaptureDevice.prototype.attachToMediaElement = function(element)
{
    if (!this.isReady || !this.mediaStream)
    {
        throw new Error("CaptureDevice not ready to attach to video element")
    }
    
    if (element.tagName !== "VIDEO" || element.tagName !== "AUDIO")
    {
        console.warn("attachToMediaElement should be called with a video or audio HTML element")
    }
    
    element.srcObject = this.mediaStream
    
    element.muted = this.type === CaptureDevice.LOCAL // Mute local device
}

CaptureDevice.prototype.addTrack = function(track)
{
    if (this.isOffline)
    {
        this.stopOfflineStream()
    }
    
    this.mediaStream.addTrack(track)
}

CaptureDevice.prototype.stopOfflineStream = function()
{
    if (!this.isOffline)
    {
        return
    }
    
    var tracks = this.mediaStream.getTracks()
    
    for (var i = 0; i < tracks.length; i++)
    {
        this.mediaStream.removeTrack(tracks[i])
    }
    
    this.isOffline = false
}




// Offline Image Canvas

var offlineCanvas = document.querySelector(".offline-animation")

var offlineCtx = offlineCanvas.getContext("2d")

var offlineStream = offlineCanvas.captureStream(0)

CaptureDevice.offlineStream = offlineStream


var offlineTick = function(time)
{
    offlineCtx.save()
    
    offlineCtx.fillStyle = "#5D453C"

    offlineCtx.clearRect(0, 0, offlineCanvas.width, offlineCanvas.height)

    offlineCtx.fillRect(0, 0, offlineCanvas.width, offlineCanvas.height)


    offlineCtx.fillStyle = "#FFF"
    
    offlineCtx.textAlign = "center"
    
    offlineCtx.font = `lighter ${offlineCanvas.width / 10}px Courier`

    offlineCtx.fillText("No Video", offlineCanvas.width / 2, offlineCanvas.height / 2)
        
    offlineCtx.restore()
    


    offlineCtx.save()
    
    offlineCtx.translate(offlineCanvas.width / 2, offlineCanvas.height - offlineCanvas.height / 4)
    
    offlineCtx.rotate((time % 360 / 4) * Math.PI / 180)
        
    offlineCtx.strokeStyle = "#D99D86"
    
    offlineCtx.strokeRect(-30, -30, 60, 60)
    
    offlineCtx.restore()
    
    
    offlineStream.getTracks()[0].requestFrame()
    
    window.requestAnimationFrame(offlineTick)
}

offlineTick()



// Device Controller

var DeviceController = function(device, element, room)
{
    this.room = room
    this.device = device
    this.element = element
    this.media = element.querySelector("video") || element.querySelector("audio")
    
    if (device.type === CaptureDevice.REMOTE)
    {
        this.videoSession = new VideoSessionController(device, room)
    }    
}

DeviceController.prototype.setUp = function()
{   
    var controller = this
        
    // set values
    
    if (controller.device.uid)
    {
        controller.element.querySelector("header h4").innerText = controller.device.uid.split("-")[0]        
    }
    
    controller.element.dataset.deviceUid = controller.device.uid
    
    // attach the video or audio element
    
    if (controller.device.isReady)
    {       
        controller.device.attachToMediaElement(controller.media)
    }


    // update video sessio
    if (controller.videoSession)
    {
        controller.videoSession.upateDeviceStream()
    }

    // listen for clicks
    
    controller.element.addEventListener("mousedown", function(evt)
    {
        evt.preventDefault()
        evt.stopPropagation()
        
        switch (evt.target.dataset.command)
        {
        case "audio.toggle":
            
            if (!controller.media)
            {
                break
            }
            
            controller.media.muted = !controller.media.muted
            
            break
            
        case "video.toggle":
            
            if (!controller.device)
            {
                break
            }
            
            controller.device.videoEnabled = !controller.device.videoEnabled
            
            break
            
        default: 
            break
        }
    })
}

DeviceController.prototype.offerCaptureDevice = function(captureDevice)
{
    if (!this.videoSession)
    {
        throw new Error("no video session")
    }
    
    this.videoSession.sendInvitation(this.device.uid, captureDevice)
}

DeviceController.prototype.acceptInvitation = function(command)
{
    if (!this.videoSession)
    {
        throw new Error("Device has no remote video session")
    }
    
    this.videoSession.acceptInvitation(command)
}
