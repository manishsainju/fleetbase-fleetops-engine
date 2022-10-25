import Controller, { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action, get } from '@ember/object';
import { A, isArray } from '@ember/array';
import { task, timeout } from 'ember-concurrency';
import isModel from '@fleetbase/ember-core/utils/is-model';

export default class ManagementContactsIndexController extends Controller {

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

    /**
     * All possible contact types
     *
     * @var {String}
     */
    @tracked contactTypes = A(['contact', 'customer']);

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
            width: '170px',
            cellComponent: 'cell/media-name',
            action: this.viewContact,
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
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
            width: '130px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Email',
            valuePath: 'email',
            cellComponent: 'cell/base',
            width: '160px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Phone',
            valuePath: 'phone',
            cellComponent: 'cell/base',
            width: '140px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Type',
            valuePath: 'type',
            cellComponent: 'cell/base',
            width: '140px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
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
            cellComponent: 'cell/dropdown-button',
            ddButtonText: false,
            ddButtonIcon: 'ellipsis-h',
            ddButtonIconPrefix: 'fas',
            ddMenuLabel: 'Contact Actions',
            cellClassNames: 'overflow-visible',
            wrapperClass: 'flex items-center justify-end mx-2',
            width: '10%',
            actions: [
                {
                    label: 'View Contact Details',
                    fn: this.viewContact,
                },
                {
                    label: 'Edit Contact',
                    fn: this.editContact,
                },
                {
                    separator: true
                },
                {
                    label: 'Delete Contact',
                    fn: this.deleteContact,
                },
            ],
            sortable: false,
            filterable: false,
            resizable: false,
            searchable: false,
        },
    ]);

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
     @action bulkDeleteContacts() {
         const selected = this.table.selectedRows.map(({ content }) => content);

         this.crud.bulkDelete(selected, {
             modelNamePath: `name`,
             acceptButtonText: 'Delete Contacts',
             onConfirm: (deletedContacts) => {
                 this.allToggled = false;
                 
                 deletedContacts.forEach(place => {
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
     * Toggles dialog to export `contact`
     *
     * @void
     */
    @action exportContacts() {
        this.crud.export('contact');
    }

    /**
     * View a `contact` details in modal
     *
     * @param {ContactModel} contact
     * @param {Object} options
     * @void
     */
    @action viewContact(contact, options) {
        this.modalsManager.show('modals/contact-details', {
            title: contact.name,
            titleComponent: 'modals/layout/title-with-buttons',
            acceptButtonText: 'Done',
            acceptButtonIcon: 'check',
            acceptButtonIconPrefix: 'fas',
            hideDeclineButton: true,
            args: ['contact'],
            headerButtons: [
                {
                    icon: 'cog',
                    iconPrefix: 'fas',
                    type: 'link',
                    size: 'xs',
                    options: [
                        {
                            title: 'Edit Contact',
                            action: () => {
                                this.modalsManager.done().then(() => {
                                    return this.editContact(contact, {
                                        onFinish: () => {
                                            this.viewContact(contact);
                                        },
                                    });
                                });
                            },
                        },
                        {
                            title: 'Delete Contact',
                            action: () => {
                                this.modalsManager.done().then(() => {
                                    return this.deleteContact(contact, {
                                        onDecline: () => {
                                            this.viewContact(contact);
                                        },
                                    });
                                });
                            },
                        },
                    ],
                },
            ],
            contact,
            ...options,
        });
    }

    /**
     * Create a new `contact` in modal
     *
     * @param {Object} options
     * @void
     */
    @action createContact() {
        const contact = this.store.createRecord('contact', {
            photo_url: `/images/no-avatar.png`
        });

        return this.editContact(contact, {
            title: 'New Contact',
            acceptButtonText: 'Confirm & Create',
            acceptButtonIcon: 'check',
            acceptButtonIconPrefix: 'fas',
            successNotification: (contact) => `New contact (${contact.name}) created.`,
            onConfirm: () => {
                if (contact.get('isNew')) {
                    return;
                }

                this.table.addRow(contact);
            }
        });
    }

    /**
     * Edit a `contact` details
     *
     * @param {ContactModel} contact
     * @param {Object} options
     * @void
     */
    @action editContact(contact, options = {}) {
        this.modalsManager.show('modals/contact-form', {
            title: 'Edit Contact',
            acceptButtonText: 'Save Changes',
            acceptButtonIcon: 'save',
            declineButtonIcon: 'times',
            declineButtonIconPrefix: 'fas',
            contactTypes: this.contactTypes,
            contact,
            uploadNewPhoto: (file) => {
                this.fetch.uploadFile.perform(file, 
                    {
                        path: `uploads/${contact.company_uuid}/contacts/${contact.slug}`,
                        key_uuid: contact.id,
                        key_type: `contact`,
                        type: `contact_photo`
                    }, 
                    (uploadedFile) => {
                        contact.setProperties({
                            photo_uuid: uploadedFile.id,
                            photo_url: uploadedFile.s3url,
                            photo: uploadedFile,
                        });
                    }
                );
            },
            confirm: (modal, done) => {
                modal.startLoading();

                contact.save().then((contact) => {
                    if (typeof options.successNotification === 'function') {
                        this.notifications.success(options.successNotification(contact));
                    } else {
                        this.notifications.success(options.successNotification || `${contact.name} details updated.`);
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
     * Delete a `contact` via confirm prompt
     *
     * @param {ContactModel} contact
     * @param {Object} options
     * @void
     */
    @action deleteContact(contact, options = {}) {
        this.crud.delete(contact, {
            acceptButtonIcon: 'trash',
            onConfirm: (contact) => {
                if (contact.get('isDeleted')) {
                    this.table.removeRow(contact);
                }
            },
            ...options,
        });
    }
}
