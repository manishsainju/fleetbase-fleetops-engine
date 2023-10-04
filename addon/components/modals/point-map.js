import Component from '@glimmer/component';
import { action, set } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { later } from '@ember/runloop';

export default class PointMap extends Component {
    @tracked leafletMap;

    @action setMapReference(event) {
        if (!event || !event.target) {
            return;
        }

        const { target } = event;
        this.leafletMap = target;

        set(event, 'target.pointMap', this);

        if (typeof this.args.onLoad === 'function') {
            this.args.onLoad(...arguments);
        }

        later(
            this,
            () => {
                this.leafletMap.invalidateSize();
            },
            100
        );
    }
}