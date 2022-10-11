import Route from '@ember/routing/route';

export default class OperationsSchedulerIndexRoute extends Route {
  model() {
    return this.store.query('order', { status: 'created', with: ['payload'] });
  }
}
