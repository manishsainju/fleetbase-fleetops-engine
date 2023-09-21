import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class ManagementDriversIndexNewRoute extends Route {
    @service store;

    queryParams = {
        view: {
            refreshModel: false,
        },
    };
}
