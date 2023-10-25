import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { all } from 'rsvp';

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

    /**
     * Creates an instance of OrderListOverlayComponent.
     * @memberof OrderListOverlayComponent
     */
    constructor() {
        super(...arguments);

        all([this.fetchFleets(), this.fetchUnassignedOrders(), this.fetchActiveOrders()]);
    }

    /**
     * Toggles an order selection.
     *
     * @param {OrderModel} order
     * @memberof OrderListOverlayComponent
     */
    @action selectOrder(order) {
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
        });
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
        console.log('Refetching data... in orderlist');
        await this.fetchActiveOrders();
        await this.fetchUnassignedOrders();
    }
}
