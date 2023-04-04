import Controller, { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { equal } from '@ember/object/computed';
import { timeout } from 'ember-concurrency';
import { task } from 'ember-concurrency-decorators';
import extractCoordinates from '@fleetbase/ember-core/utils/extract-coordinates';
import leafletIcon from '@fleetbase/ember-core/utils/leaflet-icon';
import generateSlug from '@fleetbase/ember-core/utils/generate-slug';

export default class ManagementDriversIndexController extends Controller {
    /**
     * Inject the `management.vendors.index` controller
     *
     * @var {Controller}
     */
    @controller('management.vendors.index') vendors;

    /**
     * Inject the `management.vehicles.index` controller
     *
     * @var {Controller}
     */
    @controller('management.vehicles.index') vehicles;

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
     * Inject the `store` service
     *
     * @var {Service}
     */
    @service store;

    /**
     * Inject the `fetch` service
     *
     * @var {Service}
     */
    @service fetch;

    /**
     * Inject the `hostRouter` service
     *
     * @var {Service}
     */
    @service hostRouter;

    /**
     * Inject the `currentUser` service
     *
     * @var {Service}
     */
    @service currentUser;

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
     * The filterable param `vehicle`
     *
     * @var {String}
     */
    @tracked vehicle;

    /**
     * The filterable param `fleet`
     *
     * @var {String}
     */
    @tracked fleet;

    /**
     * The filterable param `drivers_license_number`
     *
     * @var {String}
     */
    @tracked drivers_license_number;

    /**
     * The filterable param `phone`
     *
     * @var {String}
     */
    @tracked phone;

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

    /**
     * If all rows are toggled.
     *
     * @var {Boolean}
     */
    @tracked allToggled = false;

    @tracked layout = 'table';

    @equal('layout', 'grid') isGridLayout;
    @equal('layout', 'table') isTableLayout;

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
            cellComponent: 'cell/driver-name',
            action: this.viewDriver,
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'ID',
            valuePath: 'public_id',
            width: '130px',
            cellComponent: 'click-to-copy',
            resizable: true,
            sortable: true,
            filterable: true,
            hidden: false,
            filterComponent: 'filter/string',
        },
        {
            label: 'Internal ID',
            valuePath: 'internal_id',
            cellComponent: 'click-to-copy',
            width: '130px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Vendor',
            cellComponent: 'table/cell/anchor',
            action: this.viewDriverVendor,
            valuePath: 'vendor_name',
            width: '180px',
            resizable: true,
            filterable: true,
            filterComponent: 'filter/model',
            filterComponentPlaceholder: 'Select vendor to filter by',
            filterParam: 'vendor',
            model: 'vendor',
        },
        {
            label: 'Vehicle',
            cellComponent: 'table/cell/anchor',
            action: this.viewDriverVehicle,
            valuePath: 'vehicle_name',
            resizable: true,
            width: '180px',
            filterable: true,
            filterComponent: 'filter/model',
            filterComponentPlaceholder: 'Select vehicle to filter by',
            filterParam: 'vehicle',
            model: 'vehicle',
        },
        {
            label: 'Fleets',
            cellComponent: 'table/cell/link-list',
            valuePath: 'fleets',
            width: '180px',
            resizable: true,
            hidden: true,
            filterable: true,
            filterComponent: 'filter/model',
            filterComponentPlaceholder: 'Select fleet to filter by',
            filterParam: 'fleet',
            model: 'fleet',
        },
        {
            label: 'License',
            valuePath: 'drivers_license_number',
            cellComponent: 'table/cell/base',
            width: '150px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Phone',
            valuePath: 'phone',
            cellComponent: 'table/cell/base',
            width: '150px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterParam: 'phone',
            filterComponent: 'filter/string',
        },
        {
            label: 'Country',
            valuePath: 'country',
            cellComponent: 'cell/country',
            cellClassNames: 'uppercase',
            width: '120px',
            resizable: true,
            hidden: true,
            sortable: true,
            filterable: true,
            filterParam: 'country',
            filterComponent: 'filter/string',
        },
        {
            label: 'Status',
            valuePath: 'status',
            cellComponent: 'table/cell/status',
            width: '130px',
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
            width: '130px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/date',
        },
        {
            label: 'Updated At',
            valuePath: 'updatedAt',
            sortParam: 'updated_at',
            width: '130px',
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
            ddMenuLabel: 'Driver Actions',
            cellClassNames: 'overflow-visible',
            wrapperClass: 'flex items-center justify-end mx-2',
            width: '10%',
            actions: [
                {
                    label: 'View driver details...',
                    fn: this.viewDriver,
                },
                {
                    label: 'Edit driver details...',
                    fn: this.editDriver,
                },
                {
                    separator: true,
                },
                {
                    label: 'Assign order to driver...',
                    fn: this.assignOrder,
                },
                {
                    label: 'Assign vehicle to driver...',
                    fn: this.assignVehicle,
                },
                {
                    label: 'Locate driver on map...',
                    fn: this.viewOnMap,
                },
                {
                    separator: true,
                },
                {
                    label: 'Delete driver...',
                    fn: this.deleteDriver,
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
     * Switch layout view.
     *
     * @param {String} layout
     * @memberof ManagementDriversIndexController
     */
    @action changeLayout(layout) {
        this.layout = layout;
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
    @action bulkDeleteDrivers() {
        const selected = this.table.selectedRows.map(({ content }) => content);

        this.crud.bulkDelete(selected, {
            modelNamePath: `name`,
            acceptButtonText: 'Delete Drivers',
            onConfirm: (deletedDrivers) => {
                this.allToggled = false;

                deletedDrivers.forEach((place) => {
                    this.table.removeRow(place);
                });

                this.target?.targetState?.router?.refresh();
            },
        });
    }

    /**

    /**
     * Toggles dialog to export `drivers`
     *
     * @void
     */
    @action exportDrivers() {
        this.crud.export('driver');
    }

    /**
     * View a `driver` details in modal
     *
     * @param {DriverModel} driver
     * @param {Object} options
     * @void
     */
    @action viewDriver(driver, options = {}) {
        const viewDriverOnMap = () => {
            this.modalsManager.done().then(() => {
                return this.viewOnMap(driver, {
                    onFinish: () => {
                        this.viewDriver(driver);
                    },
                });
            });
        };

        this.modalsManager.show('modals/driver-details', {
            title: driver.name,
            titleComponent: 'modal/title-with-buttons',
            acceptButtonText: 'Done',
            acceptButtonIcon: 'check',
            acceptButtonIconPrefix: 'fas',
            hideDeclineButton: true,
            declineButtonIcon: 'times',
            declineButtonIconPrefix: 'fas',
            args: ['driver'],
            headerStatus: driver.status,
            headerButtons: [
                {
                    icon: 'cog',
                    iconPrefix: 'fas',
                    type: 'link',
                    size: 'xs',
                    ddMenuLabel: 'Driver Actions',
                    options: [
                        {
                            title: 'Edit Driver',
                            icon: 'edit',
                            action: () => {
                                this.modalsManager.done().then(() => {
                                    return this.editDriver(driver, {
                                        onFinish: () => {
                                            this.viewDriver(driver);
                                        },
                                    });
                                });
                            },
                        },
                        {
                            separator: true,
                        },
                        {
                            title: 'Assign Order to Driver',
                            icon: 'user-check',
                            action: () => {
                                this.modalsManager.done().then(() => {
                                    return this.assignOrder(driver, {
                                        onFinish: () => {
                                            this.viewDriver(driver);
                                        },
                                    });
                                });
                            },
                        },
                        {
                            title: 'Assign Vehicle to Driver',
                            icon: 'car',
                            action: () => {
                                this.modalsManager.done().then(() => {
                                    return this.assignVehicle(driver, {
                                        onFinish: () => {
                                            this.viewDriver(driver);
                                        },
                                    });
                                });
                            },
                        },
                        {
                            title: 'Locate Driver',
                            icon: 'map-pin',
                            action: viewDriverOnMap,
                        },
                        {
                            separator: true,
                        },
                        {
                            title: 'Listen to socket channel',
                            icon: 'headphones',
                            action: () => {
                                this.modalsManager.done().then(() => {
                                    this.hostRouter.transitionTo('console.developers-console.sockets.watch', `driver.${driver.public_id}`);
                                });
                            },
                        },
                        {
                            separator: true,
                        },
                        {
                            title: 'Delete Driver',
                            icon: 'trash',
                            action: () => {
                                this.modalsManager.done().then(() => {
                                    return this.deleteDriver(driver, {
                                        onDecline: () => {
                                            this.viewDriver(driver);
                                        },
                                    });
                                });
                            },
                        },
                    ],
                },
            ],
            viewVendor: () =>
                this.viewDriverVendor(driver, {
                    onFinish: () => {
                        this.viewDriver(driver);
                    },
                }),
            viewVehicle: () =>
                this.viewDriverVehicle(driver, {
                    onFinish: () => {
                        this.viewDriver(driver);
                    },
                }),
            viewDriverOnMap,
            driver,
            ...options,
        });
    }

    /**
     * Create a new `driver` in modal
     *
     * @param {Object} options
     * @void
     */
    @action createDriver() {
        const driver = this.store.createRecord('driver', {
            status: `active`,
            slug: generateSlug(),
        });

        return this.editDriver(driver, {
            title: 'New Driver',
            acceptButtonText: 'Create',
            acceptButtonIcon: 'check',
            acceptButtonIconPrefix: 'fas',
            successNotification: (driver) => `New driver (${driver.name}) created.`,
            onConfirm: () => {
                if (driver.get('isNew')) {
                    return;
                }

                this.table.addRow(driver);
            },
        });
    }

    /**
     * Edit a `driver` details
     *
     * @param {DriverModel} driver
     * @param {Object} options
     * @void
     */
    @action editDriver(driver, options = {}) {
        // make sure vehicle is loaded
        driver.loadVehicle();

        this.modalsManager.show('modals/driver-form', {
            title: 'Edit Driver',
            acceptButtonText: 'Save Changes',
            acceptButtonIcon: 'save',
            declineButtonIcon: 'times',
            declineButtonIconPrefix: 'fas',
            driver,
            uploadNewPhoto: (file) => {
                this.fetch.uploadFile.perform(
                    file,
                    {
                        path: `uploads/${this.currentUser.companyId}/drivers/${driver.slug}`,
                        key_uuid: driver.id,
                        key_type: `driver`,
                        type: `driver_photo`,
                    },
                    (uploadedFile) => {
                        console.log('uploadedFile', uploadedFile);
                        driver.setProperties({
                            photo_uuid: uploadedFile.id,
                            photo_url: uploadedFile.url,
                            photo: uploadedFile,
                        });
                    }
                );
            },
            confirm: (modal, done) => {
                modal.startLoading();

                driver
                    .save()
                    .then((driver) => {
                        if (typeof options.successNotification === 'function') {
                            this.notifications.success(options.successNotification(driver));
                        } else {
                            this.notifications.success(options.successNotification || `${driver.name} details updated.`);
                        }

                        done();
                    })
                    .catch((error) => {
                        console.log(error);
                        // driver.rollbackAttributes();
                        modal.stopLoading();
                        this.notifications.serverError(error);
                    });
            },
            ...options,
        });
    }

    /**
     * Delete a `driver` via confirm prompt
     *
     * @param {DriverModel} driver
     * @param {Object} options
     * @void
     */
    @action deleteDriver(driver, options = {}) {
        this.crud.delete(driver, {
            onConfirm: (driver) => {
                if (driver.get('isDeleted')) {
                    this.table.removeRow(driver);
                }
            },
            ...options,
        });
    }

    /**
     * Prompt user to assign a `order` to a `driver`
     *
     * @param {DriverModel} driver
     * @param {Object} options
     * @void
     */
    @action assignOrder(driver, options = {}) {
        this.modalsManager.show('modals/driver-assign-order', {
            title: `Assign Order to this Driver`,
            acceptButtonText: 'Assign Order',
            acceptButtonIcon: 'check',
            acceptButtonIconPrefix: 'fas',
            acceptButtonDisabled: true,
            hideDeclineButton: true,
            selectedOrder: null,
            selectOrder: (order) => {
                this.modalsManager.setOption('selectedOrder', order);
                this.modalsManager.setOption('acceptButtonDisabled', false);
            },
            driver,
            confirm: (modal) => {
                const selectedOrder = modal.getOption('selectedOrder');

                if (!selectedOrder) {
                    this.notifications.warning('No order selected!');
                    return;
                }

                modal.startLoading();

                driver.set('current_job_uuid', selectedOrder.id);

                return driver
                    .save()
                    .then(() => {
                        this.notifications.success(`${driver.name} assigned to order.`);
                    })
                    .catch((error) => {
                        driver.rollbackAttributes();
                        modal.stopLoading();
                        this.notifications.serverError(error);
                    });
            },
            ...options,
        });
    }

    /**
     * Prompt user to assign a `vehicle` to a `driver`
     *
     * @param {DriverModel} driver
     * @param {Object} options
     * @void
     */
    @action assignVehicle(driver, options = {}) {
        this.modalsManager.show('modals/driver-assign-vehicle', {
            title: `Assign Vehicle to this Driver`,
            acceptButtonText: 'Confirm & Create',
            acceptButtonIcon: 'check',
            acceptButtonIconPrefix: 'fas',
            hideDeclineButton: true,
            driver,
            confirm: (modal) => {
                modal.startLoading();

                return driver
                    .save()
                    .then((driver) => {
                        this.notifications.success(`${driver.name} assigned to vehicle.`);
                    })
                    .catch((error) => {
                        driver.rollbackAttributes();
                        modal.stopLoading();
                        this.notifications.serverError(error);
                    });
            },
            ...options,
        });
    }

    /**
     * Display a dialog with a map view of the `driver` location
     *
     * @param {DriverModel} driver
     * @void
     */
    @action viewOnMap(driver, options = {}) {
        const { location } = driver;
        const [latitude, longitude] = extractCoordinates(location.coordinates);

        this.modalsManager.show('modals/point-map', {
            title: `Location of ${driver.name}`,
            acceptButtonText: 'Done',
            acceptButtonIcon: 'check',
            acceptButtonIconPrefix: 'fas',
            modalClass: 'modal-lg',
            hideDeclineButton: true,
            latitude,
            longitude,
            location,
            popupText: `${driver.name} (${driver.public_id})`,
            icon: leafletIcon({
                iconUrl: driver?.vehicle_avatar,
                iconSize: [40, 40],
            }),
            ...options,
        });
    }

    /**
     * View information about the drivers assigned vehicle
     *
     * @param {DriverModel} driver
     * @param {Object} options
     * @void
     */
    @action async viewDriverVehicle(driver, options = {}) {
        this.modalsManager.displayLoader();

        const vehicle = await this.store.findRecord('vehicle', driver.vehicle_uuid);

        this.modalsManager.done().then(() => {
            return this.vehicles.viewVehicle(vehicle, options);
        });
    }

    /**
     * View information about the driver vendor
     *
     * @param {DriverModel} driver
     * @param {Object} options
     * @void
     */
    @action async viewDriverVendor(driver, options = {}) {
        this.modalsManager.displayLoader();

        const vendor = await this.store.findRecord('vendor', driver.vendor_uuid);

        this.modalsManager.done().then(() => {
            return this.vendors.viewVendor(vendor, options);
        });
    }
}
