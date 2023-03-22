import Model, { attr, belongsTo } from '@ember-data/model';
import { get, computed } from '@ember/object';
import { format, formatDistanceToNow } from 'date-fns';
import { getOwner } from '@ember/application';
import isRelationMissing from '@fleetbase/ember-core/utils/is-relation-missing';
import config from '../config/environment';

export default class VehicleModel extends Model {
    /** @ids */
    @attr('string') uuid;
    @attr('string') public_id;
    @attr('string') company_uuid;
    @attr('string') photo_uuid;
    @attr('string') driver_uuid;

    /** @relationships */
    @belongsTo('driver', { async: false }) driver;
    @belongsTo('vendor', { async: false }) vendor;

    /** @attributes */
    @attr('string', {
        defaultValue: get(config, 'defaultValues.vehicleImage'),
    })
    photo_url;
    @attr('string') driver_name;
    @attr('string') driver_id;
    @attr('string') driver_uuid;
    @attr('string') vendor_name;
    @attr('string') vendor_id;
    @attr('string') display_name;
    @attr('string', {
        defaultValue: get(config, 'defaultValues.vehicleAvatar'),
    })
    avatar_url;
    @attr('string') make;
    @attr('string') model;
    @attr('string') year;
    @attr('string') trim;
    @attr('string') type;
    @attr('string') plate_number;
    @attr('string') vin;
    @attr('string') vin_data;
    @attr('string') model_0_to_100_kph;
    @attr('string') model_body;
    @attr('string') model_co2;
    @attr('string') model_doors;
    @attr('string') model_drive;
    @attr('string') model_engine_bore_mm;
    @attr('string') model_engine_cc;
    @attr('string') model_engine_compression;
    @attr('string') model_engine_cyl;
    @attr('string') model_engine_fuel;
    @attr('string') model_engine_position;
    @attr('string') model_engine_power_ps;
    @attr('string') model_engine_power_rpm;
    @attr('string') model_engine_stroke_mm;
    @attr('string') model_engine_torque_nm;
    @attr('string') model_engine_torque_rpm;
    @attr('string') model_engine_valves_per_cyl;
    @attr('string') model_fuel_cap_l;
    @attr('string') model_length_mm;
    @attr('string') model_lkm_city;
    @attr('string') model_lkm_hwy;
    @attr('string') model_lkm_mixed;
    @attr('string') model_make_display;
    @attr('string') model_seats;
    @attr('string') model_sold_in_us;
    @attr('string') model_top_speed_kph;
    @attr('string') model_transmission_type;
    @attr('string') model_weight_kg;
    @attr('string') model_wheelbase_mm;
    @attr('string') model_width_mm;
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

    /** @methods */
    loadDriver() {
        const owner = getOwner(this);
        const store = owner.lookup(`service:store`);

        return new Promise((resolve) => {
            if (isRelationMissing(this, 'driver')) {
                return store
                    .findRecord('driver', this.driver_uuid)
                    .then((driver) => {
                        this.driver = driver;

                        resolve(driver);
                    })
                    .catch(() => {
                        resolve(null);
                    });
            }

            resolve(this.driver);
        });
    }
}
