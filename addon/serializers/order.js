import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';

export default class OrderSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
    /**
     * Embedded relationship attributes
     *
     * @var {Object}
     */
    get attrs() {
        return {
            payload: { embedded: 'always' },
            driver_assigned: { embedded: 'always' },
            facilitator: { embedded: 'always' },
            customer: { serialize: 'record' },
            transaction: { embedded: 'always' },
            route: { embedded: 'always' },
            tracking_number: { embedded: 'always' },
            tracking_statuses: { embedded: 'always' },
        };
    }

    /**
     * Attributes we want to remove when sending to server.
     *
     * @param {Snapshot} snapshot
     * @param {Object} json
     * @param {String} key
     * @param {Array} attributes
     */
    serializeAttribute(snapshot, json, key, attributes) {
        super.serializeAttribute(snapshot, json, key, attributes);

        const unshiftAttributes = [
            'driver_name',
            'tracking',
            'total_entities',
            'transaction_amount',
            'customer_name',
            'facilitator_name',
            'customer_is_vendor',
            'customer_is_contact',
            'pickup_name',
            'dropoff_name',
            'payload_id',
            'driver_id',
            'created_by_name',
            'updated_by_name',
            'purchase_rate_id',
        ];

        if (unshiftAttributes.includes(key)) {
            delete json[key];
        }
    }
}
