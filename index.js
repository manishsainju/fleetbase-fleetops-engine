'use strict';
const Funnel = require('broccoli-funnel');
const MergeTrees = require('broccoli-merge-trees');
const { buildEngine } = require('ember-engines/lib/engine-addon');
const { name } = require('./package');
const path = require('path');

module.exports = buildEngine({
    name,

    lazyLoading: {
        enabled: true,
    },

    included: function (app) {
        this._super.included.apply(this, arguments);

        const importJs = (module, file, options) => {
            const modulePath = path.dirname(require.resolve(module));
            this.import(`${modulePath}/${file}`, options);
        };

        importJs('leaflet-rotatedmarker', 'leaflet.rotatedMarker.js');
        importJs('leaflet-draw', 'leaflet.draw-src.js');
        importJs('leaflet-contextmenu', 'leaflet.contextmenu.js');

        // import stylesheets
        this.import('node_modules/leaflet-contextmenu/dist/leaflet.contextmenu.css');
        this.import('node_modules/leaflet-draw/dist/leaflet.draw.css');
    },

    treeForPublic: function () {
        const publicTree = this._super.treeForPublic.apply(this, arguments);

        // Use a Funnel assets
        const leafletPath = path.dirname(require.resolve('leaflet'));
        const leafletImagesPath = path.join(leafletPath, 'images');
        const addonTree = [
            new Funnel(`node_modules/${name}/assets`, {
                destDir: '/',
            }),
            new Funnel(leafletImagesPath, {
                srcDir: '/',
                destDir: '/leaflet-images',
            }),
        ];

        // Merge the addon tree with the existing tree
        return publicTree ? new MergeTrees([publicTree, ...addonTree], { overwrite: true }) : new MergeTrees([...addonTree], { overwrite: true });
    },

    _concatStyles: () => {},

    isDevelopingAddon() {
        return true;
    },
});
