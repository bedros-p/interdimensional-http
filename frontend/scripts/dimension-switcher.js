/**
 * 
 * @param {number} dimensionDelta
 */
window.dimension.updater = (dimensionDelta) => {
    window.dimension.current = Math.max(window.dimension.current + dimensionDelta, 1);
    document.getElementById("dimension-number").innerText = window.dimension.current;
}

async function rerender() {
    const main = document.getElementsByTagName("main")[0];
    const dimensionFetch = fetch(`/?dimension=${window.dimension.current}`)
    document.body.setAttribute("disabled", "true");
    try {
        const dimensionText = await dimensionFetch.text();
        main.innerHTML = dimensionText;
    } catch (error) {
        // console.error(error);
    }
    document.body.removeAttribute("disabled");
}

