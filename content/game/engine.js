var LOAD_DELAY = 500;
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
        this.drawingTool = new DrawingTool(this);
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
    Object.defineProperty(Game.prototype, "showQuest", {
        get: function () {
            return document.getElementById("quest-header").classList.contains("hide");
        },
        set: function (b) {
            var quest = document.getElementById("quest-header");
            if (b && this.Quest.queue.length > 0)
                quest.classList.remove("hide");
            else
                quest.classList.add("hide");
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Game.prototype, "showGUI", {
        get: function () {
            return (this.showQuest || this.showMinimap);
        },
        set: function (b) {
            this.showMinimap = b;
            this.showQuest = b;
        },
        enumerable: false,
        configurable: true
    });
    Game.prototype.init = function (data) {
        var _this = this;
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
        this.drawingTool.setResolution(data["gameResolution"]);
        this.Script = new ScriptEngine(this, data["script"]);
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
        var _this = this;
        this.loadMap();
        this.CurrentLocation = name;
        var loc = this.Locations[this.CurrentLocation];
        var bgr = document.getElementById("background");
        this.drawingTool.putImage(bgr, loc.background);
        var items = document.getElementById("items");
        items.innerHTML = '';
        loc.items.forEach(function (item) {
            var cnv = _this.drawingTool.createCanvas(item["name"]);
            items.appendChild(cnv);
            _this.drawingTool.putImage(cnv, loc.images[item["src"]], item["x"], item["y"], item["width"], item["height"]);
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
    function DrawingTool(game) {
        this.game = game;
    }
    DrawingTool.prototype.setResolution = function (resolution) {
        this.width = resolution["width"];
        this.height = resolution["height"];
    };
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
        canvas.width = this.width;
        canvas.height = this.height;
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
var Quest = /** @class */ (function () {
    function Quest(name, tasks) {
        this.name = name;
        this.tasks = tasks;
    }
    return Quest;
}());
var QuestTask = /** @class */ (function () {
    function QuestTask(name, max) {
        this.name = name;
        this.max = max;
    }
    return QuestTask;
}());
var QuestEngine = /** @class */ (function () {
    function QuestEngine() {
        this.queue = [];
    }
    QuestEngine.prototype.add = function (name, tasks) {
        this.queue.push(new Quest(name, tasks));
        this.hide(false);
        this.draw();
    };
    ;
    QuestEngine.prototype.isComplete = function (questName, taskName) {
        var quest = this.queue.find(function (a) { return a.name == questName; });
        if (!quest)
            return;
        var task = quest.tasks.find(function (a) { return a.name == taskName; });
        return (task.current >= task.max);
    };
    ;
    QuestEngine.prototype.remove = function (name) {
        this.queue = this.queue.filter(function (q) { return q.name != name; });
        if (this.queue.length == 0) {
            this.hide(true);
            return;
        }
        this.draw();
    };
    ;
    QuestEngine.prototype.draw = function () {
        var title = document.getElementById("quest-header");
        title.innerHTML = this.queue[0].name;
        var taskList = document.getElementById("task-list");
        taskList.innerHTML = "";
        this.queue[0].tasks.forEach((function (task) {
            var t = document.createElement("div");
            t.classList.add("quest-item");
            t.innerText = task.name + " - " + task.current + "/" + task.max;
            if (task.current >= task.max)
                t.classList.add("finished");
            taskList.appendChild(t);
        }));
    };
    ;
    QuestEngine.prototype.update = function (questName, taskName, count) {
        var q = this.queue.findIndex(function (a) { return a.name == questName; });
        var t = this.queue[q].tasks.findIndex(function (a) { return a.name == taskName; });
        this.queue[q].tasks[t].current += count;
        this.draw();
    };
    ;
    QuestEngine.prototype.hide = function (hidden) {
        var q = document.getElementById("quest");
        if (hidden || this.queue.length == 0) {
            q.classList.add("hide");
            return;
        }
        q.classList.remove("hide");
        this.draw();
    };
    return QuestEngine;
}());
var ScriptItem = /** @class */ (function () {
    function ScriptItem(type, args, cont) {
        if (cont === void 0) { cont = false; }
        this.type = type;
        this.args = args;
        this.continue = cont;
    }
    return ScriptItem;
}());
var ScriptArguments = /** @class */ (function () {
    function ScriptArguments(str, bool, list) {
        if (str === void 0) { str = ""; }
        if (bool === void 0) { bool = false; }
        if (list === void 0) { list = []; }
        this.bool = bool;
        this.str = str;
        this.list = list;
    }
    return ScriptArguments;
}());
var ScriptEngine = /** @class */ (function () {
    function ScriptEngine(game, data) {
        this.scriptQueue = [];
        this.scriptIsActive = false;
        this.game = game;
        this.scriptQueue = data;
        this.nextScript();
    }
    ScriptEngine.prototype.nextScript = function () {
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
                this.game.Quest.add(action.args.str, action.args.list);
                break;
        }
        if (action.continue)
            this.nextScript();
    };
    ScriptEngine.prototype.textbox = function (str) {
        var box = document.getElementById("textbox");
        if (str == undefined || str.length == 0) {
            box.classList.add("hide");
            return;
        }
        box.classList.remove("hide");
        box.innerHTML = str;
    };
    return ScriptEngine;
}());
