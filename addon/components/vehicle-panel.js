import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class VehiclePanelComponent extends Component {
    @tracked currentTab;
    @tracked devices = [];
    @service fetch;

    constructor() {
        super(...arguments);
        this.changeTab(this.args.tab || 'details');
        this.fetch
            .get(
                'devices',
                {},
                {
                    namespace: 'flespi/int/v1',
                }
            )
            .then((data) => {
                var self = this;
                data.result.forEach((device) => {
                    this.fetch
                        .get(
                            `devices/${device.id}/messages`,
                            {},
                            {
                                namespace: 'flespi/int/v1',
                            }
                        )
                        .then((data) => {
                            device.messages = [];
                            if (data.result.length) {
                                Object.keys(data.result[0]).forEach(function (key) {
                                    let label = key.split('.').join(' ');
                                    device.messages.push(label + ": " + data.result[0][key]);
                                });
                            }
                            self.devices.push(device);
                        })
                        .finally(() => {});
                });
            })
            .finally(() => {});
    }

    @action changeTab(tab) {
        this.currentTab = tab;

        if (typeof this.args.onTabChanged === 'function') {
            this.args.onTabChanged(tab);
        }
    }
}
