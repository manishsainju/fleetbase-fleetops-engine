import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import generateSlug from '@fleetbase/ember-core/utils/generate-slug';

export default class ManagementVehiclesIndexNewController extends Controller {
    /**
     * Inject the `currentUser` service
     *
     * @var {Service}
     */
    @service store;

    /**
     * Inject the `hostRouter` service
     *
     * @var {Service}
     */
    @service hostRouter;

    /**
     * Inject the `notifications` service
     *
     * @var {Service}
     */
    @service notifications;

    /**
     * Inject the `loader` service
     *
     * @var {Service}
     */
    @service loader;

    /**
     * The vehicle being created.
     *
     * @var {VehicleModel}
     */
    @tracked vehicle = this.store.createRecord('vehicle', {
        status: `active`,
        slug: generateSlug(),
    });

    /**
     * Different service types available, based on order type.
     *
     * @var {Array}
     */
    @tracked serviceTypes = [];

    /**
     * Service areas.
     *
     * @var {Array}
     */
    @tracked serviceAreas = [];

    /**
     * Zones.
     *
     * @var {Array}
     */
    @tracked zones = [];

    /**
     * True if creating vehicle.
     *
     * @var {Boolean}
     */
    @tracked isCreatingVehicle = false;

    /**
     * Saves the vehicle to server
     *
     * @void
     */
    @action createVehicle() {
        const { vehicle } = this;

        this.isCreatingVehicle = true;
        this.loader.showLoader('.overlay-inner-content', 'Creating vehicle...');

        try {
            return vehicle
                .save()
                .then((vehicle) => {
                    return this.transitionToRoute('management.vehicles.index').then(() => {
                        this.notifications.success(`New Vehicle ${vehicle.name} Created`);
                        this.resetForm();
                        this.hostRouter.refresh();
                    });
                })
                .catch((error) => {
                    console.log(error);
                    this.notifications.serverError(error);
                })
                .finally(() => {
                    this.isCreatingVehicle = false;
                    this.loader.removeLoader();
                });
        } catch (error) {
            this.isCreatingVehicle = false;
            this.loader.removeLoader();
        }
    }

    /**
     * Resets the vehicle form
     *
     * @void
     */
    @action resetForm() {
        this.vehicle = this.store.createRecord('vehicle');
    }

    @action transitionBack() {
        return this.transitionToRoute('management.vehicles.index');
    }
}
