import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
export default class ManagementVehiclesIndexEditRoute extends Route {
    @service store;
    model({ public_id }) {
        return this.store.findRecord('vehicle', public_id);
    }

    async setupController(controller, model) {
        controller.vehicle = model;
    }
}
