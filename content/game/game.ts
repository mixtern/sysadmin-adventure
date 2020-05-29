// var locations = {
//     office:{
//         background:"img/office/office_background.png",
//         items:[{src:"img/office/office_desk_0L.png"},
//                {src:"img/office/office_desk_0R.png"},
//                {src:"img/office/office_desk_1L.png"},
//                {src:"img/office/office_desk_1R.png", active:true, action:()=>{
//                     lastComputer = 3;
//                     changeLocation("officePC");
//                 }},
//                {src:"img/office/office_desk_2L.png", active:true, action:()=>{
//                     lastComputer = 4;
//                     changeLocation("officePC");
//             }},
//                {src:"img/office/office_desk_2R.png"}]
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


// game logic

// function skipClick(e){
//     switch(e.type){
//         case "click":
//             nextScript();
//             break;
//         case "keydown":
//             if(e.key == " " || e.key == "Enter")
//                 nextScript();
//             break;
//     }
// }

// function textbox(text){
//     var box = document.getElementById("textbox");
//     if(text == undefined || text.length == 0){
//         box.classList.add("hide");
//         return;
//     }
//     box.classList.remove("hide")
//     box.innerHTML = text;
// }

// function minimap(enabled){
//     var map = document.getElementById("minimap");
//     minimapEnabled = !!enabled
//     if(!minimapEnabled){
//         map.classList.add("hide");
//         return;
//     }
//     map.classList.remove("hide")
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

// function move(name){
//     if(!minimapEnabled || !(name in locations))
//         return;
//     changeLocation(name)
// }

// function changeLocation(name:string){
//     if(!(name in locations))
//         return;
//     currentLocation = name;
//     document.getElementById("bgr").src = locations[name].background;
//     loadItems();
//     if(locations[name].onload)
//         locations[name].onload();
// }

// function loadItems(){
//     var items = document.getElementById("items");
//     items.innerHTML = "";
//     locations[currentLocation].items.forEach(item => {
//         var image = new Image();
//         var a = document.createElement("canvas")
//         a.classList.add("item");
//         if(item.id)
//             a.id=item.id;
//         if(item.active)
//             a.classList.add("active");
//         a.height = items.clientHeight;
//         a.width = items.clientWidth;
//         items.appendChild(a)
//         a.addEventListener("click",(event)=>{
//             var x = event.pageX - a.offsetLeft,
//                 y = event.pageY - a.offsetTop,
//                 alpha;
//             var items = document.getElementById("items").children;
//             for(var i in items){
//                 if(!items[i].getContext)
//                     continue;
//                 alpha = items[i].getContext("2d").getImageData(x, y, 1, 1).data[3]; 
//                 if(alpha>0 && items[i].classList.contains("active")){
//                     locations[currentLocation].items[i].action()
//                     break;
//                 }
//             }
//         });
//         image.onload = ()=>{
//             a.getContext("2d").drawImage(image,0,0,a.clientWidth,a.clientHeight);
//         }
//         image.src = item.src;
//     });
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

function meme_test(){
    var scriptQueue = game.Script.scriptQueue;
    scriptQueue.push({type:"location",args:new ScriptArguments("name"),continue:true})
    scriptQueue.push({type:"textbox",args:new ScriptArguments("chill dude"),continue:false})
    scriptQueue.push({type:"textbox",args:new ScriptArguments(""),continue:false})
    scriptQueue.push({type:"textbox",args:new ScriptArguments("wow, such meme"),continue:false})
}

// window.addEventListener("keydown",skipClick)
// window.addEventListener("click",skipClick)