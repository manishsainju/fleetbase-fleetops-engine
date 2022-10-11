import Model, { attr, belongsTo } from '@ember-data/model';
import { computed } from '@ember/object';
import { notEmpty } from '@ember/object/computed';
import { format, formatDistanceToNow } from 'date-fns';

export default class VendorModel extends Model {
  /** @ids */
  @attr('string') public_id;
  @attr('string') company_uuid;
  @attr('string') type_uuid;
  @attr('string') place_uuid;
  @attr('string') connect_company_uuid;
  @attr('string') logo_uuid;
  @attr('string') internal_id;
  @attr('string') business_id;

  /** @relationships */
  @belongsTo('place') place;

  /** @attributes */
  @attr('string') name;
  @attr('string') email;
  @attr('string') website_url;
  @attr('string') photo_url;
  @attr('string') phone;
  @attr('string') address;
  @attr('string') address_street;
  @attr('string') country;
  @attr('string') status;
  @attr('string') slug;
  @attr('string') type;
  @attr('string') customer_type;
  @attr('string') facilitator_type;
  @attr('raw') meta;
  @attr('raw') callbacks;

  /** @dates */
  @attr('date') deleted_at;
  @attr('date') created_at;
  @attr('date') updated_at;

  /** @computed */
  @notEmpty('place_uuid') has_place;

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
