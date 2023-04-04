import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class ManagementDriversIndexRoute extends Route {
    @service store;
    @service fetch;

    queryParams = {
        page: { refreshModel: true },
        limit: { refreshModel: true },
        sort: { refreshModel: true },
        query: { refreshModel: true },
        status: { refreshModel: true },
        country: { refreshModel: true },
        fleet: { refreshModel: true },
        vendor: { refreshModel: true },
        vehicle: { refreshModel: true },
        'within[latitude]': { refreshModel: true, replace: true },
        'within[longitude]': { refreshModel: true, replace: true },
        'within[radius]': { refreshModel: true, replace: true },
        'within[where]': { refreshModel: true, replace: true },
    };

    model(params) {
        return this.store.query('driver', { ...params });
    }

    async setupController(controller, model) {
        super.setupController(controller, model);

        // using this hook to load additional data
        const statusOptions = await this.fetch.get('drivers/statuses');
        controller.setFilterOptions('status', statusOptions);
    }
}
