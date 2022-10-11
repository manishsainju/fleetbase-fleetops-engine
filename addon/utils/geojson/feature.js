import GeoJson from './geo-json';
import extend from '../extend';

export default class Feature extends GeoJson {
  constructor(input) {
    super();

    if (input && input.type === 'Feature') {
      extend(this, input);
    } else if (input && input.type && input.coordinates) {
      this.geometry = input;
    } else {
      throw 'GeoJSON: invalid input for new Feature';
    }

    this.type = 'Feature';
  }
}
