enum Status {
    LOADING,
    ERROR,
    DONE,
    HIDDEN
}

class Loader {
    queue: Array<string>;
    onEmptyCallbacks:Array<Function>;

    constructor() {
        var queue:Array<string> = [];
        ['pop', 'push', 'reverse', 'shift', 'unshift', 'splice', 'sort','filter'].forEach((m) => {
            queue[m] = function () {
                var res = Array.prototype[m].apply(queue, arguments);
                // if(queue.length == 0)
                //     this.onEmptyCallbacks.forEach((callback:Function) => {
                //         callback();
                //     });
                return res;
            }
        });
        this.queue = queue;
    };

    get(url: string) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.send();
        return xhr;
    };

    getGame(url) {
        this.queue.push(url);
        var game = new Game(this, url);
        var xhr = this.get(url);
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                game.init(JSON.parse(xhr.responseText));
                this.queue = this.queue.filter((value) => value == url)
            }
        };
        game.Script = null;
        return game;
    }

    getGameLocation(url) {
        this.queue.push(url);
        var xhr = this.get(url);
        var loc = new GameLocation();
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                loc.init(JSON.parse(xhr.responseText));
                this.queue = this.queue.filter((value) => value == url)
            }
        };
    }

    getImage(config) {

    }
};

class Game {
    Script: Array<object>;
    //Quest:QuestEngine;
    Locations: Map<String, GameLocation>;
    Loader: Loader;
    URL: string;

    constructor(loader, url) {
        this.Loader = loader;
        this.Locations = new Map();
        this.URL = url
    }

    init(data: object) {
        this.Script = data["Script"];
        data["locations"].forEach((name: string) => {
            var locationUrl = new URL(`./locations/${name}.json`, this.URL)
            this.Locations[name] = this.Loader.getGameLocation(locationUrl);
        });
    }

}

class GameLocation {
    images:Map<string,ImageBitmap>;
    status: Status;

    constructor() {
        this.images = new Map();
        this.status = Status.LOADING;
    }

    init(data:object){
        
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