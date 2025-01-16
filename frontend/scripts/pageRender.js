async function renderPage(path) {
    const response = await fetch(`${window.location.protocol}//${window.location.host}/${path}`)
    const data = await response.text()
    const main = document.querySelector("body > main");
    main.innerHTML = data;
    return data
}