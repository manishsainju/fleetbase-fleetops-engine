import { helper } from '@ember/component/helper';
/* global L */

/**
 * Represents a Leaflet FeatureGroup
 * More information about its possible options [here](https://leafletjs.com/SlavaUkraini/reference.html#featuregroup).
 *
 * @function featureGroup
 * @param {Array} layers the layers to add
 * @return {FeatureGroup}
 */
export default helper(function featureGroup(params) {
  return L.featureGroup(params);
});
