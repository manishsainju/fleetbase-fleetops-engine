import Route from '@ember/routing/route';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class OperationsOrdersIndexRoute extends Route {
  @service fetch;
  @service store;

  @tracked queryParams = {
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
    status: {
      refreshModel: true,
    },
    public_id: {
      refreshModel: true,
    },
    internal_id: {
      refreshModel: true,
    },
    payload: {
      refreshModel: true,
    },
    tracking: {
      refreshModel: true,
    },
    facilitator: {
      refreshModel: true,
    },
    driver: {
      refreshModel: true,
    },
    customer: {
      refreshModel: true,
    },
    pickup: {
      refreshModel: true,
    },
    dropoff: {
      refreshModel: true,
    },
    after: {
      refreshModel: true,
    },
    before: {
      refreshModel: true,
    },
  };

  @tracked _params = {};

  @action willTransition(transition) {
    this.controller?.resetView(transition);
  }

  model(params) {
    return this.store.query('order', params);
  }

  async setupController(controller, model) {
    super.setupController(controller, model);

    // if the table is initialized set model using `setRows` method
    if (controller.table) {
      controller.table.setRows(model);
    }

    // load all order status options
    const statuses = await this.fetch.cachedGet('orders/statuses');
    controller.setFilterOptions('status', statuses);
  }
}
