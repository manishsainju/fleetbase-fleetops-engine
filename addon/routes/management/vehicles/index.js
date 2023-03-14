import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class ManagementVehiclesIndexRoute extends Route {
  @service store;
  @service fetch;

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
    return this.store.query('vehicle', { ...params });
  }

  async setupController(controller, model) {
    super.setupController(controller, model);

    // using this hook to load additional data
    const statusOptions = await this.fetch.get('vehicles/statuses');
    controller.setFilterOptions('status', statusOptions);
  }
}
