import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class ManagementVehiclesIndexRoute extends Route {
    @service store;

    model(params) {
        return this.store.query('vehicle', { ...params });
    }
}
