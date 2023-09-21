import Controller, { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ManagementDriversIndexEditController extends Controller {
    // @tracked view;
    // queryParams = ['view'];

    // @action updateView(view) {
    //     if (this.view === view) {
    //         return;
    //     }

    //     this.view = view;
    // }

    @action transitionBack() {
        return this.transitionToRoute('management.drivers.index');
    }
}
