const LOAD_DELAY = 200;

enum Status {
    LOADING,
    ERROR,
    DONE,
    HIDDEN
}

class Loader {
    queue: Array<string>;
    onEmptyCallbacks: Array<Function>;

    constructor() {
        this.onEmptyCallbacks = [];
        var queue: Array<string> = [];
        var ldr = this;
        ['pop', 'push', 'splice', 'filter'].forEach((m) => {
            queue[m] = function () {
                var res = Array.prototype[m].apply(queue, arguments);
                if (ldr.queue.length == 0){
                    ldr.onEmptyCallbacks.forEach((callback: Function) => {
                        callback();
                    });
                }
                return res;
            }
        });
        
        Array.prototype["remove"] = function(item) {
            var L = this.length, ax;
            while (L && this.length) {
                item = this[--L];
                while ((ax = this.indexOf(item)) !== -1) {
                    this.splice(ax, 1);
                }
            }
            return this;
        };

        this.queue = queue;
    };

    get(url: string) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.send();
        return xhr;
    };

    getGame(url: string) {
        this.queue.push(url);
        var game = new Game(this, url);
        var xhr = this.get(url);
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                game.init(JSON.parse(xhr.responseText));
                setTimeout(()=>{
                    this.queue["remove"](url);
                },LOAD_DELAY);
            }
        };
        game.Script = null;
        return game;
    }

    getGameLocation(url: string) {
        this.queue.push(url);
        var xhr = this.get(url);
        var loc = new GameLocation(this);
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                loc.init(JSON.parse(xhr.responseText));
                setTimeout(()=>{
                    this.queue["remove"](url);
                },LOAD_DELAY);
            }
        };
        return loc;
    }

    getImage(url: string) {
        var img = new Image();
        this.queue.push(url);
        img.addEventListener("load",()=>setTimeout(()=>{
            this.queue["remove"](url);
        },LOAD_DELAY));
        img.src = url;
        return img;
    }
};

class Game {
    Script: Array<object>;
    //Quest:QuestEngine;
    Locations: Map<String, GameLocation>;
    Loader: Loader;
    URL: string;
    CurrentLocation:string;
    mapData: object;
    isMapReady:boolean = false;

    constructor(loader, url) {
        this.Loader = loader;
        this.Locations = new Map<String, GameLocation>();
        this.URL = url
    }

    init(data: object) {
        this.Script = data["Script"];
        this.Loader.onEmptyCallbacks.push(()=>{
            var t = this;
            t.loadLocation(t.CurrentLocation);
            console.log('STARTING DEFAULT LOCATION')
        });
        data["locations"].forEach((name: string) => {
            var locationUrl = new URL(`./locations/${name}.json`, this.URL).href;
            this.Locations[name] = this.Loader.getGameLocation(locationUrl);
        });
        this.mapData = data["map"];
        this.CurrentLocation = data["default"];
    }

    loadMap(){
        if(this.isMapReady)
            return;
        this.isMapReady = true;
    }

    loadLocation(name: string) {
        this.loadMap();
        this.CurrentLocation = name;
        var loc = this.Locations[this.CurrentLocation] as GameLocation;
        var bgr = document.getElementById("background") as HTMLCanvasElement;
        DrawingTool.prototype.putImage(bgr,loc.background);
        loc.items.forEach(item => {
           var cnv = DrawingTool.prototype.createCanvas(item["name"]);
           document.getElementById("items").appendChild(cnv);
           DrawingTool.prototype.putImage(cnv,loc.images[item["src"]]);
        });
    }
}

class GameLocation {
    images: Map<string, HTMLImageElement>;
    background:HTMLImageElement;
    status: Status;
    loader: Loader;
    items: Array<string>;

    constructor(loader: Loader) {
        this.loader = loader;
        this.images = new Map();
        this.status = Status.LOADING;
    }

    init(data: object) {
        this.items = data["items"];
        data["items"].forEach((item) => {
            var key: string = !!item.id ? item["id"] : item["src"];
            this.images[key] = this.loader.getImage(item["src"]);
        })
        this.background = this.loader.getImage(data["background"]);
    }
}

class DrawingTool{
    putImage(
        canvas:HTMLCanvasElement, image:CanvasImageSource,
        posX:number = 0, posY:number = 0,
        width:number = NaN, height:number = NaN
        ){
        this.prepare(canvas);
        canvas.getContext("2d").drawImage(image,posX,posY,
            isNaN(width)?canvas.width:width,
            isNaN(height)?canvas.height:height);
    }

    prepare(canvas:HTMLCanvasElement){
        var computed = window.getComputedStyle(canvas);
        canvas.width = parseInt(computed.width);
        canvas.height = parseInt(computed.height);
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0,0,canvas.width,canvas.height);
    }

    createCanvas(id:string){
        var cnv = document.createElement('canvas') as HTMLCanvasElement;
        cnv.id = id;
        return cnv;
    }
}

// class Quest{

// }

// class QuestEngine{

//     list:Array<Quest> = [];

//     add(name,tasks){
//         var q = {name:name,tasks:tasks};
//         this.list.push(q);
//         this.hide(false)
//         this.draw()
//     };

//     isComplete(questName,taskName){
//         var quest = this.list.find(a=>a.name == questName);
//         if(!quest)
//             return;
//         var task = quest.tasks.find(a => a.name == taskName);
//         return (task.current >= task.max)
//     };

//     remove(name){
//         this.list = this.list.filter(q => q.name != name);
//         if(this.list.length == 0){
//             this.hide(true);
//             return;
//         }
//         this.draw();
//     };

//     draw(){
//         var title = document.getElementById("quest-header");
//         title.innerHTML = this.list[0].name;

//         var taskList = document.getElementById("task-list");
//         taskList.innerHTML = "";
//         this.list[0].tasks.forEach((task=>{
//             var t = document.createElement("div");
//             t.classList.add("quest-item");
//             t.innerText = task.name + " - " + task.current + "/" + task.max;
//             if(task.current >= task.max)
//                 t.classList.add("finished");
//             taskList.appendChild(t)
//         }))
//     };

//     update(questName,taskName,count){
//         var q = this.list.findIndex(a=>a.name == questName);
//         var t = this.list[q].tasks.findIndex(a => a.name == taskName)
//         this.list[q].tasks[t].current += count;
//         this.draw();
//     };

//     hide(hidden:boolean){
//         var q = document.getElementById("quest");
//         if(hidden || this.list.length == 0){
//             q.classList.add("hide");
//             return;
//         }
//         q.classList.remove("hide");
//         this.draw();

//     }
// }

// class ScriptEngine{

// }



// var scriptQueue = [];
// var scriptIsActive:boolean = false;

// function nextScript(){
//     var action = scriptQueue.shift();

//     if(action == undefined){
//         scriptIsActive = false;
//         return;
//     }

//     scriptIsActive = true;

//     switch(action.type){
//         case "location":
//             changeLocation(action.args)
//             break;
//         case "textbox":
//             textbox(action.args);
//             break;
//         case "minimap":
//             minimap(action.args)
//             break;
//         case "gui":
//             //gui(action.args);
//             break;
//         case "quest":
//             //quest.add(action.args.name,action.args.tasks)
//             break;
//     }

//     if(action.continue)
//         nextScript();
// }