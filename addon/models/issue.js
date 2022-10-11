import Model, { attr, belongsTo } from '@ember-data/model';
import { computed } from '@ember/object';
import { format, formatDistanceToNow } from 'date-fns';

export default class IssueModel extends Model {
  /** @ids */
  @attr('string') public_id;
  @attr('string') issue_id;
  @attr('string') company_uuid;
  @attr('string') reported_by_uuid;
  @attr('string') assigned_to_uuid;
  @attr('string') vehicle_uuid;

  /** @relationships */
  @belongsTo('user') reporter;
  @belongsTo('user') assignee;
  @belongsTo('vehicle') vehicle;

  /** @attributes */
  @attr('string') odometer;
  @attr('string') latitude;
  @attr('string') longitude;
  @attr('string') type;
  @attr('string') report;
  @attr('string') priority;
  @attr('string') status;

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
