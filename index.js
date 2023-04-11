'use strict';
const { buildEngine } = require('ember-engines/lib/engine-addon');
const { name } = require('./package');

module.exports = buildEngine({
    name,
    lazyLoading: {
        enabled: true,
    },
    _concatStyles: () => {},
    included: function (app) {
        this._super.included.apply(this, arguments);

        // socketcluster
        this.import('node_modules/socketcluster-client/socketcluster-client.min.js', {
            using: [{ transformation: 'es6', as: 'socketcluster' }],
        });

        // leaflet-contextmenu
        this.import('node_modules/leaflet-contextmenu/dist/leaflet.contextmenu.js', {
            using: [{ transformation: 'es6', as: 'leaflet-contextmenu' }],
        });
        this.import('node_modules/leaflet-contextmenu/dist/leaflet.contextmenu.css');

        // leaflet-draw
        this.import('node_modules/leaflet-draw/dist/leaflet.draw-src.js', {
            using: [{ transformation: 'es6', as: 'leaflet-draw-src' }],
        });
        this.import('node_modules/leaflet-draw/dist/leaflet.draw.css');
    },
    isDevelopingAddon() {
        return true;
    },
});
