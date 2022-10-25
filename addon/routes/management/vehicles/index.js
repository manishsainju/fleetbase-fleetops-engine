import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class ManagementVehiclesIndexRoute extends Route {
    /**
     * Inject the `loader` service.
     *
     * @var {Service}
     */
    @service store;
    @service loader;

    /**
     * Loading event handler for route.
     *
     * @param {Transition} transition
     */
    @action
    loading(transition) {
        this.loader.showOnInitialTransition(transition, '#mainContent', 'Loading vehicles...');
    }

    /**
     * Queryable parameters
     *
     * @var {Object}
     */
    queryParams = {
        page: { refreshModel: true },
        limit: { refreshModel: true },
        sort: { refreshModel: true },
        query: { refreshModel: true },
        status: { refreshModel: true },
    };

    /**
     * Inject the fetch service
     *
     * @var {Service}
     */
    @service fetch;

    model(params) {
        return this.store.query('vehicle', { ...params });
    }

    async setupController(controller, model) {
        super.setupController(controller, model);

        // using this hook to load additional data
        const statusOptions = await this.fetch.get('vehicles/statuses');
        controller.setFilterOptions('status', statusOptions);
    }
}
