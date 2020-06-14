/// <reference path="./engine.ts" />
var remote = require('electron').remote;
var min = function () { return remote.getCurrentWindow().minimize(); };
var max = function () {
    var window = remote.getCurrentWindow();
    if (!window.isMaximized()) {
        window.maximize();
    }
    else {
        window.unmaximize();
    }
};
var cls = function () { return remote.getCurrentWindow().close(); };
var game;
window.addEventListener("load", function () {
    game = new Game(new URL('default/game.json', window.location.href).href);
});
function full() {
    var button = document.getElementById("fs");
    var cont = document.getElementById("content");
    if (cont.classList.contains("fullscreen")) {
        button.classList.remove("pressed");
        cont.classList.remove("fullscreen");
        document.exitFullscreen();
    }
    else {
        button.classList.add("pressed");
        cont.classList.add("fullscreen");
        cont.requestFullscreen();
    }
}
function meme_test() {
    var q = game.Script.scriptQueue;
    q.push(new ScriptItem("location", new ScriptArguments("meme"), true));
    q.push(new ScriptItem("textbox", new ScriptArguments("chill dude"), false));
    q.push(new ScriptItem("textbox", new ScriptArguments(""), false));
    q.push(new ScriptItem("textbox", new ScriptArguments("wow, such meme"), false));
    game.Script.nextScript();
}
function test_canvas(cnv, x, y, regionSize) {
    var ctx = cnv.getContext("2d");
    var canvas = document.createElement("canvas");
    canvas.id = "test";
    canvas.classList.add("item");
    canvas.width = 3200;
    canvas.height = 1800;
    document.getElementById("items").appendChild(canvas);
    var ctx2 = canvas.getContext("2d");
    var xx = Math.max(0, x - regionSize);
    var yy = Math.max(0, y - regionSize);
    var width = Math.min(3200, x + regionSize) - xx;
    var height = Math.min(1800, y + regionSize) - yy;
    var data = ctx.getImageData(xx, yy, width, height);
    ctx2.putImageData(data, 0, 0);
}
