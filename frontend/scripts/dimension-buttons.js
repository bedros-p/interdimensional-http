let intervalId;
let elapsed = 0
intervalUpdater = (dimensionDelta) => {
    return setInterval(() => {
        elapsed += 1;
        if (elapsed > 3) window.dimension.updater(dimensionDelta * (isShift ? 10 : 1));
    }, 100);
}


let isShift = false;
const elements = {"dimension-up":1, "dimension-down":-1};
Object.keys(elements).forEach(element => {
    document.getElementById(element).addEventListener("mouseup", () => {
        clearInterval(intervalId);
        elapsed = 0;
        rerender()
    });
    document.getElementById(element).addEventListener("mouseleave", () => {
        clearInterval(intervalId);
        elapsed = 0;
    });
    document.getElementById(element).addEventListener("mousedown", () => { 
        window.dimension.updater(elements[element] * (isShift ? 10 : 1));
        intervalId = intervalUpdater(elements[element]);
    });
});

const keys = ["keydown", "keyup"];
keys.forEach(key => {
    document.addEventListener(key, (event) => {
        if (event.key === "Shift") {
            isShift = !isShift;
        }
    });
});
