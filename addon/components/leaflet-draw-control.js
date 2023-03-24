/* global L */
/* eslint-disable ember/no-get */
/* eslint-disable ember/avoid-leaking-state-in-ember-objects */
/* eslint-disable no-undef */
import 'leaflet-draw-src';
import BaseLayer from 'ember-leaflet/components/base-layer';
import { run } from '@ember/runloop';
import { get, getProperties, computed } from '@ember/object';
import { camelize, classify } from '@ember/string';
import { assign } from '@ember/polyfills';

export default class LeafletDrawControl extends BaseLayer {
    enableDeleting = true; // Default value
    enableEditing = true; // Default value
    showDrawingLayer = true; // Default value

    leafletEvents = [
        L.Draw.Event.CREATED,
        L.Draw.Event.EDITED,
        L.Draw.Event.EDITMOVE,
        L.Draw.Event.EDITRESIZE,
        L.Draw.Event.EDITSTART,
        L.Draw.Event.EDITSTOP,
        L.Draw.Event.EDITVERTEX,
        L.Draw.Event.DELETED,
        L.Draw.Event.DELETESTART,
        L.Draw.Event.DELETESTOP,
        L.Draw.Event.DRAWSTART,
        L.Draw.Event.DRAWSTOP,
        L.Draw.Event.DRAWVERTEX,
    ];

    leafletOptions = ['draw', 'edit', 'enableEditing', 'position', 'showDrawingLayer'];

    @computed('leafletEvents') get usedLeafletEvents() {
        return get(this, 'leafletEvents').filter((eventName) => {
            eventName = camelize(eventName.replace(':', ' '));
            const methodName = '_' + eventName;
            const actionName = 'on' + classify(eventName);
            return get(this, methodName) !== undefined || get(this, actionName) !== undefined;
        });
    }

    addToContainer() {
        if (this._layer) {
            get(this, 'parentComponent')._layer.addLayer(this._layer);
        }
    }

    createLayer() {
        let drawingLayerGroup;
        if (get(this, 'showDrawingLayer')) {
            drawingLayerGroup = new this.L.FeatureGroup();
            const map = get(this, 'parentComponent._layer');

            if (typeof this.onDrawFeatureGroupCreated === 'function') {
                this.onDrawFeatureGroupCreated(drawingLayerGroup, map);
            }

            drawingLayerGroup.addTo(map);
        }
        return drawingLayerGroup;
    }

    didCreateLayer() {
        const map = get(this, 'parentComponent._layer');
        if (map) {
            let options = getProperties(this, 'position', 'draw', 'edit');
            if (!options.position) {
                options.position = 'topleft';
            }

            if (this._layer) {
                options.edit = assign({ featureGroup: this._layer }, options?.edit);

                if (!get(this, 'enableEditing') && !options?.edit?.edit) {
                    options.edit.edit = false;
                }

                if (!get(this, 'enableDeleting') && !options?.edit?.remove) {
                    options.edit.remove = false;
                }

                if (options.draw !== false) {
                    // Extend the default draw object with options overrides
                    options.draw = assign({}, this.L.drawLocal.draw, options?.draw);
                }

                // create draw control
                const drawControl = new this.L.Control.Draw(options);

                // trigger action/event draw control created
                if (typeof this.onDrawControlCreated === 'function') {
                    this.onDrawControlCreated(drawControl, map);
                }

                // Add the draw control to the map
                map.addControl(drawControl);

                // trigger action/event draw control added to map
                if (typeof this.onDrawControlAddedToMap === 'function') {
                    this.onDrawControlAddedToMap(drawControl, map);
                }

                // If showDrawingLayer, add new layer to the layerGroup
                if (get(this, 'showDrawingLayer')) {
                    map.on(this.L.Draw.Event.CREATED, (e) => {
                        const layer = e.layer;
                        this._layer.addLayer(layer);
                    });
                }
            }
        }
    }

    _addEventListeners() {
        this._eventHandlers = {};
        get(this, 'usedLeafletEvents').forEach((eventName) => {
            const originalEventName = eventName;
            const map = get(this, 'parentComponent._layer');
            // Cleanup the Leaflet Draw event names that have colons, ex:'draw:created'
            eventName = camelize(eventName.replace(':', ' '));
            const actionName = 'on' + classify(eventName);
            const methodName = '_' + eventName;
            // Create an event handler that runs the function inside an event loop.
            this._eventHandlers[originalEventName] = function (e) {
                run(() => {
                    // Try to invoke/send an action for this event
                    this.invokeAction(actionName, e, this._layer, map);
                    // Allow classes to add custom logic on events as well
                    if (typeof this[methodName] === 'function') {
                        run(this, this[methodName], e, this._layer, map);
                    }
                });
            };

            // The events for Leaflet Draw are on the map object, not the layer
            map.addEventListener(originalEventName, this._eventHandlers[originalEventName], this);
        });
    }

    _removeEventListeners() {
        if (this._eventHandlers) {
            get(this, 'usedLeafletEvents').forEach((eventName) => {
                const map = get(this, 'parentComponent._layer');
                // The events for Leaflet Draw are on the map object, not the layer
                map.removeEventListener(eventName, this._eventHandlers[eventName], this);
                delete this._eventHandlers[eventName];
            });
        }
    }
}
