import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import { computed } from '@ember/object';
import { format, formatDistanceToNow } from 'date-fns';

export default class FleetModel extends Model {
  /** @ids */
  @attr('string') public_id;
  @attr('string') company_uuid;
  @attr('string') image_uuid;
  @attr('string') service_area_uuid;
  @attr('string') zone_uuid;

  /** @relationships */
  @belongsTo('service-area') service_area;
  @belongsTo('zone') zone;
  @hasMany('driver') drivers;

  /** @attributes */
  @attr('number') drivers_count;
  @attr('number') drivers_online_count;
  @attr('string') photo_url;
  @attr('string') name;
  @attr('string') color;
  @attr('string') task;
  @attr('string') status;
  @attr('string') slug;

  /** @dates */
  @attr('date') deleted_at;
  @attr('date') created_at;
  @attr('date') updated_at;

  /** @computed */
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
