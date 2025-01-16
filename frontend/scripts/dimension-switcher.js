/**
 * 
 * @param {number} dimensionDelta
 */
window.dimension.updater = (dimensionDelta) => {
    window.dimension.current = Math.max(window.dimension.current + dimensionDelta, 1);
    document.getElementById("dimension-number").innerText = window.dimension.current;
}

async function rerender() {
    const main = document.querySelector("body>main");
    const dimensionFetch = fetch(`/?dimension=${window.dimension.current}&embed=1`)
    document.body.setAttribute("disabled", "true");
    try {
        const dimensionText = await (await dimensionFetch).text();
        main.innerHTML = dimensionText;
    } catch (error) {
        // console.error(error);
    }
    document.body.removeAttribute("disabled");
}

window.dimension.updater(0)