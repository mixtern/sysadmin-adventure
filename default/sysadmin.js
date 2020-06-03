/// <reference path="../engine.ts" />
/// <reference path="../game.ts" />
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
    }
});
