import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class ManagementContactsIndexRoute extends Route {
    @service store;
    @service loader;

    /**
     * Loading event handler for route.
     *
     * @param {Transition} transition
     */
    @action
    loading(transition) {
        this.loader.showOnInitialTransition(transition, '#mainContent', 'Loading contacts...');
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

    model(params) {
        return this.store.query('contact', { ...params });
    }

    async setupController(controller, model) {
        super.setupController(controller, model);
    }
}
