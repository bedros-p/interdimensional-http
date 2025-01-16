async function renderPage(path) {
    const response = await fetch(`${window.location.protocol}//${window.location.host}/${path}`, {
        method: 'GET',
        headers: {
            'x-dimension': window.dimension.current,
        },
    })
    const data = await response.text()
    const main = document.querySelector("body > main");
    main.innerHTML = data;
    return data
}