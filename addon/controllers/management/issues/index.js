import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action, computed } from '@ember/object';
import { A, isArray } from '@ember/array';
import isModel from '@fleetbase/ember-core/utils/is-model';
import { timeout } from 'ember-concurrency';
import { task } from 'ember-concurrency-decorators';
// import Table from 'ember-light-table';

export default class ManagementIssuesIndexController extends Controller {
    /**
     * After column is resized save the column state to user options
     *
     * @void
     */
    @action
    onColumnResized() {
        // const columnIndex = this.columns.findIndex((column) => column.valuePath === resizedColumn.valuePath);
        // this.columns = this.columns.replace(columnIndex, 1, [resizedColumn]);
        // console.log(this.columns);
    }

    /**
     * Update columns
     *
     * @param {Array} columns the columns to update to this controller
     * @void
     */
    @action
    toggleMapView() {
        return this.transitionToRoute('operations.orders.index.map');
    }

    /**
     * Apply column filter values to the controller
     *
     * @param {Array} columns the columns to apply filter changes for
     *
     * @void
     */
    @action
    applyFilters(columns) {
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
    @action
    setFilterOptions(valuePath, options) {
        const updatedColumns = this.columns.map((column) => {
            if (column.valuePath === valuePath) {
                column.filterOptions = options;
            }
            return column;
        });
        this.columns = updatedColumns;
    }

    /**
     * Update columns
     *
     * @void
     */
    @action
    checkRow() {
        this.notifyPropertyChange('checkedRows');
    }

    /**
     * Update columns
     *
     * @void
     */
    @action
    handleLinkClick(column, row) {
        if (column.valuePath === 'public_id') {
            return this.transitionToRoute('operations.orders.index.view', row.content || row);
        }
    }

    /**
     * Queryable parameters for this controller's model
     *
     * @var {Array}
     */
    queryParams = [
        'page',
        'limit',
        'sort',
        'query',
        'status',
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
     * The filterable param `tracking` for `tracking_number`
     *
     * @var {String}
     */
    @tracked tracking;

    /**
     * The filterable param `facilitator`
     *
     * @var {String}
     */
    @tracked facilitator;

    /**
     * The filterable param `customer`
     *
     * @var {String}
     */
    @tracked customer;

    /**
     * The filterable param `driver`
     *
     * @var {String}
     */
    @tracked driver;

    /**
     * The filterable param `payload`
     *
     * @var {String}
     */
    @tracked payload;

    /**
     * The filterable param `pickup`
     *
     * @var {String}
     */
    @tracked pickup;

    /**
     * The filterable param `dropoff`
     *
     * @var {String}
     */
    @tracked dropoff;

    /**
     * The filterable param `updated_by`
     *
     * @var {String}
     */
    @tracked updated_by;

    /**
     * The filterable param `created_by`
     *
     * @var {String}
     */
    @tracked created_by;

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
     * Actions that can be triggered from the table interactions
     *
     * @var {Object}
     */
    tableActions = {
        onCheckboxToggle: this.checkRow,
        onLinkClick: this.handleLinkClick,
    };

    /**
     * All columns applicable for orders
     *
     * @var {Array}
     */
    @tracked columns = [
        {
            label: 'Name',
            valuePath: 'name',
            width: '200px',
            cellComponent: 'table/cell/anchor',
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
            cellComponent: 'table/cell/anchor',
            action: this.viewFuelReport,
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Internal ID',
            valuePath: 'internal_id',
            cellComponent: 'table/cell/anchor',
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
            cellComponent: 'table/cell/base',
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
            cellComponent: 'table/cell/base',
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
            cellComponent: 'table/cell/base',
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
            cellComponent: 'table/cell/base',
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
            cellComponent: 'table/cell/status',
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
            cellComponent: 'table/cell/dropdown',
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
                    label: 'Edit Issue',
                    fn: this.editFuelReport,
                },
                {
                    separator: true,
                },
                {
                    label: 'Delete Issue',
                    fn: this.deleteFuelReport,
                },
            ],
            sortable: false,
            filterable: false,
            resizable: false,
            searchable: false,
        },
    ];

    /**
     * The search task.
     *
     * @void
     */
    @task({ restartable: true }) *search({ target: { value } }) {
        // if no query don't search
        if (isBlank(value)) {
            this.query = null;
            return;
        }

        // timeout for typing
        yield timeout(250);

        // reset page for results
        if (this.page > 1) {
            this.page = 1;
        }

        // update the query param
        this.query = value;
    }

    /**
     * Sends up a dropdown action, closes the dropdown then executes the action
     *
     * @void
     */
    @action sendDropdownAction(dd, sentAction, ...params) {
        if (typeof dd?.actions?.close === 'function') {
            dd.actions.close();
        }

        if (typeof this[sentAction] === 'function') {
            this[sentAction](...params);
        }
    }

    /**
     * Bulk deletes selected `driver` via confirm prompt
     *
     * @param {Array} selected an array of selected models
     * @void
     */
    @action bulkDeleteIssues() {
        const selected = this.table.selectedRows.map(({ content }) => content);

        this.crud.bulkDelete(selected, {
            modelNamePath: `name`,
            acceptButtonText: 'Delete Issues',
            onConfirm: (deletedIssues) => {
                this.allToggled = false;

                deletedIssues.forEach((place) => {
                    this.table.removeRow(place);
                });

                this.target?.targetState?.router?.refresh();
            },
        });
    }

    /**
     * Toggles dialog to export `issue`
     *
     * @void
     */
    @action
    exportIssues() {
        this.crud.export('issue');
    }

    /**
     * Get visible only columns
     *
     * @var {Array}
     */
    @computed('model.@each.isChecked')
    get checkedRows() {
        return this.model.filter((row) => row.isChecked);
    }
}
