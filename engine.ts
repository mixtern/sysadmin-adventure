window.addEventListener("load", () => {
    if (navigator.userAgent.toLowerCase().indexOf(' electron/') > -1) {
        document.getElementById("grab").classList.remove("hide");
        const remote = require('electron').remote;

        let min = () => remote.getCurrentWindow().minimize();
        let max = () => {
            var window = remote.getCurrentWindow();
            if (!window.isMaximized()) {
                window.maximize();
            } else {
                window.unmaximize();
            }
        }
        let cls = () => remote.getCurrentWindow().close();
    }
})

const LOAD_DELAY = 500;

enum Status {
    LOADING,
    ERROR,
    DONE,
    HIDDEN
}

interface IImageCallback { (img: HTMLImageElement): void };

class Loader {

    queue: Array<string>;
    onEmptyCallbacks: Array<Function>;

    constructor() {
        this.onEmptyCallbacks = [];
        let queue: Array<string> = [];
        let ldr = this;
        ['pop', 'push', 'splice', 'filter'].forEach((m) => {
            queue[m] = function () {
                let res = Array.prototype[m].apply(queue, arguments);
                if (ldr.queue.length == 0) {
                    ldr.onEmptyCallbacks.forEach((callback: Function) => {
                        callback();
                    });
                }
                return res;
            }
        });

        Array.prototype["remove"] = function (item) {
            let L = this.length, ax: number;
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
        let xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.send();
        return xhr;
    };

    getGame(url: string, game: Game) {
        this.queue.push(url);
        let xhr = this.get(url);
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                game.init(JSON.parse(xhr.responseText));
                setTimeout(() => {
                    this.queue["remove"](url);
                }, LOAD_DELAY);
            }
        };
        game.Script = null;
    }

    getGameLocation(game: Game, url: string) {
        this.queue.push(url);
        let xhr = this.get(url);
        let loc = new GameLocation(this, game);
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

    getImage(url: string, callback: IImageCallback = () => { }) {
        let img = new Image();
        this.queue.push(url);
        var qUpdate = () => {
            if (img.complete) {
                callback(img);
                this.queue["remove"](url);
            }
            else
                setTimeout(qUpdate, LOAD_DELAY);
        };
        img.addEventListener("load", () => setTimeout(qUpdate, LOAD_DELAY));
        img.src = url;
        return img;
    }

    loadScript(url: string) {
        console.debug(`loading script : ${url}`);
        let script = document.createElement("script");
        this.queue.push(url);
        script.addEventListener("load", () => {
            console.debug("script has been loaded");
            this.queue["remove"](url);
        });
        script.addEventListener('error', (ev) => {
            console.error(this);
        })
        script.src = url;
        let d = document;
        let head = d.getElementsByTagName('head')[0] || d.body || d.documentElement;
        head.append(script);
    }
};

class Game {
    Script: ScriptEngine;
    Inventory: GameInventory;
    Quest: QuestEngine;
    Locations: Map<String, GameLocation> = new Map<String, GameLocation>();;
    Loader: Loader;
    URL: string;
    CurrentLocation: string;
    mapData: object;
    isMapReady: boolean = false;
    drawingTool = new DrawingTool();
    commands: Map<string, IGameCommand> = new Map<string, IGameCommand>();;
    private listener: EventListener;

    set showMinimap(b: boolean) {
        let map = document.getElementById("minimap");
        if (b)
            map.classList.remove("hide");
        else map.classList.add("hide");
    }

    get showMinimap() {
        return document.getElementById("minimap").classList.contains("hide");
    }

    set showQuest(b: boolean) {
        this.Quest.hide(b);
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

    constructor(url: string, loader: Loader = new Loader()) {
        loader.getGame(url, this);
        this.Loader = loader;
        this.URL = url
    }

    init(data: object) {
        this.Loader.onEmptyCallbacks.push(() => {
            let t = this;
            t.loadLocation(t.CurrentLocation);
            console.debug('STARTING DEFAULT LOCATION');
            this.Script.nextScript();
        });
        data["locations"].forEach((name: string) => {
            let locationUrl = new URL(`./locations/${name}.json`, this.URL).href;
            this.Locations.set(name, this.Loader.getGameLocation(this, locationUrl));
        });
        this.mapData = data["map"];
        this.CurrentLocation = data["default"];
        this.drawingTool.setResolution(data["gameResolution"]);
        this.Quest = new QuestEngine(this);
        this.Script = new ScriptEngine(this, data["script"]);
        this.Loader.loadScript(data["externalHandler"]);
    }

    loadMap() {
        if (this.isMapReady)
            return;
        console.log("loading map");
        let map = document.getElementById("minimap");
        map.style.backgroundImage = `url("${this.mapData["background"]}")`;
        map.style.width = this.mapData["size"]["width"] + "px";
        map.style.height = this.mapData["size"]["height"] + "px";
        this.mapData["mapItems"].forEach(mapItem => {
            let img = document.createElement("img") as HTMLImageElement;
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
        let loc = this.Locations.get(this.CurrentLocation) as GameLocation;
        let bgr = document.getElementById("background") as HTMLCanvasElement;
        this.drawingTool.putImage(bgr, loc.background);
        let items = document.getElementById("items");
        items.innerHTML = '';
        items.removeEventListener("click", this.listener);
        this.listener = (e: MouseEvent) => {
            let width = parseInt(getComputedStyle(items).width),
                height = parseInt(getComputedStyle(items).height)
            let wratio = bgr.width / width,
                hratio = bgr.height / height;
            let x = Math.round(e.offsetX * wratio);
            let y = Math.round(e.offsetY * hratio);
            let children = items.childNodes
            console.debug(`(${x},${y})`);
            for (let i = 0; i < children.length; i++) {
                let c = children[i] as HTMLCanvasElement;
                let alpha = c.getContext("2d").getImageData(x, y, 1, 1).data[3];
                if (alpha > 0) {
                    console.log("got a click on " + c.id)
                    let item = loc.items.get(c.id);
                    if (item.onclick.length > 0) {
                        loc.items.get(c.id).click();
                        break;
                    }
                }
            }
        }
        items.addEventListener("click", this.listener);
        loc.items.forEach(item => {
            let cnv = item.canvas;
            cnv.classList.add("item");
            if (item.active)
                cnv.classList.add("active");
            items.appendChild(cnv);
            item.updateCanvas();
        }, false);
    }
}

class GameInventory {
    items: Array<GameInventoryItem> = [];
    game: Game;

    constructor(game: Game, data: Array<object>) {
        this.game = game;
        data.forEach(itemData => {
            this.items.push(new GameInventoryItem(game, itemData))
        });
    };
}

class GameInventoryItem {
    unique: boolean;
    image: HTMLImageElement;
    count: number;

    constructor(game: Game, data: object) {
        this.unique = !!data["unique"];
        this.count = data["count"];
        this.image = game.Loader.getImage(data["src"]);
    }

}

interface IGameCommand {
    Execute(game: Game): void;
}

class GameLocation {
    game: Game;
    background: HTMLImageElement;
    status: Status;
    loader: Loader;
    items: Map<string, GameItem>;

    constructor(loader: Loader, game: Game) {
        this.game = game;
        this.loader = loader;
        this.status = Status.LOADING;
        this.items = new Map();
    }

    init(data: object) {
        data["items"].forEach((itemData) => {
            let item = new GameItem(this, itemData);
            this.items.set(item.name, item);
        })
        this.background = this.loader.getImage(data["background"]);
    }
}

class GameItem {
    canvas: HTMLCanvasElement;
    location: GameLocation;
    game: Game;
    onclick: Array<string> = [];
    image: HTMLImageElement = document.createElement("img");
    src: string;
    name: string;

    get active() {
        this.updateCanvas();
        return this.canvas.classList.contains("active");
    }

    set active(b: boolean) {
        this.updateCanvas();
        if (b)
            this.canvas.classList.add("active");
        else
            this.canvas.classList.remove("active");
    }

    private _active: boolean
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(loc: GameLocation, data: object) {
        this.location = loc;
        this.game = loc.game;
        this.x = data["x"];
        this.y = data["y"];
        this.width = data["width"];
        this.height = data["height"];
        if (!!data["onClick"] && data["onClick"].length > 0)
            this.onclick.push(data["onClick"]);
        this.name = !!data["name"] ? data["name"] : data["src"];
        this.canvas = this.game.drawingTool.createCanvas(this.name);
        let t = this;
        loc.loader.getImage(data["src"], (image: HTMLImageElement) => {
            t.image = image;
            t.updateCanvas();
        });
        this.active = !!data["active"];
    }

    updateCanvas() {
        let cnv = document.getElementById(this.name) as HTMLCanvasElement;
        if (cnv != null)
            this.canvas = cnv;
        let dt = this.game.drawingTool;
        dt.prepare(this.canvas);
        dt.putImage(
            this.canvas, this.image,
            this.x, this.y,
            this.width, this.height
        );
    }

    get visible() {
        return this.canvas.classList.contains("hide");
    }

    set visible(b: boolean) {
        if (b)
            this.canvas.classList.add("hide");
        else
            this.canvas.classList.remove("hide");
    }

    click() {
        this.onclick.forEach(command => {
            this.game.commands.get(command).Execute(this.game);
        });
    }
}

class DrawingTool {
    width: number;
    height: number;

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
            isNaN(height) ? canvas.height : height)
    }

    prepare(canvas: HTMLCanvasElement) {
        canvas.width = this.width;
        canvas.height = this.height;
        let ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    createCanvas(id: string) {
        let cnv = document.createElement('canvas') as HTMLCanvasElement;
        cnv.id = id;
        return cnv;
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
    private game: Game;

    add(name: string, tasks: Array<QuestTask>) {
        this.queue.push(new Quest(name, tasks));
        this.hide(false)
        this.draw()
    };

    isComplete(questName: string, taskName: string) {
        let quest = this.queue.find(a => a.name == questName);
        if (!quest)
            return;
        let task = quest.tasks.find(a => a.name == taskName);
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
        let title = document.getElementById("quest-header");
        title.innerHTML = this.queue[0].name;

        let taskList = document.getElementById("task-list");
        taskList.innerHTML = "";
        this.queue[0].tasks.forEach((task => {
            let t = document.createElement("div");
            t.classList.add("quest-item");
            t.innerText = task.name + " - " + task.current + "/" + task.max;
            if (task.current >= task.max)
                t.classList.add("finished");
            taskList.appendChild(t)
        }))
    };

    update(questName: string, taskName: string, count: number) {
        let q = this.queue.findIndex(a => a.name == questName);
        let t = this.queue[q].tasks.findIndex(a => a.name == taskName)
        this.queue[q].tasks[t].current += count;
        this.draw();
    };

    hide(hidden: boolean) {
        let q = document.getElementById("quest");
        if (hidden || this.queue.length == 0) {
            q.classList.add("hide");
            return;
        }
        q.classList.remove("hide");
        this.draw();
    }

    constructor(game: Game) {
        this.game = game;
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
        let action = this.scriptQueue.shift();

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
            case "command":
                if (this.game.commands.has(action.args.str))
                    this.game.commands.get(action.args.str).Execute(this.game);
                break;
        }

        if (action.continue)
            this.nextScript();
    }

    constructor(game: Game, data: Array<ScriptItem>) {
        this.game = game;
        this.scriptQueue = data;
        let script = this;
        let skipClick = (e: any) => {
            switch (e.type) {
                case "click":
                    script.nextScript();
                    break;
                case "keydown":
                    if (e.key == " " || e.key == "Enter")
                        script.nextScript();
                    break;
            }
        }
        window.addEventListener("keydown", skipClick)
        window.addEventListener("click", skipClick)
    }

    textbox(str: string) {
        let box = document.getElementById("textbox");
        if (str == undefined || str.length == 0) {
            box.classList.add("hide");
            return;
        }
        box.classList.remove("hide")
        box.innerHTML = str;
    }
}