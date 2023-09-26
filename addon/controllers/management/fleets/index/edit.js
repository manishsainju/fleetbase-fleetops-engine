import Controller, { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ManagementFleetsIndexEditController extends Controller {
  /**
   * True if updating service rate.
   *
   * @var {Boolean}
   */
  @tracked isUpdatingDriver = false;
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
   * Updates the fleets to server
   *
   * @void
   */
  @action updateFleet() {
    const { fleet } = this;

    this.isUpdatingDriver = true;
    this.loader.showLoader('.overlay-inner-content', 'Updating fleet...');

    try {
      return fleet
        .save()
        .then((fleet) => {
          return this.transitionToRoute('management.fleets.index').then(() => {
            this.notifications.success(`Fleet '${fleet.name}' updated`);
            this.resetForm();
            this.hostRouter.refresh();
          });
        })
        .catch(this.notifications.serverError)
        .finally(() => {
          this.isUpdatingDriver = false;
          this.loader.removeLoader();
        });
    } catch (error) {
      this.isUpdatingDriver = false;
      this.loader.removeLoader();
    }
  }

  @action transitionBack() {
    return this.transitionToRoute('management.fleets.index');
  }
  /**
   * Resets the fleet form
   *
   * @void
   */
  @action resetForm() {
    this.fleet = this.store.createRecord('fleet');
  }
}
