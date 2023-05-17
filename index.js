'use strict';
const Funnel = require('broccoli-funnel');
const MergeTrees = require('broccoli-merge-trees');
const { buildEngine } = require('ember-engines/lib/engine-addon');
const { name } = require('./package');
const packagePrefix = `node_modules/${name}/node_modules`;
// const fs = require('fs-extra');
// const path = require('path');

module.exports = buildEngine({
    name,

    lazyLoading: {
        enabled: true,
    },

    _concatStyles: () => {},

    included: function (app) {
        this._super.included.apply(this, arguments);

        // leaflet-rotatedmarker js
        this.import(`${packagePrefix}/leaflet-rotatedmarker/leaflet.rotatedMarker.js`, {
            using: [{ transformation: 'es6', as: 'leaflet-rotatedmarker' }],
        });

        // leaflet-contextmenu js
        this.import(`${packagePrefix}/leaflet-contextmenu/dist/leaflet.contextmenu.js`, {
            using: [{ transformation: 'es6', as: 'leaflet-contextmenu' }],
        });

        // leaflet-contextmenu css
        this.import(`${packagePrefix}/leaflet-contextmenu/dist/leaflet.contextmenu.css`);

        // leaflet-draw js
        this.import(`${packagePrefix}/leaflet-draw/dist/leaflet.draw-src.js`, {
            using: [{ transformation: 'es6', as: 'leaflet-draw-src' }],
        });

        // leaflet-draw css
        this.import(`${packagePrefix}/leaflet-draw/dist/leaflet.draw.css`);
    },

    treeForPublic: function () {
        const publicTree = this._super.treeForPublic.apply(this, arguments);

        // Use a Funnel assets
        const addonTree = [
            new Funnel(`node_modules/${name}/assets`, {
                destDir: '/',
            }),
            new Funnel(`${packagePrefix}/leaflet/dist/images`, {
                destDir: '/leaflet-images',
            }),
        ];

        // Merge the addon tree with the existing tree
        return publicTree ? new MergeTrees([publicTree, ...addonTree], { overwrite: true }) : new MergeTrees([...addonTree], { overwrite: true });
    },

    // postBuild: function (result) {
    //     const src = path.join(result.directory, 'assets', 'leaflet-images');
    //     const dest = path.join(result.directory, '..', '..', 'public', 'fleet-ops', 'assets', 'images');

    //     if (fs.existsSync(src)) {
    //         fs.copySync(src, dest);
    //     }
    // },

    isDevelopingAddon() {
        return true;
    },
});
