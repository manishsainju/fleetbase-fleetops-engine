import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';

export default class DriverSerializer extends ApplicationSerializer.extend(
  EmbeddedRecordsMixin
) {
  /**
   * Embedded relationship attributes
   *
   * @var {Object}
   */
  get attrs() {
    return {
      user: { embedded: 'always' },
      vendor: { embedded: 'always' },
      vehicle: { embedded: 'always' },
      devices: { serialize: 'records' },
      current_job: { embedded: 'always' },
      jobs: { embedded: 'always' },
    };
  }

  serializeHasMany(snapshot, json, relationship) {
    let key = relationship.key;

    if (key === 'jobs' || key === 'orders') {
      return;
    } else {
      super.serializeHasMany(...arguments);
    }
  }
}
