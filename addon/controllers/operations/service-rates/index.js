import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action, computed } from '@ember/object';
import { A } from '@ember/array';
import { task, timeout } from 'ember-concurrency';

export default class OperationsServiceRatesIndexController extends Controller {
    /**
     * Inject the `currentUser` service
     *
     * @var {Service}
     */
    @service store;
    
    /**
     * Inject the `currentUser` service
     *
     * @var {Service}
     */
    @service currentUser;

    /**
     * Inject the `fetch` service
     *
     * @var {Service}
     */
    @service fetch;

    /**
     * Inject the `fetch` service
     *
     * @var {Service}
     */
    @service crud;

    /**
     * Inject the `notifications` service
     *
     * @var {Service}
     */
    @service notifications;

    /**
     * Inject the `modalsManager` service
     *
     * @var {Service}
     */
    @service modalsManager;

    /**
     * Inject the `loader` service
     *
     * @var {Service}
     */
    @service loader;

    /**
     * True if all records are `selected`
     *
     * @var {Boolean}
     */
    @tracked allToggled = false;

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
     * Queryable parameters for this controller's model
     *
     * @var {Array}
     */
    queryParams = [
        'page',
        'limit',
        'sort'
    ];

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
            label: 'ID',
            valuePath: 'public_id',
            width: '150px',
            cellComponent: 'cell/link-to',
            onLinkClick: this.editServiceRate,
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        { 
            label: 'Service', 
            valuePath: 'service_name', 
            cellComponent: 'table/cell/base',
            width: '125px', 
            resizable: true, 
            sortable: true, 
            filterable: false 
        },
        { 
            label: 'Service Area', 
            valuePath: 'service_area_name', 
            cellComponent: 'table/cell/base',
            width: '125px', 
            resizable: true, 
            sortable: true, 
            filterable: false 
        },
        { 
            label: 'Zone', 
            valuePath: 'zone_name', 
            cellComponent: 'table/cell/base',
            width: '125px', 
            resizable: true, 
            sortable: true, 
            filterable: false 
        },
        {
            label: 'Created At',
            valuePath: 'createdAt',
            sortParam: 'created_at',
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
            width: '125px',
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
            cellClassNames: 'overflow-visible',
            wrapperClass: 'flex items-center justify-end mx-2',
            width: '10%',
            actions: [
                {
                    label: 'Edit Service Rate',
                    fn: this.editServiceRate,
                },
                {
                    label: 'Delete Service Rate',
                    fn: this.deleteServiceRate,
                },
            ],
            sortable: false,
            filterable: false,
            resizable: false,
            searchable: false,
        },
    ]);

    /**
     * Toggles dialog to export `service-rate`
     *
     * @void
     */
    @action exportServiceRates() {
        this.crud.export('service-rate');
    }

    /**
     * Sends up a dropdown action, closes the dropdown then executes the action
     * 
     * @void
     */
    @action sendDropdownAction(dd, sentAction, ...params) {
        if(typeof dd.actions.close === 'function') {
            dd.actions.close();
        }

        if(typeof this[sentAction] === 'function') {
            this[sentAction](...params);
        }
    }

    @action createServiceRate() {
        this.transitionToRoute('operations.service-rates.index.new');
    }

    @action editServiceRate(serviceRate) {
        console.log('editServiceRate()', serviceRate);
        this.transitionToRoute('operations.service-rates.index.edit', serviceRate);
    }

    /**
     * Delete a `service-rate` via confirm prompt
     *
     * @param {ServiceRateModel} serviceRate
     * @param {Object} options
     * @void
     */
    @action deleteServiceRate(serviceRate, options = {}) {
        this.crud.delete(serviceRate, {
            onConfirm: (serviceRate) => {
                if (serviceRate.get('isDeleted')) {
                    this.table.removeRow(serviceRate);
                }
            },
            ...options
        });
    }

    /**
     * Bulk deletes selected `order` via confirm prompt
     *
     * @param {Array} selected an array of selected models
     * @void
     */
    @action bulkDeleteServiceRates(selected) {
        this.crud.bulkDelete(selected, {
            modelNamePath: `public_id`,
            acceptButtonText: 'Delete Service\'s',
            onConfirm: (deletedServiceRates) => {
                this.allToggled = false;
                
                deletedServiceRates.forEach(serviceRate => {
                    serviceRate.set('selected', false);
                    this.table.removeRow(serviceRate);
                });

                this.notifyPropertyChange('sek');
                this.reloadCurrentPage();
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

}
