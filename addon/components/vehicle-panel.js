import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class VehiclePanelComponent extends Component {
    @service fetch;

    @service modalsManager;

    @service store;

    @tracked currentTab;
    @tracked devices = [];
    @tracked deviceApi = {};

    @tracked vehicle;

    constructor() {
        super(...arguments);
        this.vehicle = this.args.vehicle;
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
                        .finally(() => { });
                });
            })
            .finally(() => { });
    }

    @action changeTab(tab) {
        this.currentTab = tab;

        if (typeof this.args.onTabChanged === 'function') {
            this.args.onTabChanged(tab);
        }
    }

    @action createDevice() {
        const device = this.store.createRecord('vehicle-device');

        // const device = this.store.createRecord('vehicle-device', {
        //     vehicle_uuid: this.model.id,
        // });
        this.modalsManager.show('modals/vehicle-devices-form', {
            title: 'Add Device',
            acceptButtonText: 'Save Changes',
            acceptButtonIcon: 'save',
            modalClass: 'modal-lg',
            device,
            onSelectDeviceFromApi: (deviceApi) => {
                this.deviceApi = deviceApi;
            },
            confirm: (modal, done) => {
                modal.startLoading();

                device.device_id = this.deviceApi.id;
                device.device_provider = "flespi";
                device.device_type = this.deviceApi.device_type_id;
                device.vehicle_uuid = this.vehicle.uuid;
                device.device_name = this.deviceApi.name;
                return device.save();
            }
        });
    }
}
