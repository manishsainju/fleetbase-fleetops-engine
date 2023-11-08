import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { all } from 'rsvp';
import { alias } from '@ember/object/computed';

export default class OrderListOverlayComponent extends Component {
    @service dataRefresh;
    /**
     * Inject the `store` service
     *
     * @memberof OrderListOverlayComponent
     */
    @service store;

    /**
     * Inject the `fetch` service
     *
     * @memberof OrderListOverlayComponent
     */
    @service fetch;

    /**
     * Inject the `appCache` service
     *
     * @memberof OrderListOverlayComponent
     */
    @service appCache;

    /**
     * Inject the `router` service
     *
     * @memberof OrderListOverlayComponent
     */
    @service router;

    /**
     * Inject the `hostRouter` service
     *
     * @memberof OrderListOverlayComponent
     */
    @service hostRouter;

    /**
     * Inject the `modals-manager` service
     *
     * @var {Service}
     */
    @service modalsManager;

    /**
     * The loading state of the orders overlay
     *
     * @memberof OrderListOverlayComponent
     */
    @tracked isLoading = false;

    /**
     * The loaded fleet records.
     *
     * @memberof OrderListOverlayComponent
     */
    @tracked fleets = [];

    /**
     * The loaded active order records.
     *
     * @memberof OrderListOverlayComponent
     */
    @tracked activeOrders = [];

    /**
     * The loaded unassigned order records.
     *
     * @memberof OrderListOverlayComponent
     */
    @tracked unassignedOrders = [];

    /**
     * The user selected order records.
     *
     * @memberof OrderListOverlayComponent
     */
    @tracked selectedOrders = [];

    /**
     * Search filter variable
     *
     * @memberof OrderListOverlayComponent
     */
    @tracked query = null;

    @tracked markerGroup = L.layerGroup().addTo(this.leafletMap);
    /**
     * Reference to the leaflet map object
     *
     * @type {Object}
     */
    @alias('args.map') leafletMap;
    /**
     * Creates an instance of OrderListOverlayComponent.
     * @memberof OrderListOverlayComponent
     */
    constructor() {
        super(...arguments);

        all([this.fetchFleets(), this.fetchUnassignedOrders(), this.fetchActiveOrders()]);
    }

    @action calculateRouteWaypoints(payload) {
        const waypoints = [];
        const coordinates = [];

        waypoints.push(payload.pickup, ...payload.waypoints.toArray(), payload.dropoff);
        waypoints.forEach((place) => {
            if (place && place.get('longitude') && place.get('latitude')) {
                if (place.hasInvalidCoordinates) {
                    return;
                }

                coordinates.push([place.get('latitude'), place.get('longitude')]);
            }
        });

        return coordinates;
    }
    @action displayOrderRoute(order) {
        const payload = order.payload;
        const redIcon = L.divIcon({
            className: 'custom-icon',
            html: '<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25"><circle cx="12" cy="12" r="10" fill="red" /></svg>',
            iconSize: [25, 25],
            iconAnchor: [12, 12],
        });
        const greenIcon = L.divIcon({
            className: 'custom-icon',
            html: '<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25"><circle cx="12" cy="12" r="10" fill="green" /></svg>',
            iconSize: [25, 25],
            iconAnchor: [12, 12],
        });
        const pickupMarker = L.marker([payload.pickup.latitude, payload.pickup.longitude], { icon: redIcon });
        const dropoffMarker = L.marker([payload.dropoff.latitude, payload.dropoff.longitude], { icon: greenIcon });
        const markerLocations = [pickupMarker.getLatLng(), dropoffMarker.getLatLng()];
        this.markerGroup.clearLayers();
        if (!this.selectedOrders.includes(order)) {
            this.markerGroup.addLayer(pickupMarker);
            this.markerGroup.addLayer(dropoffMarker);
            this.leafletMap.fitBounds(markerLocations, { padding: [100, 100] });
        }
    }

    /**
     * Toggles an order selection.
     *
     * @param {OrderModel} order
     * @memberof OrderListOverlayComponent
     */
    @action selectOrder(order) {
        console.log(order);
        this.displayOrderRoute(order);
        if (this.selectedOrders.includes(order)) {
            this.selectedOrders.removeObject(order);
        } else {
            this.selectedOrders.pushObject(order);
        }
    }

    /**
     * Transitions to view the order.
     *
     * @param {OrderModel} order
     * @return {Promise}
     * @memberof OrderListOverlayComponent
     */
    @action viewOrder(order) {
        const router = this.router ?? this.hostRouter;

        return router.transitionTo('console.fleet-ops.operations.orders.index.view', order);
    }

    /**
     * Prompt user to assign a driver
     *
     * @param {OrderModel} orders
     * @void
     */
    // FIXME: this was meant for bulk updates but this could get confusing so currently only 1 order gets assigned at a time
    @action async assignDrivers(order) {
        if (order[0].canLoadDriver) {
            this.modalsManager.displayLoader();

            order[0].driver = await this.store.findRecord('driver', order[0].driver_uuid);
            await this.modalsManager.done();
        }

        this.modalsManager.show(`modals/order-assign-driver`, {
            title: order[0].driver_uuid ? 'Change order driver' : 'Assign driver to order',
            acceptButtonText: 'Save Changes',
            order: order[0],
            confirm: (modal) => {
                modal.startLoading();
                return order[0].save().then(() => {
                    this.notifications.success(`${order[0].public_id} assigned driver updated.`);
                });
            },
            computeDistanceInKilometers: (coordinates1, coordinates2) => this.computeDistanceInKilometers(coordinates1, coordinates2),
        });
    }

    computeDistanceInKilometers(coordinates1, coordinates2) {
        const [lat1, lon1] = coordinates1;
        const [lat2, lon2] = coordinates2;

        if (!isNaN(lat1) && !isNaN(lon1) && !isNaN(lat2) && !isNaN(lon2)) {
            const distance = calculateDistance(lat1, lon1, lat2, lon2);
            this.distance = distance.toFixed(3);
        } else {
            this.distance = 'N/A';
        }

        return this.distance;
    }
    /**
     * Triggers a component action.
     *
     * @param {String} actionName
     * @param {...} params
     * @memberof OrderListOverlayComponent
     */
    @action onAction(actionName, ...params) {
        params.pushObject(this);

        if (typeof this[actionName] === 'function') {
            this[actionName](...params);
        }

        if (typeof this.args[actionName] === 'function') {
            this.args[actionName](...params);
        }
    }

    /**
     * Triggers an action from the dropdown menu
     *
     * @param {DropdownActions} dd
     * @param {String} actionName
     * @param {...} params
     * @memberof OrderListOverlayComponent
     */
    @action onDropdownAction(dd, actionName, ...params) {
        if (typeof dd?.actions?.close === 'function') {
            dd.actions.close();
        }

        this.onAction(actionName, ...params);
    }

    /**
     * Loads fleets records.
     *
     * @return {Promise}
     * @memberof OrderListOverlayComponent
     */
    @action fetchFleets() {
        this.isLoading = true;

        // if (this.appCache.has('fleets')) {
        //     this.fleets = this.appCache.getEmberData('fleets', 'fleet');
        // }

        return this.store
            .query('fleet', { with: ['serviceArea', 'drivers.jobs', 'drivers.currentJob'], without: ['drivers.fleets'] })
            .then((fleets) => {
                this.fleets = fleets;
                this.appCache.setEmberData('fleets', fleets);
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    /**
     * Loads unassinged orders records.
     *
     * @return {Promise}
     * @memberof OrderListOverlayComponent
     */
    @action fetchUnassignedOrders() {
        this.isLoading = true;

        return this.store
            .query('order', { unassigned: 1 })
            .then((unassignedOrders) => {
                this.unassignedOrders = unassignedOrders;
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    /**
     * Loads active order records.
     *
     * @return {Promise}
     * @memberof OrderListOverlayComponent
     */
    @action fetchActiveOrders() {
        this.isLoading = true;

        return this.fetch
            .get(
                'fleet-ops/live/orders',
                {},
                {
                    normalizeToEmberData: true,
                    normalizeModelType: 'order',
                    expirationInterval: 5,
                    expirationIntervalUnit: 'minute',
                }
            )
            .then((orders) => {
                this.activeOrders = orders;
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    @action async refreshData() {
        await this.fetchActiveOrders();
        await this.fetchUnassignedOrders();
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const earthRadius = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;

    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
