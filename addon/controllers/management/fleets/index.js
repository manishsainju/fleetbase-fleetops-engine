import Controller, { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { A, isArray } from '@ember/array';
import { task, timeout } from 'ember-concurrency';
import isModel from '@fleetbase/ember-core/utils/is-model';
// import Table from 'ember-light-table';

export default class ManagementFleetsIndexController extends Controller {
    /**
     * On initializtion create instance of the light table
     *
     * @void
     */
    constructor() {
        super(...arguments);
        this.table = Table.create({ columns: this.columns }, { enableSync: true });
    }

    /**
     * Inject the `operations.zones.index` controller
     *
     * @var {Controller}
     */
    @controller('operations.zones.index') zones;

    /**
     * Inject the `notifications` service
     *
     * @var {Service}
     */
    @service notifications;

    /**
     * Inject the `modals-manager` service
     *
     * @var {Service}
     */
    @service modalsManager;

    /**
     * Inject the `crud` service
     *
     * @var {Service}
     */
    @service crud;

    /**
     * Inject the `fetch` service
     *
     * @var {Service}
     */
    @service fetch;

    /**
     * Inject the `serviceAreas` service
     *
     * @var {Service}
     */
    @service serviceAreas;

    /**
     * Queryable parameters for this controller's model
     *
     * @var {Array}
     */
    queryParams = ['page', 'limit', 'sort', 'query', 'public_id', 'internal_id', 'created_by', 'updated_by', 'status'];

    /**
     * True if route is loading data
     *
     * @var {Boolean}
     */
    @tracked isRouteLoading;

    /**
     * The current page of data being viewed
     *
     * @var {Integer}
     */
    @tracked page = 1;

    /**
     * The maximum number of items to show per page
     *
     * @var {Integer}
     */
    @tracked limit;

    /**
     * The param to sort the data on, the param with prepended `-` is descending
     *
     * @var {String}
     */
    @tracked sort;

    /**
     * The filterable param `public_id`
     *
     * @var {String}
     */
    @tracked public_id;

    /**
     * The filterable param `internal_id`
     *
     * @var {String}
     */
    @tracked internal_id;

    /**
     * The filterable param `status`
     *
     * @var {Array}
     */
    @tracked status;

    /**
     * All possible order status options
     *
     * @var {String}
     */
    @tracked statusOptions = ['active', 'disabled', 'decommissioned'];

    /**
     * If all rows is toggled
     *
     * @var {Boolean}
     */
    @tracked allToggled = false;

    /**
     * All columns applicable for orders
     *
     * @var {Array}
     */
    @tracked columns = A([
         { 
            label: '', 
            valuePath: 'selected', 
            width: '40px', 
            cellComponent: 'cell/checkbox', 
            resizable: false,
            searchable: false,
            filterable: false, 
            sortable: false 
        },
        {
            label: 'Name',
            valuePath: 'name',
            width: '150px',
            cellComponent: 'cell/action',
            action: this.viewFleet.bind(this),
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Service Area',
            cellComponent: 'cell/action',
            action: this.viewServiceArea.bind(this),
            valuePath: 'service_area.name',
            resizable: true,
            width: '130px',
            filterable: true,
            filterParam: 'zone',
            filterComponent: 'filter/string',
        },
        {
            label: 'Zone',
            cellComponent: 'cell/action',
            action: this.viewZone.bind(this),
            valuePath: 'zone.name',
            resizable: true,
            width: '130px',
            filterable: true,
            filterParam: 'zone',
            filterComponent: 'filter/string',
        },
        {
            label: 'ID',
            valuePath: 'public_id',
            width: '120px',
            cellComponent: 'cell/action',
            action: this.viewFleet,
            resizable: true,
            sortable: true,
            filterable: true,
            hidden: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Internal ID',
            valuePath: 'internal_id',
            cellComponent: 'cell/action',
            action: this.viewFleet,
            width: '120px',
            resizable: true,
            sortable: true,
            filterable: true,
            hidden: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Manpower',
            valuePath: 'drivers_count',
            width: '100px',
            resizable: true,
            sortable: true,
            filterable: false
        },
        {
            label: 'Active Manpower',
            valuePath: 'drivers_online_count',
            width: '120px',
            resizable: true,
            sortable: true,
            filterable: false
        },
        {
            label: 'Task',
            valuePath: 'task',
            cellComponent: 'cell/base',
            width: '120px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Status',
            valuePath: 'status',
            cellComponent: 'cell/status',
            width: '100px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/multi-option',
            filterOptions: this.statusOptions,
        },
        {
            label: 'Created At',
            valuePath: 'createdAtShort',
            sortParam: 'created_at',
            width: '120px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/date',
        },
        {
            label: 'Updated At',
            valuePath: 'updatedAtShort',
            sortParam: 'updated_at',
            width: '120px',
            resizable: true,
            sortable: true,
            hidden: true,
            filterable: true,
            filterComponent: 'filter/date',
        },
        {
            label: '',
            cellComponent: 'cell/dropdown-button',
            ddButtonText: false,
            ddButtonIcon: 'ellipsis-h',
            ddButtonIconPrefix: 'fas',
            ddMenuLabel: 'Fleet Actions',
            cellClassNames: 'overflow-visible',
            wrapperClass: 'flex items-center justify-end mx-2',
            width: '10%',
            actions: [
                {
                    label: 'View fleet details...',
                    fn: this.viewFleet,
                },
                {
                    label: 'Assign driver to fleet...',
                    fn: () => {},
                },
                {
                    separator: true
                },
                {
                    label: 'Delete fleet...',
                    fn: this.deleteFleet,
                },
            ],
            sortable: false,
            filterable: false,
            resizable: false,
            searchable: false,
        },
    ]);

    /**
     * Toggles all rows checked or unchecked
     * 
     * @param {Boolean} selected
     * @void
     */
     @action toggleAll(selected) {
         this.allToggled = selected;
         this.table?.rows?.forEach(row => row.setProperties({ selected }));
     }

     /**
     * Sends up a dropdown action, closes the dropdown then executes the action
     * 
     * @void
     */
     @action sendDropdownAction(dd, sentAction, ...params) { 
         if(typeof dd?.actions?.close === 'function') {
             dd.actions.close();
         }
 
         if(typeof this[sentAction] === 'function') {
             this[sentAction](...params);
         }
     }

     /**
     * Bulk deletes selected `driver` via confirm prompt
     *
     * @param {Array} selected an array of selected models
     * @void
     */
     @action bulkDeleteFleets() {
         const selected = this.table.selectedRows.map(({ content }) => content);

         this.crud.bulkDelete(selected, {
             modelNamePath: `name`,
             acceptButtonText: 'Delete Fleets',
             onConfirm: (deletedFleets) => {
                 this.allToggled = false;
                 
                 deletedFleets.forEach(place => {
                     this.table.removeRow(place);
                 });
 
                this.target?.targetState?.router?.refresh();
             }
         });
     }

    /**
     * Update search query and subjects
     *
     * @param {Object} column
     * @void
     */
    @action search(event) {
        const query = event.target.value;

        this.searchTask.perform(query);
    }

    /**
     * The actual search task
     * 
     * @void
     */
    @task(function* (query) {
        if(!query) {
            this.query = null;
            return;
        }

        yield timeout(250);

        if(this.page > 1) {
            return this.setProperties({
                query,
                page: 1
            });
        }

        this.set('query', query);
    }).restartable() 
    searchTask;

    /**
     * Update columns
     *
     * @param {Array} columns the columns to update to this controller
     * @void
     */
    @action updateColumns(columns) {
        this.table.setColumns(columns);
    }

    /**
     * Sets the sort column and property for the data
     *
     * @param {Object} column
     * @void
     */
    @action onColumnClick(column) {
        if (column.sorted) {
            this.sort = `${column.ascending ? '' : '-'}${column.sortParam || column.filterParam || column.valuePath}`;
        }
    }

    /**
     * Apply column filter values to the controller
     *
     * @param {Array} columns the columns to apply filter changes for
     *
     * @void
     */
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

    /**
     * Apply column filter values to the controller
     *
     * @param {Array} columns the columns to apply filter changes for
     *
     * @void
     */
    @action setFilterOptions(valuePath, options) {
        const updatedColumns = this.columns.map((column) => {
            if (column.valuePath === valuePath) {
                column.filterOptions = options;
            }
            return column;
        });
        this.columns = updatedColumns;
    }

    /**
     * Toggles dialog to export `fleet`
     *
     * @void
     */
    @action exportFleets() {
        this.crud.export('fleet');
    }

    /**
     * View a `fleet` details in modal
     *
     * @param {FleetModel} fleet
     * @param {Object} options
     * @void
     */
    @action viewFleet(fleet, options = {}) {
        this.modalsManager.show('modals/fleet-details', {
            title: fleet.name,
            titleComponent: 'modals/layout/title-with-buttons',
            args: ['fleet'],
            headerStatus: fleet.status,
            headerButtons: [
                {
                    icon: 'cog',
                    iconPrefix: 'fas',
                    type: 'link',
                    size: 'xs',
                    ddMenuLabel: 'Fleet Actions',
                    options: [
                        {
                            title: 'Edit fleet details...',
                            action: () => {
                                this.modalsManager.done().then(() => {
                                    return this.editFleet(fleet, {
                                        onFinish: () => {
                                            this.viewFleet(fleet);
                                        },
                                    });
                                });
                            },
                        },
                    ],
                },
            ],
            acceptButtonText: 'Done',
            acceptButtonIcon: 'check',
            acceptButtonIconPrefix: 'fas',
            hideDeclineButton: true,
            fleet,
            addDriver: (driver) => {
                this.fetch.post('fleets/add', { driver: driver.id, fleet: fleet.id });
            },
            removeDriver: (driver) => {
                this.fetch.post('fleets/remove', { driver: driver.id, fleet: fleet.id });
            },
            ...options,
        });
    }

    /**
     * Create a new `fleet` in modal
     *
     * @param {Object} options
     * @void
     */
    @action createFleet() {
        const fleet = this.store.createRecord('fleet', { status: 'active' });

        return this.editFleet(fleet, {
            title: 'New Fleet',
            acceptButtonText: 'Confirm & Create',
            acceptButtonIcon: 'check',
            acceptButtonIconPrefix: 'fas',
            successNotification: (fleet) => `New fleet (${fleet.name}) created.`
        });
    }

    /**
     * Edit a `fleet` details
     *
     * @param {FleetModel} fleet
     * @param {Object} options
     * @void
     */
    @action editFleet(fleet, options = {}) {
        const isNew = fleet.get('isNew');

        this.modalsManager.show('modals/fleet-form', {
            title: 'Edit Fleet',
            acceptButtonText: 'Save Changes',
            acceptButtonIcon: 'save',
            declineButtonIcon: 'times',
            declineButtonIconPrefix: 'fas',
            statusOptions: this.statusOptions,
            fleet,
            confirm: (modal, done) => {
                modal.startLoading();

                fleet.save().then((fleet) => {
                    this.notifications.invoke('success', options.successNotification ?? `${fleet.name} details updated.`, fleet);

                    if (isNew) {
                        this.table.addRow(fleet);
                    }

                    done();
                }).catch((error) => {
                    // driver.rollbackAttributes();
                    modal.stopLoading();
                    this.notifications.serverError(error);
                });
            },
            ...options,
        });
    }

    /**
     * Delete a `fleet` via confirm prompt
     *
     * @param {FleetModel} fleet
     * @param {Object} options
     * @void
     */
    @action deleteFleet(fleet, options = {}) {
        this.crud.delete(fleet, {
            onConfirm: (fleet) => {
                this.table.removeRow(fleet);
            },
            ...options,
        });
    }

    /**
     * View a service area.
     *
     * @param {FleetModel} fleet
     * @param {Object} options
     * @void
     */
    @action viewServiceArea(fleet, options = {}) {
        this.serviceAreas.viewServiceAreaInDialog(fleet.get('service_area'), options);
    }

    /**
     * View a zone.
     *
     * @param {FleetModel} fleet
     * @param {Object} options
     * @void
     */
    @action viewZone(fleet, options = {}) {
        this.serviceAreas.viewZoneInDialog(fleet.zone, options);
    }
}
