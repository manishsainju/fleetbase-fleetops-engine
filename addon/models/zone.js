import Model, { attr, belongsTo } from '@ember-data/model';
import { computed } from '@ember/object';
import { format, formatDistanceToNow } from 'date-fns';
import autoSerialize from '@fleetbase/ember-core/utils/auto-serialize';

export default class ZoneModel extends Model {
    /** @ids */
    @attr('string') public_if;
    @attr('string') service_area_uuid;

    /** @relationships */
    @belongsTo('service-area') service_area;

    /** @attributes */
    @attr('string') name;
    @attr('string') description;
    @attr('string') color;
    @attr('string') stroke_color;
    @attr('string') status;
    @attr('polygon') border;

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

    @computed('border.coordinates', 'isNew') get locations() {
        if (this.isNew) {
            return this.border?.coordinates ?? [];
        }

        const coordinates = this.border?.coordinates[0]?.coordinates ?? [];

        return coordinates.map((coord) => coord.reverse());
    }

    @computed('locations') get firstCoordinatePair() {
        return this.locations[0] ?? [0, 0];
    }

    @computed('locations') get centerCoordinates() {
        const x = this.locations.map((xy) => xy[0]);
        const y = this.locations.map((xy) => xy[1]);
        const cx = (Math.min(...x) + Math.max(...x)) / 2;
        const cy = (Math.min(...y) + Math.max(...y)) / 2;

        return [cx, cy];
    }
}
