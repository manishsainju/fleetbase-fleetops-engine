import Controller, { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { equal } from '@ember/object/computed';
import { A, isArray } from '@ember/array';
import { task, timeout } from 'ember-concurrency';
import isModel from '@fleetbase/ember-core/utils/is-model';

export default class OperationsOrdersIndexController extends Controller {
    @controller('management.drivers.index') driversController;
    @controller('management.fleets.index') fleetController;
    // @controller('management.drivers.index') serviceAreasController;

    @service currentUser;
    @service fetch;
    @service notifications;
    @service modalsManager;
    // @service loader;
    @service crud;

    queryParams = [
        'page',
        'limit',
        'sort',
        'query',
        'public_id',
        'internal_id',
        'payload',
        'tracking_number',
        'facilitator',
        'customer',
        'driver',
        'pickup',
        'dropoff',
        'created_by',
        'updated_by',
        'status',
    ];

    @tracked allToggled = false;
    @tracked page = 1;
    @tracked limit;
    @tracked sort = '-created_at';
    @tracked public_id;
    @tracked internal_id;
    @tracked tracking;
    @tracked facilitator;
    @tracked customer;
    @tracked driver;
    @tracked payload;
    @tracked pickup;
    @tracked dropoff;
    @tracked updated_by;
    @tracked created_by;
    @tracked status;
    @tracked statusOptions = [];
    @tracked isSearchVisible = false;
    @tracked isOrdersPanelVisible = false;
    @tracked activeOrdersCount = 0;
    @tracked leafletMap;
    @tracked layout = 'map';
    @equal('layout', 'map') isMapLayout;
    @equal('layout', 'table') isTableLayout;
    @equal('layout', 'analytics') isAnalyticsLayout;

    @tracked columns = A([
        {
            label: 'ID',
            valuePath: 'public_id',
            width: '150px',
            cellComponent: 'table/cell/link-to',
            route: 'operations.orders.index.view',
            onLinkClick: this.viewOrder,
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Internal ID',
            valuePath: 'internal_id',
            width: '125px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string'
        },
        {
            label: 'Payload',
            valuePath: 'payload.public_id',
            resizable: true,
            hidden: true,
            width: '125px',
            filterable: true,
            filterLabel: 'Payload ID',
            filterParam: 'payload',
            filterComponent: 'filter/string',
        },
        {
            label: 'Customer',
            valuePath: 'customer.name',
            cellComponent: 'table/cell/base',
            width: '125px',
            resizable: true,
            sortable: true,
            hidden: true,
            filterable: true,
            filterComponent: 'filter/model',
            filterComponentPlaceholder: 'Select order customer',
            filterParam: 'customer',
            model: 'customer',
        },
        {
            label: 'Facilitator',
            valuePath: 'facilitator.name',
            cellComponent: 'table/cell/base',
            width: '125px',
            resizable: true,
            hidden: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/model',
            filterComponentPlaceholder: 'Select order facilitator',
            filterParam: 'facilitator',
            model: 'vendor',
        },
        {
            label: 'Pickup',
            valuePath: 'pickupName',
            cellComponent: 'table/cell/base',
            width: '160px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/model',
            filterComponentPlaceholder: 'Select order pickup location',
            filterParam: 'pickup',
            model: 'place',
        },
        {
            label: 'Dropoff',
            valuePath: 'dropoff_name',
            cellComponent: 'table/cell/base',
            width: '160px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/model',
            filterComponentPlaceholder: 'Select order dropoff location',
            filterParam: 'dropoff',
            model: 'place',
        },
        {
            label: 'Scheduled At',
            valuePath: 'scheduledAt',
            sortParam: 'scheduled_at',
            filterParam: 'scheduled_at',
            width: '150px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/date',
        },
        {
            label: '# Items',
            cellComponent: 'table/cell/base',
            valuePath: 'item_count',
            resizable: true,
            hidden: true,
            width: '50px'
        },
        {
            label: 'Transaction Total',
            cellComponent: 'table/cell/base',
            valuePath: 'transaction_amount',
            width: '50px',
            resizable: true,
            hidden: true,
            sortable: true
        },
        {
            label: 'Tracking Number',
            cellComponent: 'table/cell/base',
            valuePath: 'tracking',
            width: '170px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Driver Assigned',
            valuePath: 'driver_name',
            cellComponent: 'table/cell/base',
            width: '170px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/model',
            filterComponentPlaceholder: 'Select driver for order',
            filterParam: 'driver',
            model: 'driver',
        },
        {
            label: 'Type',
            cellComponent: 'cell/humanize',
            valuePath: 'type',
            width: '100px',
            resizable: true,
            hidden: true,
            sortable: true
        },
        {
            label: 'Status',
            valuePath: 'status',
            cellComponent: 'table/cell/status',
            width: '120px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/multi-option',
            filterOptions: this.statusOptions,
        },
        {
            label: 'Created At',
            valuePath: 'createdAt',
            sortParam: 'created_at',
            filterParam: 'created_at',
            width: '125px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/date',
        },
        {
            label: 'Updated At',
            valuePath: 'updatedAt',
            sortParam: 'updated_at',
            filterParam: 'updated_at',
            width: '125px',
            resizable: true,
            sortable: true,
            hidden: true,
            filterable: true,
            filterComponent: 'filter/date',
        },
        {
            label: 'Created By',
            valuePath: 'created_by_name',
            width: '125px',
            resizable: true,
            hidden: true,
            filterable: true,
            filterComponent: 'filter/model',
            filterComponentPlaceholder: 'Select user',
            filterParam: 'created_by',
            model: 'user',
        },
        {
            label: 'Updated By',
            valuePath: 'updated_by_name',
            width: '125px',
            resizable: true,
            hidden: true,
            filterable: true,
            filterComponent: 'filter/model',
            filterComponentPlaceholder: 'Select user',
            filterParam: 'updated_by',
            model: 'user',
        },
        {
            label: '',
            cellComponent: 'table/cell/dropdown',
            ddButtonText: false,
            ddButtonIcon: 'ellipsis-h',
            ddButtonIconPrefix: 'fas',
            ddMenuLabel: 'Order Actions',
            cellClassNames: 'overflow-visible',
            wrapperClass: 'flex items-center justify-end mx-2',
            width: '12%',
            actions: [
                {
                    label: 'View Order',
                    icon: 'eye',
                    fn: this.viewOrder,
                },
                {
                    label: 'Cancel Order',
                    icon: 'ban',
                    fn: this.cancelOrder,
                },
                {
                    separator: true
                },
                {
                    label: 'Delete Order',
                    icon: 'trash',
                    fn: this.deleteOrder,
                },
            ],
            sortable: false,
            filterable: false,
            resizable: false,
            searchable: false,
        },
    ]);

    @action resetView() {
        const { leafletMap } = this;

        leafletMap?.liveMap?.hideDrivers();
        leafletMap?.liveMap?.hideRoutes();
        // leafletMap?.remove();
    }

    @action toggleSearch() {
        this.isSearchVisible = !this.isSearchVisible;
    }

    @action toggleOrdersPanel() {
        this.isOrdersPanelVisible = !this.isOrdersPanelVisible;
    }

    @action hideOrdersPanel() {
        this.isOrdersPanelVisible = false;
    }

    @action showOrdersPanel() {
        this.isOrdersPanelVisible = true;
    }

    @action zoomMap(direction = 'in') {
        if (direction === 'in') {
            this.leafletMap?.zoomIn();
        } else {
            this.leafletMap?.zoomOut();
        }
    }

    @action setLayoutMode(mode) {
        this.layout = mode;

        if (mode === 'table') {
            this.isSearchVisible = false;
        }
    }

    @action sendDropdownAction(dd, sentAction, ...params) {
        if (typeof dd.actions.close === 'function') {
            dd.actions.close();
        }

        if (typeof this[sentAction] === 'function') {
            this[sentAction](...params);
        }
    }

    @action sendDropdownTransition(dd, route) {
        if (typeof dd.actions.close === 'function') {
            dd.actions.close();
        }

        this.transitionToRoute(route);
    }

    @action sendTransition(route) {
        this.transitionToRoute(route);
    }

    @action search(event) {
        const query = event.target.value;

        this.searchTask.perform(query);
    }

    @task(function* (query) {
        if (!query) {
            this.query = null;
            return;
        }

        yield timeout(250);

        if (this.page > 1) {
            return this.setProperties({
                query,
                page: 1
            });
        }

        this.set('query', query);
    }).restartable()
    searchTask;

    @action setMapReference(event) {
        this.leafletMap = event?.target;
    }

    @action exportOrders() {
        this.crud.export('order');
    }

    @action createOrder() {
        return this.transitionToRoute('operations.orders.index.new');
    }

    @action viewOrder(order) {
        return this.transitionToRoute('operations.orders.index.view', order);
    }

    @action cancelOrder(order, options = {}) {
        this.modalsManager.confirm({
            title: `Are you sure you wish to cancel this order?`,
            body: `Once this order is canceled, the order record will still be visible but activity cannot be added to this order.`,
            args: ['model'],
            order,
            confirm: (modal) => {
                modal.startLoading();

                return this.fetch.patch(`orders/cancel`, { order: order.id }).then(() => {
                    order.set('status', 'canceled');
                    this.notifications.success(`Order ${order.public_id} has been canceled.`);
                });
            },
            ...options
        });
    }

    @action dispatchOrder(order, options = {}) {
        this.modalsManager.confirm({
            title: `Are you sure you want to dispatch this order?`,
            body: `Once this order is dispatched the assigned driver will be notified.`,
            acceptButtonScheme: 'primary',
            acceptButtonText: 'Dispatch',
            acceptButtonIcon: 'paper-plane',
            args: ['order'],
            order,
            confirm: (modal) => {
                modal.startLoading();

                return this.fetch.patch(`orders/dispatch`, { order: order.id }).then(() => {
                    order.set('status', 'dispatched');
                    this.notifications.success(`Order ${order.public_id} has been dispatched.`);
                }).catch((error) => {
                    modal.stopLoading();
                    this.notifications.serverError(error);
                });
            },
            ...options
        });
    }

    @action deleteOrder(order, options = {}) {
        this.crud.delete(order, {
            onConfirm: (order) => {
                if (order.get('isDeleted')) {
                    this.table.removeRow(order);
                }
            },
            ...options
        });
    }

    @action bulkDeleteOrders(selected = []) {
        selected = selected.length > 0 ? selected : this.table.selectedRows.map(({ content }) => content);

        this.crud.bulkDelete(selected, {
            modelNamePath: `public_id`,
            acceptButtonText: 'Delete Orders',
            onConfirm: (deletedOrders) => {
                this.allToggled = false;

                deletedOrders.forEach(order => {
                    this.table.removeRow(order);
                });

                this.target?.targetState?.router?.refresh();
            }
        });
    }

    @action bulkCancelOrders(selected = []) {
        console.log('bulkCancelOrders()', ...arguments);
        selected = selected.length > 0 ? selected : this.table.selectedRows.map(({ content }) => content);

        if (!isArray(selected) || selected.length === 0) {
            return;
        }

        this.crud.bulkAction('cancel', selected, {
            acceptButtonText: 'Cancel Orders',
            acceptButtonScheme: 'danger',
            acceptButtonIcon: 'ban',
            modelNamePath: `public_id`,
            actionPath: `orders/bulk-cancel`,
            actionMethod: `PATCH`,
            onConfirm: (canceledOrders) => {
                canceledOrders.forEach(order => {
                    order.set('status', 'canceled');
                });
            },
        });
    }

    @action applyFilters(columns) {
        columns.forEach((column) => {
            // if value is a model only filter by id
            if (isModel(column.filterValue)) {
                column.filterValue = column.filterValue.id;
            }

            // if value is an array of models map to ids
            if (isArray(column.filterValue) && column.filterValue.every((v) => isModel(v))) {
                column.filterValue = column.filterValue.map((v) => v.id);
            }

            // only if filter is active continue
            if (column.isFilterActive && column.filterValue) {
                this[column.filterParam || column.valuePath] = column.filterValue;
            } else {
                this[column.filterParam || column.valuePath] = undefined;
                column.isFilterActive = false;
                column.filterValue = undefined;
            }
        });

        this.columns = columns;
    }

    @action setFilterOptions(valuePath, options) {
        const updatedColumns = this.columns.map((column) => {
            if (column.valuePath === valuePath) {
                column.filterOptions = options;
            }
            return column;
        });

        this.columns = updatedColumns;
    }

    @action onMapContainerReady() {
        this.fetchActiveOrdersCount();
    }

    @action fetchActiveOrdersCount() {
        this.fetch.get('fleet-ops/metrics/all', { discover: ['orders_in_progress'] }).then((response) => {
            this.activeOrdersCount = response.ordersInProgress;
        });
    }
}
