import Controller, { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action, computed } from '@ember/object';
import { A, isArray } from '@ember/array';
import { task, timeout } from 'ember-concurrency';
import isModel from '@fleetbase/ember-core/utils/is-model';
// import Terraformer from '@terraformer/spatial';
import Point from '@fleetbase/flb-fleetops-extension/utils/geojson/point';

class Table {
    constructor(columns = [], rows = [], options = {}) {
        this.columns = columns;
        this.rows = rows;
        this.options = options;
    }

    static create(tableArgs, options = {}) {
        const { columns, rows } = tableArgs;
        return new Table(columns, rows, options);
    }
}

export default class ManagementPlacesIndexController extends Controller {

    /**
     * Inject the `operations.zones.index` controller
     *
     * @var {Controller}
     */
    @controller('operations.zones.index') zonesController;

    /**
     * Inject the `management.vendors.index` controller
     *
     * @var {Controller}
     */
    @controller('management.vendors.index') vendorsController;

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
    queryParams = ['page', 'limit', 'sort', 'query', 'public_id', 'internal_id', 'created_at', 'updated_at'];

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
     * True if all records are `selected`
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
            cellComponent: 'table/cell/checkbox',
            resizable: false,
            searchable: false,
            filterable: false,
            sortable: false
        },
        {
            label: 'Name',
            valuePath: 'name',
            width: '200px',
            cellComponent: 'table/cell/anchor',
            action: this.viewPlace,
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Address',
            valuePath: 'address',
            cellComponent: 'table/cell/anchor',
            action: this.viewPlace,
            width: '320px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterParam: 'address',
            filterComponent: 'filter/string',
        },
        {
            label: 'ID',
            valuePath: 'public_id',
            width: '120px',
            cellComponent: 'click-to-copy',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Internal ID',
            valuePath: 'internal_id',
            cellComponent: 'click-to-copy',
            width: '120px',
            resizable: true,
            sortable: true,
            filterable: true,
            hidden: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Email',
            valuePath: 'email',
            cellComponent: 'table/cell/base',
            width: '120px',
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
            width: '120px',
            resizable: true,
            sortable: true,
            hidden: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Country',
            valuePath: 'country_name',
            cellComponent: 'table/cell/base',
            cellClassNames: 'uppercase',
            width: '120px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
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
            ddMenuLabel: 'Place Actions',
            cellClassNames: 'overflow-visible',
            wrapperClass: 'flex items-center justify-end mx-2',
            width: '10%',
            actions: [
                {
                    label: 'View Place Details',
                    fn: this.viewPlace,
                },
                {
                    label: 'Edit Place',
                    fn: this.editPlace,
                },
                {
                    separator: true
                },
                {
                    label: 'View Place on Map',
                    fn: this.viewOnMap,
                },
                {
                    separator: true
                },
                {
                    label: 'Delete Place',
                    fn: this.deletePlace,
                },
            ],
            sortable: false,
            filterable: false,
            resizable: false,
            searchable: false,
        },
    ]);

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
     * Toggles dialog to export `place`
     *
     * @void
     */
    @action exportPlaces() {
        this.crud.export('place');
    }

    /**
     * View a `place` details in modal
     *
     * @param {PlaceModel} place
     * @param {Object} options
     * @void
     */
    @action viewPlace(place, options) {
        const viewPlaceOnMap = () => {
            this.modalsManager.done().then(() => {
                return this.viewOnMap(place, {
                    onFinish: () => {
                        this.viewPlace(place);
                    },
                });
            });
        };

        this.modalsManager.show('modals/place-details', {
            title: place.name,
            place,
            titleComponent: 'modals/layout/title-with-buttons',
            acceptButtonText: 'Done',
            args: ['place'],
            headerButtons: [
                {
                    icon: 'cog',
                    type: 'link',
                    size: 'xs',
                    options: [
                        {
                            title: 'Edit Place',
                            action: () => {
                                this.modalsManager.done().then(() => {
                                    return this.editPlace(place, {
                                        onFinish: () => {
                                            this.viewDriver(place);
                                        },
                                    });
                                });
                            },
                        },
                        {
                            title: 'View Place on Map',
                            action: viewPlaceOnMap,
                        },
                        {
                            title: 'Assign to Vendor',
                            action: () => {
                                this.modalsManager.done().then(() => {
                                    return this.assignVendor(place, {
                                        onFinish: () => {
                                            this.viewPlace(place);
                                        },
                                    });
                                });
                            },
                        },
                        {
                            title: 'Delete Place',
                            action: () => {
                                this.modalsManager.done().then(() => {
                                    return this.deletePlace(place, {
                                        onDecline: () => {
                                            this.viewPlace(place);
                                        },
                                    });
                                });
                            },
                        },
                    ],
                },
            ],
            viewVendor: () => this.viewPlaceVendor(place, {
                onFinish: () => {
                    this.viewPlace(place);
                },
            }),
            viewPlaceOnMap,
            ...options,
        });
    }

    /**
     * Create a new `place` in modal
     *
     * @param {Object} options
     * @void
     */
    @action createPlace(options = {}) {
        const place = this.store.createRecord('place');

        return this.editPlace(place, {
            title: 'New Place',
            acceptButtonText: 'Confirm & Create',
            acceptButtonIcon: 'check',
            acceptButtonIconPrefix: 'fas',
            successNotification: (place) => `New place (${place.get('name') || place.get('street1')}) created.`,
            onConfirm: () => {
                if (place.get('isNew')) {
                    return;
                }

                this.table.addRow(place);
            },
            ...options
        });
    }

    /**
     * Edit a `place` details
     *
     * @param {PlaceModel} place
     * @param {Object} options
     * @void
     */
    @action async editPlace(place, options = {}) {
        place = await place;

        this.modalsManager.show('modals/place-form', {
            title: 'Edit Place',
            acceptButtonText: 'Save Changes',
            acceptButtonIcon: 'save',
            declineButtonIcon: 'times',
            declineButtonIconPrefix: 'fas',
            place,
            autocomplete: (selected) => {
                const coordinatesInputComponent = this.modalsManager.getOption('coordinatesInputComponent');

                place.setProperties({ ...selected });

                if (coordinatesInputComponent) {
                    coordinatesInputComponent.updateCoordinates(selected.location);
                }
            },
            setCoordinatesInput: (coordinatesInputComponent) => {
                this.modalsManager.setOption('coordinatesInputComponent', coordinatesInputComponent);
            },
            updatePlaceCoordinates: ({ latitude, longitude}) => {
                const location = new Point(longitude, latitude);

                place.setProperties({ location });
            },
            confirm: (modal, done) => {
                modal.startLoading();

                place.save().then((place) => {
                    if (typeof options.successNotification === 'function') {
                        this.notifications.success(options.successNotification(place));
                    } else {
                        this.notifications.success(options.successNotification ?? `${place.name} details updated.`);
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
     * Delete a `place` via confirm prompt
     *
     * @param {PlaceModel} place
     * @param {Object} options
     * @void
     */
    @action deletePlace(place, options = {}) {
        this.crud.delete(place, {
            onConfirm: (place) => {
                if (place.get('isDeleted')) {
                    this.table.removeRow(place);
                }
            },
            ...options,
        });
    }

    /**
     * Bulk deletes selected `place` via confirm prompt
     *
     * @param {Array} selected an array of selected models
     * @void
     */
     @action bulkDeletePlaces() {
         const selected = this.table.selectedRows.map(({ content }) => content);

         this.crud.bulkDelete(selected, {
             modelNamePath: `address`,
             acceptButtonText: 'Delete Places',
             onConfirm: (deletedPlaces) => {
                 this.allToggled = false;

                 deletedPlaces.forEach(place => {
                     this.table.removeRow(place);
                 });

                this.target?.targetState?.router?.refresh();
             }
         });
     }

    /**
     * Prompt user to assign a `vendor` to a `place`
     *
     * @param {PlaceModel} place
     * @param {Object} options
     * @void
     */
    @action assignVendor(place, options = {}) {
        this.modalsManager.show('modals/place-assign-vendor', {
            title: `Assign this Place to a Vendor`,
            acceptButtonText: 'Confirm & Create',
            hideDeclineButton: true,
            place,
            confirm: (modal) => {
                modal.startLoading();
                return place.save().then(() => {
                    this.notifications.success(`'${place.name}' details has been updated.`);
                });
            },
            ...options,
        });
    }

    /**
     * View a place location on map
     *
     * @param {PlaceModel} place
     * @param {Object} options
     * @void
     */
    @action viewOnMap(place, options = {}) {
        const { latitude, longitude } = place;

        this.modalsManager.show('modals/point-map', {
            title: `Location of ${place.name}`,
            acceptButtonText: 'Done',
            hideDeclineButton: true,
            latitude,
            longitude,
            location: [latitude, longitude],
            ...options,
        });
    }

    /**
     * View information about the driver vendor
     *
     * @param {PlaceModel} place
     * @param {Object} options
     * @void
     */
    @action async viewPlaceVendor(place, options = {}) {
        this.modalsManager.displayLoader();

        const vendor = await this.store.findRecord('vendor', place.vendor_uuid);

        this.modalsManager.done().then(() => {
            return this.vendorsController.viewVendor(vendor, options);
        });
    }
}
