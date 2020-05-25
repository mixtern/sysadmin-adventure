var Status;
(function (Status) {
    Status[Status["LOADING"] = 0] = "LOADING";
    Status[Status["ERROR"] = 1] = "ERROR";
    Status[Status["DONE"] = 2] = "DONE";
    Status[Status["HIDDEN"] = 3] = "HIDDEN";
})(Status || (Status = {}));
var Loader = /** @class */ (function () {
    function Loader() {
        var queue = [];
        ['pop', 'push', 'reverse', 'shift', 'unshift', 'splice', 'sort', 'filter'].forEach(function (m) {
            queue[m] = function () {
                var res = Array.prototype[m].apply(queue, arguments);
                // if(queue.length == 0)
                //     this.onEmptyCallbacks.forEach((callback:Function) => {
                //         callback();
                //     });
                return res;
            };
        });
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
                _this.queue = _this.queue.filter(function (value) { return value == url; });
            }
        };
        game.Script = null;
        return game;
    };
    Loader.prototype.getGameLocation = function (url) {
        var _this = this;
        this.queue.push(url);
        var xhr = this.get(url);
        var loc = new GameLocation();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                loc.init(JSON.parse(xhr.responseText));
                _this.queue = _this.queue.filter(function (value) { return value == url; });
            }
        };
    };
    Loader.prototype.getImage = function (config) {
    };
    return Loader;
}());
;
var Game = /** @class */ (function () {
    function Game(loader, url) {
        this.Loader = loader;
        this.Locations = new Map();
        this.URL = url;
    }
    Game.prototype.init = function (data) {
        var _this = this;
        this.Script = data["Script"];
        data["locations"].forEach(function (name) {
            var locationUrl = new URL("./locations/" + name + ".json", _this.URL);
            _this.Locations[name] = _this.Loader.getGameLocation(locationUrl);
        });
    };
    return Game;
}());
var GameLocation = /** @class */ (function () {
    function GameLocation() {
        this.images = new Map();
        this.status = Status.LOADING;
    }
    GameLocation.prototype.init = function (data) {
    };
    return GameLocation;
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
