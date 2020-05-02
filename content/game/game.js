//game variables
var quests = [];
var previousLocation = "";
var currentLocation = "";
var minimapEnabled = true;

var scriptIsActive = false;
var scriptQueue = []

var lastComputer = null;
//game locations

var locations = {
    office:{
        background:"img/office/office_background.png",
        items:[{src:"img/office/office_desk_0L.png"},
               {src:"img/office/office_desk_0R.png"},
               {src:"img/office/office_desk_1L.png"},
               {src:"img/office/office_desk_1R.png", active:true, action:()=>{
                    lastComputer = 3;
                    changeLocation("officePC");
                }},
               {src:"img/office/office_desk_2L.png", active:true, action:()=>{
                    lastComputer = 4;
                    changeLocation("officePC");
            }},
               {src:"img/office/office_desk_2R.png"}]
    },
    officePC:{
        onload(){
            minimap(false);
            back("office");
            document.getElementById("rj45");
            window.addEventListener("mousemove",(e)=>{
                var t = document.getElementById("rj45");
                if(t == null)
                    return;
                t.style.left = "calc(" + e.pageX + "px  - " + 48+"%)";
                t.style.top = "calc(" + e.pageY + "px - " + 50 + "%)";
            })
        },
        background:"img/default.jpg",
        items:[{src:"img/pc_back/pc.png"},
               {src:"img/pc_back/ppcc_rj45.png", id:"rj45", active:true,action:()=>{
                   var rj = document.getElementById("rj45");
                   var computed = window.getComputedStyle(rj45)
                   var x = parseFloat(computed.getPropertyValue("left"));
                   var y = parseFloat(computed.getPropertyValue("top"));
                   var distance = Math.sqrt(x*x+y*y);
                   if (distance<10){
                        quest.update("Подготовить компьютеры в офисе","подключить компьютеры к сети",1)
                        locations.office.items[lastComputer].active=false;
                        back();
                   }
               }}]
    },
    server:{
        background:"img/server_room/server_room_background.png",
        items:[{src:"img/server_room/server_room_server.png"},
               {src:"img/server_room/server_room_.png"}]
    },
    hq:{
        onload(){
            if(quest.isComplete("Подготовить компьютеры в офисе","подключить компьютеры к сети")){
                quest.remove("Подготовить компьютеры в офисе");
                    locations.hq.items[0].active = true;
                    document.getElementById("items").children[0].classList.add("active");
                    locations.hq.items[0].action = ()=>{
                        locations.hq.items[0].active = false;
                        scriptQueue.push(
                            {type:"gui",args:false,continue:true},
                            {type:"textbox",args:"Отличная работа!"}
                            )
                        nextScript()
                    }
                }
        },
        background:"img/boss_room/boss_room_background.png",
        items:[{src:"img/boss_room/boss_room_boss.png"},
               {src:"img/boss_room/boss_room_chair.png"},
               {src:"img/boss_room/boss_room_pc.png"}]
    },
    shop:{
        background:"img/shop/shop_background.png",
        items:[{src:"img/shop/shop_cashman.png"}]
    },
    meme:{
        background:"img/meme-loc.jpg",
        items:[{src:"img/items/lol.png"}]
    }
}

//quest engine
var quest = {
    list:[],
    add(name,tasks){
        var q = {name:name,tasks:tasks};
        this.list.push(q);
        this.hide(false)
        this.draw()
    },
    isComplete(questName,taskName){
        var quest = this.list.find(a=>a.name == questName);
        if(!quest)
            return;
        var task = quest.tasks.find(a => a.name == taskName);
        return (task.current >= task.max)
    },
    remove(name){
        this.list = this.list.filter(q => q.name != name);
        if(this.list.length == 0){
            this.hide(true);
            return;
        }
        this.draw();
    },
    draw(){
        var title = document.getElementById("quest-header");
        title.innerHTML = this.list[0].name;

        var taskList = document.getElementById("task-list");
        taskList.innerHTML = "";
        this.list[0].tasks.forEach((task=>{
            var t = document.createElement("div");
            t.classList.add("quest-item");
            t.innerText = task.name + " - " + task.current + "/" + task.max;
            if(task.current >= task.max)
                t.classList.add("finished");
            taskList.appendChild(t)
        }))
    },
    update(questName,taskName,count){
        var q = this.list.findIndex(a=>a.name == questName);
        var t = this.list[q].tasks.findIndex(a => a.name == taskName)
        this.list[q].tasks[t].current += count;
        this.draw();
    },
    hide(hidden){
        var q = document.getElementById("quest");
        if(!!hidden || this.list.length == 0){
            q.classList.add("hide");
            return;
        }
        q.classList.remove("hide");
        this.draw();
    }
}

//game logic

function init(){
    //meme_test();
    scriptQueue.push(
        {type:"gui",args:false, continue:true},
        {type:"location",args:"hq",continue:true},
        {type:"textbox",args:"Добро пожаловать в нашу компанию!"},
        {type:"textbox",args:"Наша компания сейчас активно растёт, и мы решили переехать в этот новый офис"},
        {type:"textbox",args:"Твоя задача - подготовить офис к работе, вперёд!"},
        {type:"textbox",args:"",continue:true},
        {type:"gui",args:true,continue:true},
        {type:"quest",args:{name:"Подготовить компьютеры в офисе",tasks:[
            {name:"подключить компьютеры к сети", current:0, max:2},
            {name:"доложить боссу",current:0,max:1}]}}
    )
    nextScript();
}

function meme_test(){
    scriptQueue.push({type:"location",args:"meme",continue:true})
    scriptQueue.push({type:"textbox",args:"chill dude",continue:false})
    scriptQueue.push({type:"textbox",args:"",continue:false})
    scriptQueue.push({type:"textbox",args:"wow, such meme",continue:false})
}

function skipClick(e){
    switch(e.type){
        case "click":
            nextScript();
            break;
        case "keydown":
            if(e.key == " " || e.key == "Enter")
                nextScript();
            break;
    }
}

function nextScript(){
    var action = scriptQueue.shift();

    if(action == undefined){
        scriptIsActive = false;
        return;
    }

    scriptIsActive = true;

    switch(action.type){
        case "location":
            changeLocation(action.args)
            break;
        case "textbox":
            textbox(action.args);
            break;
        case "minimap":
            minimap(action.args)
            break;
        case "gui":
            gui(action.args);
            break;
        case "quest":
            quest.add(action.args.name,action.args.tasks)
            break;
    }

    if(action.continue)
        nextScript();
}

function textbox(text){
    var box = document.getElementById("textbox");
    if(text == undefined || text.length == 0){
        box.classList.add("hide");
        return;
    }
    box.classList.remove("hide")
    box.innerHTML = text;
}

function minimap(enabled){
    var map = document.getElementById("minimap");
    minimapEnabled = !!enabled
    if(!minimapEnabled){
        map.classList.add("hide");
        return;
    }
    map.classList.remove("hide")
}

function back(location){
    var b = document.getElementById("back")
    if(location == undefined || location.length == 0){
        changeLocation(previousLocation);
        b.classList.add("hide");
        minimap(true);
        return;
    }
    previousLocation = location;
    b.classList.remove("hide");
}

function move(name){
    if(!minimapEnabled || !(name in locations))
        return;
    changeLocation(name)
}

function changeLocation(name){
    if(!(name in locations))
        return;
    currentLocation = name;
    document.getElementById("bgr").src = locations[name].background;
    loadItems();
    if(locations[name].onload)
        locations[name].onload();
}

function loadItems(){
    var items = document.getElementById("items");
    items.innerHTML = "";
    locations[currentLocation].items.forEach(item => {
        var image = new Image();
        var a = document.createElement("canvas")
        a.classList.add("item");
        if(item.id)
            a.id=item.id;
        if(item.active)
            a.classList.add("active");
        a.height = items.clientHeight;
        a.width = items.clientWidth;
        items.appendChild(a)
        a.addEventListener("click",(event)=>{
            var x = event.pageX - a.offsetLeft,
                y = event.pageY - a.offsetTop,
                alpha;
            var items = document.getElementById("items").children;
            for(i in items){
                if(!items[i].getContext)
                    continue;
                alpha = items[i].getContext("2d").getImageData(x, y, 1, 1).data[3]; 
                if(alpha>0 && items[i].classList.contains("active")){
                    locations[currentLocation].items[i].action()
                    break;
                }
            }
        });
        image.onload = ()=>{
            a.getContext("2d").drawImage(image,0,0,a.clientWidth,a.clientHeight);
        }
        image.src = item.src;
    });
}

function gui(show){
    quest.hide(!show);
    minimap(!!show);
}

window.addEventListener("load",()=> init())
window.addEventListener("keydown",skipClick)
window.addEventListener("click",skipClick)