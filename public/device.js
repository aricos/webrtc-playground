

var CaptureDevice = function(uid)
{
    this.uid = uid
    this.isReady = false
    this.mediaStream = null
    this.type = CaptureDevice.UNKNOWN
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
    this.media = null
}

DeviceController.prototype.setUp = function()
{   
    var element = this.element
    
    var media = this.media = this.element.querySelector("video") || this.element.querySelector("audio")
    
    var device = this.device
    

    // attach the video or audio element
    
    device.attachToMediaElement(media)


    // listen for clicks
    
    element.addEventListener("mousedown", function(evt)
    {
        switch (evt.target.dataset.command)
        {
        case "audio.toggle":
            media.muted = !media.muted
            break
            
        case "video.toggle":
            device.videoEnabled = !device.videoEnabled
            break
            
        default: 
            break
        }
    })
}
