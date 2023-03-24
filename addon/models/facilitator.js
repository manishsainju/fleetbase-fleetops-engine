import Model, { attr } from '@ember-data/model';
import { computed } from '@ember/object';
import { equal } from '@ember/object/computed';
import { format, formatDistanceToNow } from 'date-fns';

export default class FacilitatorModel extends Model {
    /** @ids */
    @attr('string') public_id;

    /** @attributes */
    @attr('string') name;
    @attr('string') facilitator_type;
    @attr('string') provider;
    @attr('raw') provider_settings;
    @attr('raw') service_types;
    @attr('raw') supported_countries;

    /** @computed */
    @equal('facilitator_type', 'vendor') isVendor;
    @equal('facilitator_type', 'integrated-vendor') isIntegratedVendor;
    @equal('facilitator_type', 'contact') isContact;

    @computed('updated_at') get updatedAgo() {
        return formatDistanceToNow(this.updated_at);
    }

    @computed('updated_at') get updatedAt() {
        return format(this.updated_at, 'PPP p');
    }

    @computed('updated_at') get updatedAtShort() {
        return format(this.updated_at, 'PP');
    }

    @computed('created_at') get createdAgo() {
        return formatDistanceToNow(this.created_at);
    }

    @computed('created_at') get createdAt() {
        return format(this.created_at, 'PPP p');
    }

    @computed('created_at') get createdAtShort() {
        return format(this.created_at, 'PP');
    }
}
