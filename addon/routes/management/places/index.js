import Route from '@ember/routing/route';

export default class ManagementPlacesIndexRoute extends Route {
  queryParams = {
    page: {
      refreshModel: true,
    },
    limit: {
      refreshModel: true,
    },
    sort: {
      refreshModel: true,
    },
    query: {
      refreshModel: true,
    },
    country: {
      refreshModel: true,
    },
  };

  model(params) {
    return this.store.query('place', { ...params });
  }

  async setupController(controller, model) {
    super.setupController(controller, model);

    // if the table is initialized set model using `setRows` method
    if (controller.table) {
      controller.table.setRows(model);
    }
  }
}
