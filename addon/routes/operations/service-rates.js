import Route from '@ember/routing/route';

export default class OperationsServiceRatesRoute extends Route {
  model() {
    return this.store.findAll('service-rate');
  }
}
