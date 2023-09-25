import Controller from '@ember/controller';
import { action } from '@ember/object';

export default class ManagementVehiclesIndexDetailsController extends Controller {

    @action transitionBack() {
        return this.transitionToRoute('management.vehicles.index');
    }
}
