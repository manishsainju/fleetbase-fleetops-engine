import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';
import { get } from '@ember/object';
import { isArray } from '@ember/array';

export default class DriverSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
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

    serializeBelongsTo(snapshot, json, relationship) {
        let key = relationship.key;

        if (key === 'vehicle' && isArray(json[key])) {
            json[key] = get(json[key], 'uuid');
        }

        super.serializeBelongsTo(...arguments);
    }

    serializeHasMany(snapshot, json, relationship) {
        let key = relationship.key;

        if (key === 'jobs' || key === 'orders') {
            return;
        }

        super.serializeHasMany(...arguments);
    }
}
