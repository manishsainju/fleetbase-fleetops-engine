import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ManagementDriversIndexNewController extends Controller {
    @tracked view;
    queryParams = ['view'];

    @action updateView(view) {
        if (this.view === view) {
            return;
        }

        this.view = view;
    }

    @action transitionBack() {
        return this.transitionToRoute('management.drivers.index');
    }
}
