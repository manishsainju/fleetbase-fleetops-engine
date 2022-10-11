import Model, { attr, belongsTo } from '@ember-data/model';
import { computed } from '@ember/object';
import { format, formatDistanceToNow } from 'date-fns';

export default class ContactModel extends Model {
  /** @ids */
  @attr('string') public_id;
  @attr('string') company_uuid;
  @attr('string') photo_uuid;
  @attr('string') place_uuid;

  /** @relationships */
  @belongsTo('place') place;
  @belongsTo('file') photo;

  /** @attributes */
  @attr('string') name;
  @attr('string') title;
  @attr('string') email;
  @attr('string') phone;
  @attr('string') type;
  @attr('string') customer_type;
  @attr('string') facilitator_type;
  @attr('string', {
    defaultValue:
      'https://s3.ap-southeast-1.amazonaws.com/flb-assets/static/no-avatar.png',
  })
  photo_url;
  @attr('string') slug;

  /** @dates */
  @attr('date') deleted_at;
  @attr('date') created_at;
  @attr('date') updated_at;

  /** @computed */
  @computed('public_id') get customerId() {
    return this.public_id.replace('contact_', 'customer_');
  }

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
