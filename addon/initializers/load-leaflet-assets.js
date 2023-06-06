export function initialize(application) {
    const path = '/engines-dist/leaflet/';
    const scripts = ['leaflet.contextmenu.js', 'leaflet.draw-src.js', 'leaflet.rotatedMarker.js'];
    const stylesheets = ['leaflet.contextmenu.css', 'leaflet.draw.css'];

    for (let i = 0; i < scripts.length; i++) {
        const script = document.createElement('script');
        script.src = path + scripts[i];
        document.body.appendChild(script);
    }

    for (let i = 0; i < stylesheets.length; i++) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = path + stylesheets[i];
        document.body.appendChild(link);
    }
}

export default {
    initialize,
};
