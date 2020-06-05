/// <reference path="./engine.ts" />

//     },
//     officePC:{
//         onload(){
//             minimap(false);
//             back("office");
//             document.getElementById("rj45");
//             window.addEventListener("mousemove",(e)=>{
//                 var t = document.getElementById("rj45");
//                 if(t == null)
//                     return;
//                 t.style.left = "calc(" + e.pageX + "px  - " + 48+"%)";
//                 t.style.top = "calc(" + e.pageY + "px - " + 50 + "%)";
//             })
//         },
//         background:"img/default.jpg",
//         items:[{src:"img/pc_back/pc.png"},
//                {src:"img/pc_back/ppcc_rj45.png", id:"rj45", active:true,action:()=>{
//                    var rj45 = document.getElementById("rj45");
//                    var computed = window.getComputedStyle(rj45)
//                    var x = parseFloat(computed.getPropertyValue("left"));
//                    var y = parseFloat(computed.getPropertyValue("top"));
//                    var distance = Math.sqrt(x*x+y*y);
//                    if (distance<10){
//                         quest.update("Подготовить компьютеры в офисе","подключить компьютеры к сети",1)
//                         locations.office.items[lastComputer].active=false;
//                         back();
//                    }
//                }}]
//     },
//     server:{
//         background:"img/server_room/server_room_background.png",
//         items:[{src:"img/server_room/server_room_server.png"},
//                {src:"img/server_room/server_room_.png"}]
//     },
//     hq:{
//         onload(){
//             if(quest.isComplete("Подготовить компьютеры в офисе","подключить компьютеры к сети")){
//                 quest.remove("Подготовить компьютеры в офисе");
//                     locations.hq.items[0].active = true;
//                     document.getElementById("items").children[0].classList.add("active");
//                     locations.hq.items[0].action = ()=>{
//                         locations.hq.items[0].active = false;
//                         scriptQueue.push(
//                             {type:"gui",args:false,continue:true},
//                             {type:"textbox",args:"Отличная работа!"}
//                             )
//                         nextScript()
//                     }
//                 }
//         },
//         background:"img/boss_room/boss_room_background.png",
//         items:[{src:"img/boss_room/boss_room_boss.png"},
//                {src:"img/boss_room/boss_room_chair.png"},
//                {src:"img/boss_room/boss_room_pc.png"}]
//     },
//     shop:{
//         background:"img/shop/shop_background.png",
//         items:[{src:"img/shop/shop_cashman.png"}]
//     },
//     meme:{
//         background:"img/meme-loc.jpg",
//         items:[{src:"img/items/lol.png"}]
//     }
// }

// function back(location){
//     var b = document.getElementById("back")
//     if(location == undefined || location.length == 0){
//         changeLocation(previousLocation);
//         b.classList.add("hide");
//         minimap(true);
//         return;
//     }
//     previousLocation = location;
//     b.classList.remove("hide");
// }

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