import Controller, { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { A, isArray } from '@ember/array';
import { task, timeout } from 'ember-concurrency';
import isModel from '@fleetbase/ember-core/utils/is-model';
import withDefaultValue from '@fleetbase/ember-core/utils/with-default-value';
// import Table from 'ember-light-table';

export default class ManagementVehiclesIndexController extends Controller {
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
     * Inject the `management.drivers.index` controller
     *
     * @var {Controller}
     */
    @controller('management.drivers.index') drivers;

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
     * Inject the `fetch` service
     *
     * @var {Service}
     */
    @service fetch;

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
            valuePath: 'display_name',
            photoPath: 'avatar_url',
            width: '200px',
            cellComponent: 'cell/media-name',
            action: this.viewVehicle,
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
            filterParam: 'query'
        },
        {
            label: 'Plate Number',
            valuePath: 'plate_number',
            width: '100px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
            filterParam: 'plate_number'
        },
        {
            label: 'Driver Assigned',
            cellComponent: 'cell/action',
            action: async (vehicle) => {
                const driver = await vehicle.loadDriver();
                
                return this.drivers.viewDriver(driver);
            },
            valuePath: 'driver_name',
            width: '120px',
            resizable: true,
            filterable: true,
            filterComponent: 'filter/model',
            filterComponentPlaceholder: 'Select driver to filter by',
            filterParam: 'driver',
            model: 'driver'
        },
        {
            label: 'ID',
            valuePath: 'public_id',
            cellComponent: 'ui/click-to-copy',
            width: '120px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Internal ID',
            valuePath: 'internal_id',
            cellComponent: 'ui/click-to-copy',
            width: '120px',
            hidden: true,
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Make',
            valuePath: 'make',
            cellComponent: 'cell/base',
            width: '80px',
            resizable: true,
            sortable: true,
            hidden: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Model',
            valuePath: 'model',
            cellComponent: 'cell/base',
            width: '80px',
            resizable: true,
            sortable: true,
            hidden: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Year',
            valuePath: 'model',
            cellComponent: 'cell/base',
            width: '80px',
            resizable: true,
            sortable: true,
            hidden: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Vendor',
            cellComponent: 'cell/action',
            action: async ({ vendor_uuid }) => {
                const vendor = await this.store.findRecord('vendor', vendor_uuid);
                
                this.vendors.viewVendor(vendor);
            },
            valuePath: 'vendor_name',
            width: '150px',
            hidden: true,
            resizable: true,
            filterable: true,
            filterComponent: 'filter/model',
            filterComponentPlaceholder: 'Select vendor to filter by',
            filterParam: 'vendor',
            model: 'vendor'
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
            width: '120px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/date',
        },
        {
            label: 'Updated At',
            valuePath: 'updatedAt',
            sortParam: 'updated_at',
            width: '12%',
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
            ddMenuLabel: 'Vehicle Actions',
            cellClassNames: 'overflow-visible',
            wrapperClass: 'flex items-center justify-end mx-2',
            width: '90px',
            actions: [
                {
                    label: 'View vehicle details...',
                    fn: this.viewVehicle,
                },
                {
                    label: 'Edit vehicle...',
                    fn: this.editVehicle,
                },
                {
                    separator: true
                },
                // {
                //     label: 'Assign driver to vehicle...',
                //     fn: this.assignDriver,
                // },
                {
                    label: 'Delete vehicle...',
                    fn: this.deleteVehicle,
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
     * Bulk deletes selected `vehicle` via confirm prompt
     *
     * @param {Array} selected an array of selected models
     * @void
     */
     @action bulkDeleteVehicles() {
         const selected = this.table.selectedRows.map(({ content }) => content);

         this.crud.bulkDelete(selected, {
             modelNamePath: `display_name`,
             acceptButtonText: 'Delete Vehicles',
             onConfirm: (deletedVehicles) => {
                 this.allToggled = false;
                 
                 deletedVehicles.forEach(place => {
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
    @action
    search(event) {
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
    @action
    updateColumns(columns) {
        this.table.setColumns(columns);
    }

    /**
     * Sets the sort column and property for the data
     *
     * @param {Object} column
     * @void
     */
    @action
    onColumnClick(column) {
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
     * Toggles dialog to export `vehicles`
     *
     * @void
     */
    @action exportVehicles() {
        this.crud.export('vehicle');
    }

    /**
     * View a `vehicle` details in modal
     *
     * @param {VehicleModel} vehicle
     * @param {Object} options
     * @void
     */
    @action async viewVehicle(vehicle, options) {
        await vehicle?.loadDriver();

        this.modalsManager.show('modals/vehicle-details', {
            title: withDefaultValue(vehicle.display_name),
            titleComponent: 'modals/layout/title-with-buttons',
            modalClass: 'modal-lg',
            acceptButtonText: 'Done',
            args: ['vehicle'],
            headerButtons: [
                {
                    icon: 'cog',
                    iconPrefix: 'fas',
                    type: 'link',
                    size: 'xs',
                    ddMenuLabel: 'Vehicle Actions',
                    options: [
                        {
                            title: 'Edit vehicle details...',
                            action: () => {
                                this.modalsManager.done().then(() => {
                                    return this.editVehicle(vehicle, {
                                        onFinish: () => {
                                            this.viewVehicle(vehicle);
                                        },
                                    });
                                });
                            },
                        },
                        {
                            title: 'Assign driver to vehicle...',
                            action: () => {
                                this.modalsManager.done().then(() => {
                                    return this.assignDriver(vehicle, {
                                        onFinish: () => {
                                            this.viewVehicle(vehicle);
                                        },
                                    });
                                });
                            },
                        },
                        {
                            title: 'Delete vehicle...',
                            action: () => {
                                this.modalsManager.done().then(() => {
                                    return this.deleteVehicle(vehicle, {
                                        onDecline: () => {
                                            this.viewVehicle(vehicle);
                                        },
                                    });
                                });
                            },
                        },
                    ]
                }
            ],
            viewDriver: (driver) => {
                this.modalsManager.done().then(() => {
                    return this.drivers.viewDriver(driver, {
                        onFinish: () => {
                            this.viewVehicle(vehicle);
                        },
                    });
                });
            },
            vehicle,
            ...options,
        });
    }

    /**
     * Create a new `vehicle` in modal
     *
     * @param {Object} options
     * @void
     */
    @action createVehicle() {
        const vehicle = this.store.createRecord('vehicle', {
            photo_url: `/images/vehicle-placeholder.png`,
            avatar_url: 'https://flb-assets.s3-ap-southeast-1.amazonaws.com/static/vehicle-icons/mini_bus.svg',
            status: 'active'
        });

        return this.editVehicle(vehicle, {
            title: 'New Vehicle',
            acceptButtonText: 'Confirm & Create',
            acceptButtonIcon: 'check',
            acceptButtonIconPrefix: 'fas',
            successNotification: (vehicle) => `New vehicle (${vehicle.name}) created.`,
            onConfirm: () => {
                if (vehicle.get('isNew')) {
                    return;
                }

                this.table.addRow(vehicle);
            }
        });
    }

    /**
     * Edit a `vehicle` details
     *
     * @param {VehicleModel} vehicle
     * @param {Object} options
     * @void
     */
    @action async editVehicle(vehicle, options = {}) {
        await vehicle?.loadDriver();

        this.modalsManager.show('modals/vehicle-form', {
            title: 'Edit Vehicle',
            acceptButtonText: 'Save Changes',
            acceptButtonIcon: 'save',
            modalClass: 'modal-lg',
            vehicle,
            uploadNewPhoto: (file) => {
                this.fetch.uploadFile.perform(file, 
                    {
                        path: `uploads/${vehicle.company_uuid}/drivers/${vehicle.slug}`,
                        key_uuid: vehicle.id,
                        key_type: `vehicle`,
                        type: `vehicle_photo`
                    }, 
                    (uploadedFile) => {
                        vehicle.setProperties({
                            photo_uuid: uploadedFile.id,
                            photo_url: uploadedFile.s3url,
                            photo: uploadedFile,
                        });
                    }
                );
            },
            confirm: (modal, done) => {
                modal.startLoading();

                vehicle.save().then((vehicle) => {
                    if (typeof options.successNotification === 'function') {
                        this.notifications.success(options.successNotification(vehicle));
                    } else {
                        this.notifications.success(options.successNotification || `${vehicle.name} details updated.`);
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
     * Delete a `vehicle` via confirm prompt
     *
     * @param {VehicleModel} vehicle
     * @param {Object} options
     * @void
     */
    @action deleteVehicle(vehicle, options = {}) {
        this.crud.delete(vehicle, {
            onConfirm: (vehicle) => {
                if (vehicle.get('isDeleted')) {
                    this.table.removeRow(vehicle);
                }
            },
            ...options,
        });
    }

    /**
     * Allow user to assign driver to a `vehicle` via prompt
     *
     * @param {VehicleModel} vehicle
     * @param {Object} options
     * @void
     */
    @action assignDriver(vehicle, options = {}) {
        
    }
}
