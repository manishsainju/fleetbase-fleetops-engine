import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { guidFor } from '@ember/object/internals';

export default class FespiDeviceSelectComponent extends Component {
    @service fetch;
    @tracked devices = [];
    @tracked selected;
    @tracked isLoading = true;
    @tracked value;
    @tracked id = guidFor(this);

    constructor() {
        super(...arguments);

        this.fetch
            .get(
                'devices',
                {},
                {
                    namespace: 'flespi/int/v1',
                }
            )
            .then((data) => {
                this.devices = data.result;

                if (this.args.value) {
                    this.selected = this.findDevice(this.args.value);
                }
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    @action changed(value) {
        const device = this.findDevice(value);

        if (device) {
            this.selectDevice(device);
        }
    }

    @action listenForInputChanges(element) {
        setInterval(() => {
            const { value } = element;

            if (this.value !== value) {
                this.value = value;
                this.changed(value);
            }
        }, 100);
    }

    @action selectDevice(device) {
        const { onChange } = this.args;
        this.selected = device;

        if (typeof onChange === 'function') {
            onChange(device.id, device);
        }
    }

    findDevice(iso2) {
        return this.devices.find((device) => device.id === iso2.toUpperCase());
    }
}
