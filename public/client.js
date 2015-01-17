var socket = io();

var poolElem = document.getElementById("pool");

function uploadFiles(files) {
    [].slice.call(files).forEach(function(file){
        var now = new Date();
        
        var name = file.name;
        var type = file.type;
        var id = now.getTime().toString() + Math.round(Math.random()*1000000).toString();
        
        socket.emit("file upload", {
            file: file,
            name: name,
            type: type,
            id: id
        });
        
        var fileElem = document.createElement("div");
        fileElem.innerHTML = "<div class='info'><h3>" + name + "</h3><h4>" + type + "</h4></div>";
        fileElem.dataset.id = id;
        fileElem.classList.add("file", "loading");
        poolElem.appendChild(fileElem);
    });
}

function handleFileDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    
    var files = e.dataTransfer.files;
    uploadFiles(files);
}

function handleFileDragover(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
}

function toggleDragPrompt() {
    var poolItems = poolElem.children;
    
    if (poolItems.length > 0) {
        poolElem.classList.add("noprompt");
    } else {
        poolElem.classList.remove("noprompt");
    }
}

socket.on("file", function(data){
    var id = data.id;
    var name = data.name;
    var type = data.type;
    var expiry = data.expiry;
    
    var url = "file?id=" + id;
    
    var fileElem = document.createElement("div");
    fileElem.innerHTML = "<a target='_blank'><div class='info'><h3>" + name + "</h3><h4>" + type + "</h4></div></a><a><div class='dl'></div></a><canvas class='progress'></canvas>";
    
    fileElem.dataset.id = id;
    fileElem.dataset.expiry = expiry;
    
    fileElem.querySelectorAll("a")[0].href = url;
    fileElem.querySelectorAll("a")[1].href = url + "&dl=1";
    
    var ext = "";
    if (data.name.indexOf(".") !== -1) {
        ext = name.substring(data.name.lastIndexOf(".")+1);
    }
    
    fileElem.querySelector(".info").style.backgroundImage = "url(img/files/" + ext + ".png)";
    fileElem.classList.add("file");
    
    var uploadingElem = document.querySelector(".file[data-id='" + id + "']");
    if (uploadingElem) {
        uploadingElem.parentElement.removeChild(uploadingElem);
    }
    
    poolElem.appendChild(fileElem);
    
    fileElem.querySelector(".progress").width = fileElem.offsetWidth;
    
    toggleDragPrompt();
});

socket.on("file expired", function(id){
    var expiredElem = document.querySelector(".file[data-id='" + id + "']");
    expiredElem.parentElement.removeChild(expiredElem);
    
    toggleDragPrompt();
});

document.body.addEventListener("dragover", handleFileDragover, false);
document.body.addEventListener("drop", handleFileDrop, false);

document.getElementById("finput").addEventListener("change", function(){
    uploadFiles(this.files);
});

setInterval(function(){
    var fileElems = document.querySelectorAll(".file");
    
    for (var i = 0; i < fileElems.length; i++) {
        var canvas = fileElems[i].querySelector(".progress");
        
        if (canvas) {
            var ctx = canvas.getContext("2d");
            
            var expiry = Number(fileElems[i].dataset.expiry);
            var timeNow = new Date().getTime();
            
            var total = 600000;
            
            var fraction = ((expiry - timeNow) / total);
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "rgba(61, 153, 112, 0.5)";
            ctx.fillRect(0, 0, canvas.width*fraction, canvas.height);
        }
    }
}, 1000);