

var CaptureDevice = function(uid, type)
{
    this.uid = uid
    this.isReady = false
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
    }
})


CaptureDevice.prototype.setUpMedia = function(mediaTypes, cb)
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


// Device Controller

var DeviceController = function(device, element)
{
    this.device = device
    this.element = element
    this.media = element.querySelector("video") || element.querySelector("audio")
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
            
            controller.media.muted = !media.muted
            
            break
            
        case "video.toggle":
            
            if (!controller.device)
            {
                break
            }
            
            controller.device.videoEnabled = !device.videoEnabled
            
            break
            
        default: 
            break
        }
    })
}
