import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class ApplicationRoute extends Route {
  @service loader;

  @action loading(transition) {
    const resourceName = this.getResouceName(transition);
    this.loader.showOnInitialTransition(
      transition,
      'section.next-view-section',
      resourceName ? `Loading ${resourceName}...` : `Loading...`
    );
  }

  getResouceName(transition) {
    const { to } = transition;

    if (typeof to.name === 'string') {
      let routePathSegments = to.name.split('.');
      let resourceName = routePathSegments[3];

      return resourceName;
    }

    return null;
  }
}
