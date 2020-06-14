/// <reference path="../engine.ts" />
/// <reference path="../game.ts" />

let data = {
    connected: [],
    currentPC: {},
    cable: {}
}

game.commands.set("start", {
    Execute: (game: Game) => {
        var q = game.Script.scriptQueue;
        q.push(new ScriptItem("location", new ScriptArguments("hq"), true));
        q.push(new ScriptItem("textbox", new ScriptArguments("Добро пожаловать в нашу компанию!")));
        q.push(new ScriptItem("textbox", new ScriptArguments("Наша компания сейчас активно растёт, и мы решили переехать в этот новый офис")));
        q.push(new ScriptItem("textbox", new ScriptArguments("Твоя задача - подготовить офис к работе, вперёд!")));
        q.push(new ScriptItem("textbox", new ScriptArguments(""), true));
        q.push(new ScriptItem("gui", new ScriptArguments("", true), true));
        q.push(new ScriptItem("quest", new ScriptArguments("Подготовить компьютеры в офисе", true,
            [{
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
        game.Locations.get("office").items.get("desk_1R").onclick.push("connect_1R")
        game.Locations.get("office").items.get("desk_0L").active = true;
        game.Locations.get("office").items.get("desk_0L").onclick.push("connect_0L")

        game.Script.nextScript();
    }
})
game.commands.set("connect_1R", {
    Execute(game: Game) {
        connect(game, "desk_1R");
    }
})

game.commands.set("connect_0L", {
    Execute(game: Game) {
        connect(game, "desk_0L");
    }
})

function cableFollow(e: MouseEvent) {
    var t = data.cable as HTMLElement,
        rectangle = t.parentElement.getBoundingClientRect();
    if (t == null)
        return;
    requestAnimationFrame(() => {
        t.style.left = (e.pageX - rectangle.left - rectangle.width * 0.7125) + "px";
        t.style.top = (e.pageY - rectangle.top - rectangle.height * 0.5) + "px";
    })
}

function connect(game: Game, name: string) {
    var pc = game.Locations.get("office").items.get(name);
    if (!pc.active)
        return;
    data.currentPC = pc;
    game.loadLocation("officePCBack")
    data.cable = document.getElementById("rj45");
    window.addEventListener("mousemove", cableFollow);
}

game.commands.set("plug", {
    Execute(game: Game) {
        var rj45 = document.getElementById("rj45");
        var computed = window.getComputedStyle(rj45)
        var x = parseFloat(computed.getPropertyValue("left"));
        var y = parseFloat(computed.getPropertyValue("top"));
        var distance = Math.sqrt(x * x + y * y);
        console.log(distance);
        if (distance < 10) {
            game.Quest.update("Подготовить компьютеры в офисе", "подключить компьютеры к сети", 1)
            if (game.Quest.isComplete("Подготовить компьютеры в офисе", "подключить компьютеры к сети")) {
                game.Locations.get("hq").items.get("boss").active = true;
            }
            var pc = data.currentPC as GameItem;
            pc.active = false;
            game.commands.get("backToOffice").Execute(game);
        }
    }
})

game.commands.set("backToOffice", {
    Execute(game: Game) {
        window.removeEventListener("mousemove", cableFollow);
        game.loadLocation("office");
    }
})

game.commands.set("toPCBack", {
    Execute(game: Game) {
        window.addEventListener("mousemove", cableFollow);
        game.loadLocation("officePCBack");
    }
})

game.commands.set("toPCFront", {
    Execute(game: Game) {
        window.removeEventListener("mousemove", cableFollow);
        game.loadLocation("officePCFront");
    }
})

game.commands.set("talk", {
    Execute(game: Game) {
        if (!game.Locations.get("hq").items.get("boss").active)
            return;
        game.Locations.get("hq").items.get("boss").active = false;
        game.Quest.update("Подготовить компьютеры в офисе", "доложить боссу", 1)
        game.showMinimap = false;
        game.Script.textbox("Отличная работа!");
    }
})