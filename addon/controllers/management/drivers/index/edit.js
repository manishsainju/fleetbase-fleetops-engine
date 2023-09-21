import Controller, { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import ManagementDriversIndexNewController from './new';

export default class ManagementDriversIndexEditController extends Controller {
    // @tracked view;
    // queryParams = ['view'];

    // @action updateView(view) {
    //     if (this.view === view) {
    //         return;
    //     }

    //     this.view = view;
    // }

    /**
     * True if updating service rate.
     *
     * @var {Boolean}
     */
    @tracked isUpdatingDriver = false;
    /**
     * Updates the drivers to server
     *
     * @void
     */
    @action updateDriver(driver) {
        // const { driver } = this.model;
        // console.log(driver.name);

        this.isUpdatingDriver = true;
        this.loader.showLoader('.overlay-inner-content', 'Updating driver...');

        try {
            return driver
                .save()
                .then((driver) => {
                    return this.transitionToRoute('management.drivers.index').then(() => {
                        this.notifications.success(`Driver '${driver.name}' updated`);
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
        return this.transitionToRoute('management.drivers.index');
    }
}
