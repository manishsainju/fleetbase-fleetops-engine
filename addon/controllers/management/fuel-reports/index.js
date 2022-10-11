import Controller, { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { A, isArray } from '@ember/array';
import { task, timeout } from 'ember-concurrency';
import isModel from '@fleetbase/ember-core/utils/is-model';
// import Table from 'ember-light-table';

export default class ManagementFuelReportsIndexController extends Controller {
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
    @tracked statusOptions = [];

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
            width: '200px',
            cellComponent: 'cell/action',
            action: this.viewFuelReport,
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'ID',
            valuePath: 'public_id',
            width: '120px',
            cellComponent: 'cell/action',
            action: this.viewFuelReport,
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Internal ID',
            valuePath: 'internal_id',
            cellComponent: 'cell/action',
            action: this.viewFuelReport,
            width: '120px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Email',
            valuePath: 'email',
            cellComponent: 'cell/base',
            width: '80px',
            resizable: true,
            sortable: true,
            hidden: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Phone',
            valuePath: 'phone',
            cellComponent: 'cell/base',
            width: '80px',
            resizable: true,
            sortable: true,
            hidden: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Country',
            valuePath: 'country',
            cellComponent: 'cell/base',
            width: '80px',
            resizable: true,
            sortable: true,
            hidden: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Address',
            valuePath: 'place.address',
            cellComponent: 'cell/base',
            width: '80px',
            resizable: true,
            sortable: true,
            hidden: true,
            filterable: true,
            filterParam: 'address',
            filterComponent: 'filter/string',
        },
        {
            label: 'Status',
            valuePath: 'status',
            cellComponent: 'cell/status',
            width: '10%',
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
            width: '10%',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/date',
        },
        {
            label: 'Updated At',
            valuePath: 'updatedAt',
            sortParam: 'updated_at',
            width: '10%',
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
            ddMenuLabel: 'Fuel Report Actions',
            cellClassNames: 'overflow-visible',
            width: '150px',
            actions: [
                {
                    label: 'View Details',
                    fn: this.viewFuelReport,
                },
                {
                    label: 'Edit Fuel Report',
                    fn: this.editFuelReport,
                },
                {
                    separator: true
                },
                {
                    label: 'Delete Fuel Report',
                    fn: this.deleteFuelReport,
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
     @action bulkDeleteFuelReports() {
         const selected = this.table.selectedRows.map(({ content }) => content);

         this.crud.bulkFuelReports(selected, {
             modelNamePath: `name`,
             acceptButtonText: 'Delete Fuel Reports',
             onConfirm: (deletedFuelReports) => {
                 this.allToggled = false;
                 
                 deletedFuelReports.forEach(place => {
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
     * Toggles dialog to export `fuel-report`
     *
     * @void
     */
    @action exportFuelReports() {
        this.crud.export('fuel-report');
    }

    /**
     * View a `fuelReport` details in modal
     *
     * @param {FuelReportModel} fuelReport
     * @param {Object} options
     * @void
     */
    @action viewFuelReport(fuelReport, options) {
        this.modalsManager.show('modals/fuel-report-details', {
            title: fuelReport.name,
            fuelReport,
            ...options,
        });
    }

    /**
     * Create a new `fuelReport` in modal
     *
     * @void
     */
    @action createFuelReport() {
        const fuelReport = this.store.createRecord('fuel-report');

        return this.editFuelReport(fuelReport, {
            title: 'New Fuel Report',
            acceptButtonText: 'Confirm & Create',
            acceptButtonIcon: 'check',
            acceptButtonIconPrefix: 'fas',
            successNotification: (fuelReport) => `New fuel report (${fuelReport.name}) created.`,
            onConfirm: () => {
                if (fuelReport.get('isNew')) {
                    return;
                }

                this.table.addRow(fuelReport);
            }
        });
    }

    /**
     * Edit a `fuelReport` details
     *
     * @param {FuelReportModel} fuelReport
     * @param {Object} options
     * @void
     */
    @action editFuelReport(fuelReport, options = {}) {
        this.modalsManager.show('modals/fuel-report-form', {
            title: 'Edit FuelReport',
            acceptButtonIcon: 'save',
            fuelReport,
            confirm: (modal, done) => {
                modal.startLoading();

                fuelReport.save().then((fuelReport) => {
                    if (typeof options.successNotification === 'function') {
                        this.notifications.success(options.successNotification(fuelReport));
                    } else {
                        this.notifications.success(options.successNotification || `${fuelReport.name} details updated.`);
                    }
                    return done();
                }).catch((error) => {
                    this.notifications.serverError(error);
                    modal.stopLoading();
                });
            },
            ...options,
        });
    }

    /**
     * Delete a `fuelReport` via confirm prompt
     *
     * @param {FuelReportModel} fuelReport
     * @param {Object} options
     * @void
     */
    @action deleteFuelReport(fuelReport, options = {}) {
        this.crud.delete(fuelReport, {
            onConfirm: (fuelReport) => {
                this.table.removeRow(fuelReport);
            },
            ...options,
        });
    }
}
