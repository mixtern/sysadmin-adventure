function Redirect(src) {
    if (src == undefined || src == null)
        return
    document.getElementById("mainframe").src = src;
}

function full() {
    var cont = document.getElementById("frame-content");
    var button = document.getElementById("fs");
    if (cont.classList.contains("fullscreen")) {
        button.classList.remove("pressed");
        cont.classList.remove("fullscreen");
    }
    else {
        button.classList.add("pressed")
        cont.classList.add("fullscreen")
    }
}