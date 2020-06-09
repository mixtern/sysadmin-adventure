/// <reference path="./engine.ts" />

let game: Game;

window.addEventListener("load", () => {
    var l = new Loader();
    game = l.getGame(new URL('default/game.json', window.location.href).href)
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
        button.classList.add("pressed")
        cont.classList.add("fullscreen")
        cont.requestFullscreen();
    }
}

function meme_test() {
    var q = game.Script.scriptQueue;
    q.push(new ScriptItem("location", new ScriptArguments("meme"), true));
    q.push(new ScriptItem("textbox", new ScriptArguments("chill dude"), false));
    q.push(new ScriptItem("textbox", new ScriptArguments(""), false));
    q.push(new ScriptItem("textbox", new ScriptArguments("wow, such meme"), false));
    game.Script.nextScript()
}

function test_canvas(cnv: HTMLCanvasElement, x, y,regionSize) {
    let ctx = cnv.getContext("2d");
    let canvas = document.createElement("canvas");
    canvas.id = "test";
    canvas.classList.add("item");
    canvas.width = 3200;
    canvas.height = 1800;
    document.getElementById("items").appendChild(canvas);
    let ctx2 = canvas.getContext("2d");
    let xx = Math.max(0, x - regionSize);
    let yy = Math.max(0, y - regionSize);
    let width = Math.min(3200, x + regionSize)-xx;
    let height = Math.min(1800, y + regionSize)-yy;
    let data = ctx.getImageData(xx,yy,width,height);
    ctx2.putImageData(data,0,0);
}