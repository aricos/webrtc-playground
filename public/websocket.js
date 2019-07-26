var wsc = function(props){

    this.host = props.host || "0.0.0.0" 
    this.port = props.port || "5000"
    this.protocol = props.protocol //|| window.location.protocol == "http" ? "ws" : "wss"
    this.urlSocket = this.protocol + "://" + this.host + ":" + this.port  // + "/socket"

    this.connect_errors = 0
    this.connect_attempts
    
}


wsc.prototype.setup = function(){
    console.info(this.urlSocket)
    wsc.conn = new WebSocket(this.urlSocket)
    wsc.conn.addEventListener("open", this.onOpen)
    wsc.conn.addEventListener("error", this.onError)
    wsc.conn.addEventListener("close", this.onClose)
    wsc.conn.addEventListener("message", this.onMessage)
}

wsc.prototype.send = function(data){
    wsc.conn.send(data)
}

wsc.prototype.onOpen = function(event){
    this.connect_errors = 0
}

wsc.prototype.onClose = function(event){
    console.log("Websocket closed. Reconnecting..")
    var connect_attempts = 10

    if(this.connect_errors < connect_attempts){
        console.error("Websocket Error: caused " + this.connect_errors + "times")
        console.info("Server connection lost, retrying...")
        window.setTimeout(this.setup, 3000)
    } else {
        console.error("Websocket error. Check Server!!")
    }

}

wsc.prototype.onError = function(error){
    console.error("Websocket receive error", error)
    this.connect_errors++
}

wsc.prototype.onMessage = function(message){
    var data = JSON.parse(message.data)

    gotMessageFromServer(message)

    // console.info(data)
    

}