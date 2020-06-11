/// <reference path="../engine.ts" />
/// <reference path="../game.ts" />
var data = {
    connected: [],
    currentPC: {},
    lastMove: Date.now(),
    cable: {}
};
game.commands.set("start", {
    Execute: function (game) {
        var q = game.Script.scriptQueue;
        q.push(new ScriptItem("location", new ScriptArguments("hq"), true));
        q.push(new ScriptItem("textbox", new ScriptArguments("Добро пожаловать в нашу компанию!")));
        q.push(new ScriptItem("textbox", new ScriptArguments("Наша компания сейчас активно растёт, и мы решили переехать в этот новый офис")));
        q.push(new ScriptItem("textbox", new ScriptArguments("Твоя задача - подготовить офис к работе, вперёд!")));
        q.push(new ScriptItem("textbox", new ScriptArguments(""), true));
        q.push(new ScriptItem("gui", new ScriptArguments("", true), true));
        q.push(new ScriptItem("quest", new ScriptArguments("Подготовить компьютеры в офисе", true, [{
                "name": "подключить компьютеры к сети",
                "current": 0,
                "max": 2
            },
            {
                "name": "доложить боссу",
                "current": 0,
                "max": 1
            }]), true));
        game.Locations.get("office").items.get("desk_1R").active = true;
        game.Locations.get("office").items.get("desk_1R").onclick.push("connect_1R");
        game.Locations.get("office").items.get("desk_0L").active = true;
        game.Locations.get("office").items.get("desk_0L").onclick.push("connect_0L");
        game.Script.nextScript();
    }
});
game.commands.set("connect_1R", {
    Execute: function (game) {
        connect(game, "desk_1R");
    }
});
game.commands.set("connect_0L", {
    Execute: function (game) {
        connect(game, "desk_0L");
    }
});
function cableFollow(e) {
    var elapsed = Date.now() - data.lastMove;
    if (elapsed < 50)
        return;
    var t = data.cable, rectangle = t.parentElement.getBoundingClientRect();
    if (t == null)
        return;
    // t.style.left = e.pageX + "px";
    t.style.left = (e.pageX - rectangle.left - rectangle.width * 0.48) + "px";
    // t.style.top = e.pageY + "px";
    t.style.top = (e.pageY - rectangle.top - rectangle.height * 0.5) + "px";
}
function connect(game, name) {
    var pc = game.Locations.get("office").items.get(name);
    if (!pc.active)
        return;
    data.currentPC = pc;
    game.loadLocation("officePC");
    data.cable = document.getElementById("rj45");
    window.addEventListener("mousemove", cableFollow);
}
game.commands.set("plug", {
    Execute: function (game) {
        var rj45 = document.getElementById("rj45");
        var computed = window.getComputedStyle(rj45);
        var x = parseFloat(computed.getPropertyValue("left"));
        var y = parseFloat(computed.getPropertyValue("top"));
        var distance = Math.sqrt(x * x + y * y);
        if (distance < 5) {
            game.Quest.update("Подготовить компьютеры в офисе", "подключить компьютеры к сети", 1);
            if (game.Quest.isComplete("Подготовить компьютеры в офисе", "подключить компьютеры к сети")) {
                game.Locations.get("hq").items.get("boss").active = true;
            }
            var pc = data.currentPC;
            pc.active = false;
            game.commands.get("backToOffice").Execute(game);
        }
    }
});
game.commands.set("backToOffice", {
    Execute: function (game) {
        window.removeEventListener("mousemove", cableFollow);
        game.loadLocation("office");
    }
});
game.commands.set("talk", {
    Execute: function (game) {
        if (!game.Locations.get("hq").items.get("boss").active)
            return;
        game.Locations.get("hq").items.get("boss").active = false;
        game.Quest.update("Подготовить компьютеры в офисе", "доложить боссу", 1);
        game.showMinimap = false;
        game.Script.textbox("Отличная работа!");
    }
});
