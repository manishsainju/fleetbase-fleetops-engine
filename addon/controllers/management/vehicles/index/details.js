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

        this.modalsManager.show('modals/vehicle-devices-form', {
            title: 'Add Device',
            acceptButtonText: 'Save Changes',
            acceptButtonIcon: 'save',
            modalClass: 'modal-lg',
            vehicle: this.vehicle,
            confirm: (modal, done) => {
                modal.startLoading();
                console.log(this.vehicle)

                // vehicle
                //     .save()
                //     .then((vehicle) => {
                //         this.notifications.success(options.successNotification ?? `${vehicle.name} details updated.`);
                //     })
                //     .catch((error) => {
                //         modal.stopLoading();
                //         this.notifications.serverError(error);
                //     })
                //     .finally(() => {
                //         done();
                //     });
            },
            // onChange: () => {},
        });
    }

    @action transitionBack() {
        return this.transitionToRoute('management.vehicles.index');
    }
}
