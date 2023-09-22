import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import generateSlug from '@fleetbase/ember-core/utils/generate-slug';

export default class ManagementVehiclesIndexDetailsController extends Controller {
    /**
     * True if updating service rate.
     *
     * @var {Boolean}
     */
    @tracked isUpdatingVehicle = false;
    /**
     * Inject the `loader` service
     *
     * @var {Service}
     */
    @service loader;
    /**
     * Inject the `notifications` service
     *
     * @var {Service}
     */
    @service notifications;
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
    @service store;

    /**
     * Inject the `modalsManager` service
     *
     * @memberof OnboardIndexController
     */
    @service modalsManager;
    // // Initialize tracked variables to store data from the child component
    // @tracked selectedDeviceId = null;
    // @tracked selectedDevice = null;

    // // Function to receive data from the child component when the value changes
    // @action
    // handleDeviceChange(deviceId, device) {
    //     this.selectedDeviceId = deviceId;
    //     this.selectedDevice = device;
    // }

    /**
     * Create a new `vehicle` in modal
     *
     * @param {Object} options
     * @void
     */
    @action createDevices() {
        console.log('demo');
        const vehicle = this.store.createRecord('vehicle', {
            status: 'active',
            slug: generateSlug(),
        });

        return this.editVehicle(vehicle, {
            title: 'New Vehicle',
            acceptButtonText: 'Confirm & Create',
            acceptButtonIcon: 'check',
            acceptButtonIconPrefix: 'fas',
            // successNotification: `New vehicle (${vehicle.name}) created.`,
            onConfirm: () => {
                return this.hostRouter.refresh();
            },
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
                this.fetch.uploadFile.perform(
                    file,
                    {
                        path: `uploads/${this.currentUser.companyId}/vehicles/${vehicle.slug}`,
                        subject_uuid: vehicle.id,
                        subject_type: `vehicle`,
                        type: `vehicle_photo`,
                    },
                    (uploadedFile) => {
                        vehicle.setProperties({
                            photo_uuid: uploadedFile.id,
                            photo_url: uploadedFile.url,
                            photo: uploadedFile,
                        });
                    }
                );
            },
            confirm: (modal, done) => {
                modal.startLoading();

                vehicle
                    .save()
                    .then((vehicle) => {
                        this.notifications.success(options.successNotification ?? `${vehicle.name} details updated.`);
                    })
                    .catch((error) => {
                        modal.stopLoading();
                        this.notifications.serverError(error);
                    })
                    .finally(() => {
                        done();
                    });
            },
            ...options,
        });
    }

    @action transitionBack() {
        return this.transitionToRoute('management.vehicles.index');
    }
}
