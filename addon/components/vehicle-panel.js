import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { getOwner } from '@ember/application';
import { action, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { isArray } from '@ember/array';
import { dasherize } from '@ember/string';
import VehiclePanelDetailComponent from './vehicle-panel/details';
import VehiclePanelTrackingComponent from './vehicle-panel/tracking';

export default class VehiclePanelComponent extends Component {
    @service fetch;
    @service modalsManager;
    @service universe;
    @service store;
    @tracked currentTab;
    @tracked devices = [];
    @tracked deviceApi = {};
    @tracked vehicle;

    get tabs() {
        const registeredTabs = this.universe.getMenuItemsFromRegistry('vehiclePanel');
        const defaultTabs = [
            this.universe._createMenuItem('Details', null, { icon: 'circle-info', component: VehiclePanelDetailComponent }),
            this.universe._createMenuItem('Tracking', null, { icon: 'satellite-dish', component: VehiclePanelTrackingComponent }),
        ];

        if (isArray(registeredTabs)) {
            return [...defaultTabs, ...registeredTabs];
        }

        return defaultTabs;
    }

    @computed('currentTab') get tab() {
        if (this.currentTab) {
            return this.tabs.find(({ slug }) => slug === this.currentTab);
        }
    }

    constructor() {
        super(...arguments);
        this.vehicle = this.args.vehicle;
        this.changeTab(this.args.tab || 'details');
    }

    @action async changeTab(tab) {
        this.currentTab = tab;

        if (typeof this.args.onTabChanged === 'function') {
            this.args.onTabChanged(tab);
        }
    }
}
