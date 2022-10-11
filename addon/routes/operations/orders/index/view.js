import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class OperationsOrdersIndexViewRoute extends Route {
  @service currentUser;

  @action willTransition() {
    this.controller?.resetView();
  }

  model(order) {
    const { public_id } = order;

    return this.store.queryRecord('order', {
      public_id,
      single: true,
      with: [
        'payload',
        'driverAssigned',
        'customer',
        'facilitator',
        'trackingStatuses',
        'trackingNumber',
      ],
    });
  }

  async setupController(controller, model) {
    super.setupController(controller, model);

    controller.isLoadingAdditionalData = true;

    await model.loadPayload();
    await model.loadDriver();
    await model.loadTrackingNumber();
    await model.loadCustomer();
    await model.loadTrackingActivity();
    await model.loadOrderConfig();

    controller.isLoadingAdditionalData = false;
  }
}
