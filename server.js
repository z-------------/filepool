var http = require("http");
var express = require("express");
var app = express();
var server = http.Server(app);
var io = require("socket.io")(server);
var fs = require("fs");

var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port = process.env.OPENSHIFT_NODEJS_PORT || 3000;

var router = express.Router();

var files = [];

function elemByValue(array, key, value) {
    var result;
    
    for (var i = 0; i < array.length; i++) {
        if (array[i][key] === value) {
            result = array[i];
            break;
        }
    }
    
    return result;
}

router.use(function(req, res, next) {
    var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
	console.log(ip, req.method, req.url);
    
	next();	
});

router.get("/", function(req, res){
    res.sendFile(__dirname + "/public/index.html");
});

router.get("/img/files/*", function(req, res){
    fs.exists(__dirname + "/public/img/files/" + req.params[0], function(exists){
        if (exists) {
            res.sendFile(__dirname + "/public/img/files/" + req.params[0]);
        } else {
            res.sendFile(__dirname + "/public/img/files/blank.png");
        }
    });
});

router.get("/file", function(req, res){
    var id = req.query.id;
    var dl = req.query.dl;
    
    var data = elemByValue(files, "id", id);
    
    if (data) {
        res.set("Content-Type", data.type);
    
        if (dl === "1") {
            res.set("Content-Disposition", "attachment; filename=\"" + data.name + "\"");
        }

        res.send(data.file);
    } else {
        res.status(404).send("404");
    }
});

router.get("*", function(req, res){
    res.sendFile(__dirname + "/public" + req.params[0]); 
});

app.use("/", router);

io.on("connection", function(socket){
    for (var i = 0; i < files.length; i++) {
        socket.emit("file", {
            id: files[i].id,
            name: files[i].name,
            type: files[i].type,
            expiry: files[i].expiry
        });
    }
    
    socket.on("file upload", function(data){
        var file = data.file;
        var name = data.name;
        var type = data.type;
        
        if (!type) {
            type = "text/plain";
        }
        
        var now = new Date();
        var expiry = now.getTime() + 600000; // 10 minutes from now
        
        var id = now.getTime().toString() + Math.round(Math.random()*1000000).toString();
        
        files.push({
            file: file,
            name: name,
            type: type,
            id: id,
            expiry: expiry
        });
        
        io.emit("file", {
            id: id,
            name: name,
            type: type,
            expiry: expiry
        });
    });
});

setInterval(function(){
    var now = new Date();
    
    for (var i = 0; i < files.length; i++) {
        if (now.getTime() >= files[i].expiry) {
            io.emit("file expired", files[i].id);
            
            files.splice(i, 1);
        }
    }
}, 1000);

server.listen(port, ipaddress, function() {
    console.log("filepool running");
});