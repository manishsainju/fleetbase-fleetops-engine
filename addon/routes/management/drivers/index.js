import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class ManagementDriversIndexRoute extends Route {
  @service store;
  @service loader;

  /**
   * Loading event handler for route.
   *
   * @param {Transition} transition
   */
  @action
  loading(transition) {
    this.loader.showOnInitialTransition(
      transition,
      '#mainContent',
      'Loading drivers...'
    );
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
    country: { refreshModel: true },
    fleet: { refreshModel: true },
    vendor: { refreshModel: true },
    vehicle: { refreshModel: true },
    'within[latitude]': { refreshModel: true, replace: true },
    'within[longitude]': { refreshModel: true, replace: true },
    'within[radius]': { refreshModel: true, replace: true },
    'within[where]': { refreshModel: true, replace: true },
  };

  /**
   * Inject the fetch service
   *
   * @var {Service}
   */
  @service fetch;

  model(params) {
    return this.store.query('driver', { ...params });
  }

  async setupController(controller, model) {
    super.setupController(controller, model);

    // if the table is initialized set model using `setRows` method
    if (controller.table) {
      controller.table.setRows(model);
    }

    // using this hook to load additional data
    const statusOptions = await this.fetch.get('drivers/statuses');
    controller.setFilterOptions('status', statusOptions);
  }
}
