
var ChatInputController = function(form)
{
    var input = form.querySelector("textarea")
    
    var button = form.querySelector("button")
    
    var onmessage = null
    
    Object.defineProperty(this, "onmessage", {
        get: function()
        {
            return onmessage
        },
        
        set: function(newValue)
        {
            onmessage = newValue
        }
    })
    
    if (!input || !button)
    {
        throw new Error("Expected a textarea and a button inside the form")
    }
    
    input.addEventListener("keydown", function(evt)
    {
        // submit on enter
        if (evt.keyCode === 13 && evt.shiftKey == false)
        {
            evt.preventDefault()
            
           submit()
        }
    })
    
    form.addEventListener("submit", function(evt)
    {
        evt.preventDefault()
        
        submit()
    })
    
    function submit()
    {
        if (onmessage)
        {
            onmessage(input.value)
        }
        
        form.reset()
    }
}


var ChatMessagesController = function(messages, userUid)
{    
    this.userUid = userUid
    this.messages = messages
}

ChatMessagesController.prototype.push = function(message)
{
    var element = document.createElement("article")

    element.classList.add("message")
    
    if (message.sender && message.sender === this.userUid)
    {
      element.classList.add("mine")
    }
    
    var p = document.createElement("p")
    
    p.innerText = message.body
    
    element.appendChild(p)
    
    this.messages.appendChild(element)
    
    this.messages.scrollTo({
      top: this.messages.scrollHeight,
      left: 0,
      behavior: "smooth"
    })
}

