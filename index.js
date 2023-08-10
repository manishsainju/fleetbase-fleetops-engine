'use strict';
const { buildEngine } = require('ember-engines/lib/engine-addon');
const { name } = require('./package');
const Funnel = require('broccoli-funnel');
const MergeTrees = require('broccoli-merge-trees');
const resolve = require('resolve');
const path = require('path');

module.exports = buildEngine({
    name,

    _concatStyles: function () {},

    lazyLoading: {
        enabled: true,
    },

    treeForPublic: function () {
        const publicTree = this._super.treeForPublic.apply(this, arguments);
        const leafletPath = path.dirname(require.resolve('leaflet'));
        const leafletImagesPath = path.join(leafletPath, 'images');
        const alwaysExclude = ['LICENSE', 'package.json', 'example.html'];
        const leafletAddons = [
            { package: 'leaflet', include: ['leaflet-src.js'], exclude: [...alwaysExclude], path: ['dist'] },
            { package: 'leaflet-contextmenu', include: undefined, exclude: [...alwaysExclude], path: ['dist'] },
            { package: 'leaflet-draw', include: undefined, exclude: [...alwaysExclude], path: ['dist'] },
            { package: 'leaflet-rotatedmarker', include: undefined, exclude: [...alwaysExclude], path: [] },
        ];
        const trees = [];

        for (let i = 0; i < leafletAddons.length; i++) {
            const leafletAdddon = leafletAddons[i];
            const leafletAddonDist = path.join(this.pathBase(leafletAdddon.package), ...leafletAdddon.path);

            trees.push(
                new Funnel(leafletAddonDist, {
                    destDir: 'leaflet',
                    include: leafletAdddon.include,
                    exclude: leafletAdddon.exclude,
                })
            );
        }

        trees.push(
            new Funnel(leafletImagesPath, {
                srcDir: '/',
                destDir: '/leaflet-images',
            })
        );
        trees.push(
            new Funnel(path.join(__dirname, 'assets'), {
                destDir: '/',
            })
        );

        // Merge the addon tree with the existing tree
        return publicTree ? new MergeTrees([publicTree, ...trees], { overwrite: true }) : new MergeTrees([...trees], { overwrite: true });
    },

    pathBase(packageName) {
        return path.dirname(resolve.sync(packageName + '/package.json', { basedir: __dirname }));
    },

    isDevelopingAddon() {
        return true;
    },
});
