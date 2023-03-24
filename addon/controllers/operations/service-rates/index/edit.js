import OperationsServiceRatesIndexNewController from './new';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
// import { alias } from '@ember/object/computed';

export default class OperationsServiceRatesIndexEditController extends OperationsServiceRatesIndexNewController {
    /**
     * True if updating service rate.
     *
     * @var {Boolean}
     */
    @tracked isUpdatingServiceRate = false;

    // @alias('@model.rate_fees') rateFees;
    // @alias('@model.parcel_fees') parcelFees;

    /**
     * Updates the service rate to server
     *
     * @void
     */
    @action updateServiceRate() {
        const loader = this.loader.showLoader('.overlay-inner-content', 'Updating service rate...');
        const { serviceRate, rateFees, perDropRateFees, parcelFees } = this;

        if (serviceRate.isFixedMeter) {
            serviceRate.setServiceRateFees(rateFees);
        }

        if (serviceRate.isPerDrop) {
            serviceRate.setServiceRateFees(perDropRateFees);
        }

        if (serviceRate.isParcelService) {
            serviceRate.setServiceRateParcelFees(parcelFees);
        }

        this.isUpdatingServiceRate = true;

        try {
            return serviceRate
                .save()
                .then((serviceRate) => {
                    return this.transitionToRoute('operations.service-rates.index').then(() => {
                        this.notifications.success(`Service rate '${serviceRate.service_name}' updated`);
                        this.resetForm();
                    });
                })
                .catch(this.notifications.serverError)
                .finally(() => {
                    this.isUpdatingServiceRate = false;
                    this.loader.removeLoader(loader);
                });
        } catch (error) {
            this.isUpdatingServiceRate = false;
            this.loader.removeLoader(loader);
        }
    }
}
