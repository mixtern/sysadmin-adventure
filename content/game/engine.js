var LOAD_DELAY = 200;
var Status;
(function (Status) {
    Status[Status["LOADING"] = 0] = "LOADING";
    Status[Status["ERROR"] = 1] = "ERROR";
    Status[Status["DONE"] = 2] = "DONE";
    Status[Status["HIDDEN"] = 3] = "HIDDEN";
})(Status || (Status = {}));
var Loader = /** @class */ (function () {
    function Loader() {
        this.onEmptyCallbacks = [];
        var queue = [];
        var ldr = this;
        ['pop', 'push', 'splice', 'filter'].forEach(function (m) {
            queue[m] = function () {
                var res = Array.prototype[m].apply(queue, arguments);
                if (ldr.queue.length == 0) {
                    ldr.onEmptyCallbacks.forEach(function (callback) {
                        callback();
                    });
                }
                return res;
            };
        });
        Array.prototype["remove"] = function (item) {
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
    }
    ;
    Loader.prototype.get = function (url) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.send();
        return xhr;
    };
    ;
    Loader.prototype.getGame = function (url) {
        var _this = this;
        this.queue.push(url);
        var game = new Game(this, url);
        var xhr = this.get(url);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                game.init(JSON.parse(xhr.responseText));
                setTimeout(function () {
                    _this.queue["remove"](url);
                }, LOAD_DELAY);
            }
        };
        game.Script = null;
        return game;
    };
    Loader.prototype.getGameLocation = function (url) {
        var _this = this;
        this.queue.push(url);
        var xhr = this.get(url);
        var loc = new GameLocation(this);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                loc.init(JSON.parse(xhr.responseText));
                setTimeout(function () {
                    _this.queue["remove"](url);
                }, LOAD_DELAY);
            }
        };
        return loc;
    };
    Loader.prototype.getImage = function (url) {
        var _this = this;
        var img = new Image();
        this.queue.push(url);
        img.addEventListener("load", function () { return setTimeout(function () {
            _this.queue["remove"](url);
        }, LOAD_DELAY); });
        img.src = url;
        return img;
    };
    return Loader;
}());
;
var Game = /** @class */ (function () {
    function Game(loader, url) {
        this.isMapReady = false;
        this.Loader = loader;
        this.Locations = new Map();
        this.URL = url;
    }
    Object.defineProperty(Game.prototype, "showMinimap", {
        get: function () {
            return document.getElementById("minimap").classList.contains("hide");
        },
        set: function (b) {
            var map = document.getElementById("minimap");
            if (b)
                map.classList.remove("hide");
            else
                map.classList.add("hide");
        },
        enumerable: false,
        configurable: true
    });
    Game.prototype.init = function (data) {
        var _this = this;
        this.Script = data["Script"];
        this.Loader.onEmptyCallbacks.push(function () {
            var t = _this;
            t.loadLocation(t.CurrentLocation);
            console.log('STARTING DEFAULT LOCATION');
        });
        data["locations"].forEach(function (name) {
            var locationUrl = new URL("./locations/" + name + ".json", _this.URL).href;
            _this.Locations[name] = _this.Loader.getGameLocation(locationUrl);
        });
        this.mapData = data["map"];
        this.CurrentLocation = data["default"];
    };
    Game.prototype.loadMap = function () {
        var _this = this;
        if (this.isMapReady)
            return;
        var map = document.getElementById("minimap");
        map.style.backgroundImage = "url(\"" + this.mapData["background"] + "\")";
        map.style.width = this.mapData["size"]["width"] + "px";
        map.style.height = this.mapData["size"]["height"] + "px";
        this.mapData["mapItems"].forEach(function (mapItem) {
            var img = document.createElement("img");
            img.style.position = "absolute";
            img.style.left = mapItem["x"] + 'px';
            img.style.top = mapItem["y"] + 'px';
            img.style.width = mapItem["width"] + 'px';
            img.style.height = mapItem["height"] + 'px';
            img.src = mapItem["src"];
            img.addEventListener("click", function () {
                _this.loadLocation(mapItem["location"]);
            });
            map.appendChild(img);
        });
        this.isMapReady = true;
    };
    Game.prototype.loadLocation = function (name) {
        this.loadMap();
        this.CurrentLocation = name;
        var loc = this.Locations[this.CurrentLocation];
        var bgr = document.getElementById("background");
        DrawingTool.prototype.putImage(bgr, loc.background);
        var items = document.getElementById("items");
        items.innerHTML = '';
        loc.items.forEach(function (item) {
            var cnv = DrawingTool.prototype.createCanvas(item["name"]);
            items.appendChild(cnv);
            DrawingTool.prototype.putImage(cnv, loc.images[item["src"]]);
        });
    };
    return Game;
}());
var GameLocation = /** @class */ (function () {
    function GameLocation(loader) {
        this.loader = loader;
        this.images = new Map();
        this.status = Status.LOADING;
    }
    GameLocation.prototype.init = function (data) {
        var _this = this;
        this.items = data["items"];
        data["items"].forEach(function (item) {
            var key = !!item.id ? item["id"] : item["src"];
            _this.images[key] = _this.loader.getImage(item["src"]);
        });
        this.background = this.loader.getImage(data["background"]);
    };
    return GameLocation;
}());
var DrawingTool = /** @class */ (function () {
    function DrawingTool() {
    }
    DrawingTool.prototype.putImage = function (canvas, image, posX, posY, width, height) {
        if (posX === void 0) { posX = 0; }
        if (posY === void 0) { posY = 0; }
        if (width === void 0) { width = NaN; }
        if (height === void 0) { height = NaN; }
        this.prepare(canvas);
        canvas.getContext("2d").drawImage(image, posX, posY, isNaN(width) ? canvas.width : width, isNaN(height) ? canvas.height : height);
    };
    DrawingTool.prototype.prepare = function (canvas) {
        var computed = window.getComputedStyle(canvas);
        canvas.width = parseInt(computed.width);
        canvas.height = parseInt(computed.height);
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    DrawingTool.prototype.createCanvas = function (id) {
        var cnv = document.createElement('canvas');
        cnv.id = id;
        return cnv;
    };
    return DrawingTool;
}());
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
