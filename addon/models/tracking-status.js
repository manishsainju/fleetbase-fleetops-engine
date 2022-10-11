import Model, { attr } from '@ember-data/model';
import { computed } from '@ember/object';
import { format, formatDistanceToNow } from 'date-fns';

export default class TrackingStatusModel extends Model {
  /** @ids */
  @attr('string') tracking_number_uuid;

  /** @attributes */
  @attr('string') status;
  @attr('string') details;
  @attr('string') code;
  @attr('string') city;
  @attr('string') province;
  @attr('string') postal_code;
  @attr('string') country;
  @attr('point') location;

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
