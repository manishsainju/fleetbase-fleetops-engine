import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class OperationsServiceRatesIndexRoute extends Route {
    /**
     * Inject the `store` service.
     *
     * @var {Store}
     */
    @service store;

    /**
     * Inject the `loader` service.
     *
     * @var {Service}
     */
    @service loader;

    /**
     * Loading event handler for route.
     *
     * @param {Transition} transition
     */
    @action loading(transition) {
        this.loader.showOnInitialTransition(transition, '#mainContent', 'Loading service rates...');
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
    };

    model(params) {
        return this.store.query('service-rate', {
            ...params,
            with: ['parcelFees', 'rateFees'],
        });
    }

    async setupController(controller, model) {
        super.setupController(controller, model);
    }
}
