var socket = io();

var poolElem = document.getElementById("pool");

function uploadFiles(files) {
    for (var i = 0; i < files.length; i++) {
        socket.emit("file upload", {
            file: files[i],
            name: files[i].name,
            type: files[i].type
        });
    }
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

socket.on("file", function(data){
    var url = "http://" + location.host + "/file?id=" + data.id;
    
    var fileElem = document.createElement("div");
    fileElem.innerHTML = "<a target='_blank'><div class='info'><h3>" + data.name + "</h3><h4>" + data.type + "</h4></div></a><a><div class='dl'></div></a><canvas class='progress'></canvas>";
    
    fileElem.dataset.id = data.id;
    fileElem.dataset.expiry = data.expiry;
    
    fileElem.querySelectorAll("a")[0].href = url;
    fileElem.querySelectorAll("a")[1].href = url + "&dl=1";
    
    var ext = "";
    if (data.name.indexOf(".") !== -1) {
        ext = data.name.substring(data.name.lastIndexOf(".")+1);
    }
    
    fileElem.querySelector(".info").style.backgroundImage = "url(img/files/" + ext + ".png)";
    
    fileElem.classList.add("file");
    
    poolElem.appendChild(fileElem);
    
    fileElem.querySelector(".progress").width = fileElem.offsetWidth;
});

socket.on("file expired", function(id){
    var expiredElem = document.querySelector(".file[data-id='" + id + "']");
    expiredElem.parentElement.removeChild(expiredElem);
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
        var ctx = canvas.getContext("2d");
        
        var expiry = Number(fileElems[i].dataset.expiry);
        var timeNow = new Date().getTime();
        
        var total = 600000;
        
        var fraction = ((expiry - timeNow) / total);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(61, 153, 112, 0.5)";
        ctx.fillRect(0, 0, canvas.width*fraction, canvas.height);
    }
}, 1000);