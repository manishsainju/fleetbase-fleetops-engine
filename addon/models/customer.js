import ContactModel from './contact';
import { attr } from '@ember-data/model';
import { computed } from '@ember/object';
import { equal } from '@ember/object/computed';
import { format, formatDistanceToNow } from 'date-fns';

export default class CustomerModel extends ContactModel {
    /** @attributes */
    @attr('string') name;
    @attr('string') customer_type;

    /** @computed */
    @equal('customer_type', 'vendor') isVendor;
    @equal('customer_type', 'contact') isContact;

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
