import Model, { attr, hasMany } from '@ember-data/model';
import { computed } from '@ember/object';
import { format, formatDistanceToNow } from 'date-fns';
import extractCoordinates from '@fleetbase/ember-core/utils/extract-coordinates';

export default class ServiceAreaModel extends Model {
    /** @ids */
    @attr('string') company_uuid;
    @attr('string') parent_uuid;

    /** @relationships */
    @hasMany('zone', { async: false }) zones;

    /** @attributes */
    @attr('string') name;
    @attr('string') type;
    @attr('string') country;
    @attr('string') color;
    @attr('string') stroke_color;
    @attr('string') status;
    @attr('multi-polygon') border;

    /** @dates */
    @attr('date') deleted_at;
    @attr('date') created_at;
    @attr('date') updated_at;

    /** @computed */
    @computed('boundaries') get bounds() {
        const firstBoundary = this.boundaries[0];
        const coordinates = firstBoundary?.coordinates ?? [];
        const bounds = coordinates[0] ?? [];

        return bounds.map((coord) => extractCoordinates(coord));
    }

    @computed('border.coordinates.[]') get boundaries() {
        return this.border?.coordinates ?? [];
    }

    @computed('bounds') get firstCoordinatePair() {
        return this.bounds[0] ?? [0, 0];
    }

    @computed('bounds') get centerCoordinates() {
        const x = this.bounds.map((xy) => xy[0]);
        const y = this.bounds.map((xy) => xy[1]);
        const cx = (Math.min(...x) + Math.max(...x)) / 2;
        const cy = (Math.min(...y) + Math.max(...y)) / 2;

        return [cx, cy];
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
