const LOAD_DELAY = 500;

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
                if (ldr.queue.length == 0) {
                    ldr.onEmptyCallbacks.forEach((callback: Function) => {
                        callback();
                    });
                }
                return res;
            }
        });

        Array.prototype["remove"] = function (item) {
            var L = this.length, ax: number;
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
                setTimeout(() => {
                    this.queue["remove"](url);
                }, LOAD_DELAY);
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
                setTimeout(() => {
                    this.queue["remove"](url);
                }, LOAD_DELAY);
            }
        };
        return loc;
    }

    getImage(url: string) {
        var img = new Image();
        this.queue.push(url);
        img.addEventListener("load", () => setTimeout(() => {
            this.queue["remove"](url);
        }, LOAD_DELAY));
        img.src = url;
        return img;
    }
};

class Game {
    Script: ScriptEngine;
    Quest: QuestEngine;
    Locations: Map<String, GameLocation>;
    Loader: Loader;
    URL: string;
    CurrentLocation: string;
    mapData: object;
    isMapReady: boolean = false;
    private drawingTool = new DrawingTool(this);

    set showMinimap(b: boolean) {
        var map = document.getElementById("minimap");
        if (b)
            map.classList.remove("hide");
        else map.classList.add("hide");
    }

    get showMinimap() {
        return document.getElementById("minimap").classList.contains("hide");
    }

    set showQuest(b: boolean) {
        var quest = document.getElementById("quest-header");
        if (b && this.Quest.queue.length > 0)
            quest.classList.remove("hide");
        else quest.classList.add("hide");
    }

    get showQuest() {
        return document.getElementById("quest-header").classList.contains("hide");
    }


    set showGUI(b: boolean) {
        this.showMinimap = b;
        this.showQuest = b;
    }

    get showGUI() {
        return (this.showQuest || this.showMinimap);
    }

    constructor(loader, url) {
        this.Loader = loader;
        this.Locations = new Map<String, GameLocation>();
        this.URL = url
    }

    init(data: object) {
        this.Loader.onEmptyCallbacks.push(() => {
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
        this.drawingTool.setResolution(data["gameResolution"]);
        this.Script = new ScriptEngine(this,data["script"]);
    }

    loadMap() {
        if (this.isMapReady)
            return;
        var map = document.getElementById("minimap");
        map.style.backgroundImage = `url("${this.mapData["background"]}")`;
        map.style.width = this.mapData["size"]["width"] + "px";
        map.style.height = this.mapData["size"]["height"] + "px";
        this.mapData["mapItems"].forEach(mapItem => {
            var img = document.createElement("img") as HTMLImageElement;
            img.style.position = "absolute";
            img.style.left = mapItem["x"] + 'px';
            img.style.top = mapItem["y"] + 'px';
            img.style.width = mapItem["width"] + 'px';
            img.style.height = mapItem["height"] + 'px';
            img.src = mapItem["src"];
            img.addEventListener("click", () => {
                this.loadLocation(mapItem["location"]);
            })
            map.appendChild(img);
        });
        this.isMapReady = true;
    }

    loadLocation(name: string) {
        this.loadMap();
        this.CurrentLocation = name;
        var loc = this.Locations[this.CurrentLocation] as GameLocation;
        var bgr = document.getElementById("background") as HTMLCanvasElement;
        this.drawingTool.putImage(bgr, loc.background);
        var items = document.getElementById("items");
        items.innerHTML = '';
        loc.items.forEach(item => {
            var cnv = this.drawingTool.createCanvas(item["name"]);
            items.appendChild(cnv);
            this.drawingTool.putImage(
                cnv, loc.images[item["src"]],
                item["x"], item["y"],
                item["width"], item["height"]
            );
        });
    }
}

class GameLocation {
    images: Map<string, HTMLImageElement>;
    background: HTMLImageElement;
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

class DrawingTool {
    private game: Game;
    private width: number;
    private height: number;

    setResolution(resolution: object) {
        this.width = resolution["width"];
        this.height = resolution["height"];
    }

    putImage(
        canvas: HTMLCanvasElement, image: CanvasImageSource,
        posX: number = 0, posY: number = 0,
        width: number = NaN, height: number = NaN
    ) {
        this.prepare(canvas);
        canvas.getContext("2d").drawImage(image, posX, posY,
            isNaN(width) ? canvas.width : width,
            isNaN(height) ? canvas.height : height);
    }

    prepare(canvas: HTMLCanvasElement) {
        var computed = window.getComputedStyle(canvas);
        canvas.width = this.width;
        canvas.height = this.height;
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    createCanvas(id: string) {
        var cnv = document.createElement('canvas') as HTMLCanvasElement;
        cnv.id = id;
        return cnv;
    }

    constructor(game: Game) {
        this.game = game;
    }
}

class Quest {
    tasks: Array<QuestTask>;
    name: string;

    constructor(name: string, tasks: Array<QuestTask>) {
        this.name = name;
        this.tasks = tasks;
    }
}

class QuestTask {
    name: string;
    current: number;
    max: number;

    constructor(name: string, max: number) {
        this.name = name;
        this.max = max
    }
}

class QuestEngine {
    queue: Array<Quest> = [];

    add(name: string, tasks: Array<QuestTask>) {
        this.queue.push(new Quest(name, tasks));
        this.hide(false)
        this.draw()
    };

    isComplete(questName: string, taskName: string) {
        var quest = this.queue.find(a => a.name == questName);
        if (!quest)
            return;
        var task = quest.tasks.find(a => a.name == taskName);
        return (task.current >= task.max)
    };

    remove(name: string) {
        this.queue = this.queue.filter(q => q.name != name);
        if (this.queue.length == 0) {
            this.hide(true);
            return;
        }
        this.draw();
    };

    draw() {
        var title = document.getElementById("quest-header");
        title.innerHTML = this.queue[0].name;

        var taskList = document.getElementById("task-list");
        taskList.innerHTML = "";
        this.queue[0].tasks.forEach((task => {
            var t = document.createElement("div");
            t.classList.add("quest-item");
            t.innerText = task.name + " - " + task.current + "/" + task.max;
            if (task.current >= task.max)
                t.classList.add("finished");
            taskList.appendChild(t)
        }))
    };

    update(questName: string, taskName: string, count: number) {
        var q = this.queue.findIndex(a => a.name == questName);
        var t = this.queue[q].tasks.findIndex(a => a.name == taskName)
        this.queue[q].tasks[t].current += count;
        this.draw();
    };

    hide(hidden: boolean) {
        var q = document.getElementById("quest");
        if (hidden || this.queue.length == 0) {
            q.classList.add("hide");
            return;
        }
        q.classList.remove("hide");
        this.draw();
    }

    constructor() {

    }
}

class ScriptItem {
    type: string;
    args: ScriptArguments;
    continue: boolean;

    constructor(type: string, args: ScriptArguments, cont: boolean = false) {
        this.type = type;
        this.args = args;
        this.continue = cont;
    }
}

class ScriptArguments {
    bool: boolean;
    str: string;
    list: Array<any>;

    constructor(str: string = "", bool: boolean = false, list: Array<any> = []) {
        this.bool = bool;
        this.str = str;
        this.list = list;
    }
}

class ScriptEngine {
    scriptQueue: Array<ScriptItem> = []
    scriptIsActive: boolean = false;
    private game: Game;

    nextScript() {
        var action = this.scriptQueue.shift();

        if (action == undefined) {
            this.scriptIsActive = false;
            return;
        }

        this.scriptIsActive = true;

        switch (action.type) {
            case "location":
                this.game.loadLocation(action.args.str);
                break;
            case "textbox":
                this.textbox(action.args.str);
                break;
            case "minimap":
                this.game.showMinimap = action.args.bool;
                break;
            case "gui":
                this.game.showGUI = action.args.bool;
                break;
            case "quest":
                this.game.Quest.add(action.args.str, action.args.list)
                break;
        }

        if (action.continue)
            this.nextScript();
    }

    constructor(game: Game,data:Array<ScriptItem>) {
        this.game = game;
        this.scriptQueue = data;
        this.nextScript();
    }

    textbox(str: string) {
        var box = document.getElementById("textbox");
        if (str == undefined || str.length == 0) {
            box.classList.add("hide");
            return;
        }
        box.classList.remove("hide")
        box.innerHTML = str;
    }
}