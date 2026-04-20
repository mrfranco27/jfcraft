window.commands = {
    "/time": (args) => {
        if (args[0] === "set") {
            window.worldTime = parseInt(args[1]) % 24000;
            return `Set time to ${args[1]}`;
        }
    },
    "/tp": (args) => {
        const x = parseFloat(args[0]), y = parseFloat(args[1]), z = parseFloat(args[2]);
        window.playerEntity.position.set(x, y, z);
        return `Teleported to ${x} ${y} ${z}`;
    }
};
