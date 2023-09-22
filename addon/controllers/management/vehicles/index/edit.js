import Controller, { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ManagementVehiclesIndexEditController extends Controller {
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
     * Updates the vehicles to server
     *
     * @void
     */
    @action updateVehicle() {
        const { vehicle } = this;

        this.isUpdatingVehicle = true;
        this.loader.showLoader('.overlay-inner-content', 'Updating vehicle...');

        try {
            return vehicle
                .save()
                .then((vehicle) => {
                    return this.transitionToRoute('management.vehicles.index').then(() => {
                        this.notifications.success(`Vehicle '${vehicle.name}' updated`);
                        this.resetForm();
                        this.hostRouter.refresh();
                    });
                })
                .catch(this.notifications.serverError)
                .finally(() => {
                    this.isUpdatingVehicle = false;
                    this.loader.removeLoader();
                });
        } catch (error) {
            console.log('error', error);
            this.isUpdatingVehicle = false;
            this.loader.removeLoader();
        }
    }

    @action transitionBack() {
        return this.transitionToRoute('management.vehicles.index');
    }
    /**
     * Resets the vehicle form
     *
     * @void
     */
    @action resetForm() {
        this.vehicle = this.store.createRecord('vehicle');
    }
}
