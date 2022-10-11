import Model, { attr } from '@ember-data/model';
import { computed } from '@ember/object';
import { format, formatDistanceToNow } from 'date-fns';

export default class IntegratedVendorModel extends Model {
  /** @ids */
  @attr('string') public_id;
  @attr('string') company_uuid;
  @attr('string') created_by_uuid;

  /** @attributes */
  @attr('string') host;
  @attr('string') namespace;
  @attr('string') webhook_url;
  @attr('string') provider;
  @attr('string') name;
  @attr('string') photo_url;
  @attr('string') status;
  @attr('string') type;
  @attr('string') address;
  @attr('string') internal_id;
  @attr('string') email;
  @attr('string') phone;
  @attr('boolean') sandbox;
  @attr('boolean', { defaultValue: true }) isIntegratedVendor;
  @attr('raw') credentials;
  @attr('raw') provider_settings;
  @attr('raw') service_types;
  @attr('raw') supported_countries;

  /** @dates */
  @attr('date') deleted_at;
  @attr('date') created_at;
  @attr('date') updated_at;

  /** @computed */
  @computed('updated_at') get updatedAgo() {
    return formatDistanceToNow(this.updated_at);
  }

  @computed('updated_at') get updatedAt() {
    return format(this.updated_at, 'PPP');
  }

  @computed('created_at') get createdAgo() {
    return formatDistanceToNow(this.created_at);
  }

  @computed('created_at') get createdAt() {
    if (!this.created_at) {
      return null;
    }

    return format(this.created_at, 'PPP p');
  }
}
