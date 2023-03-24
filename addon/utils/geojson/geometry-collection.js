import GeoJson from './geo-json';
import extend from '../extend';
import { isArray } from '@ember/array';

export default class GeometryCollection extends GeoJson {
    constructor(input) {
        if (input && input.type === 'GeometryCollection' && input.geometries) {
            extend(this, input);
        } else if (isArray(input)) {
            this.geometries = input;
        } else if (input.coordinates && input.type) {
            this.type = 'GeometryCollection';
            this.geometries = [input];
        } else {
            throw 'GeoJSON: invalid input for new GeometryCollection';
        }

        this.type = 'GeometryCollection';
    }

    forEach(func) {
        for (var i = 0; i < this.geometries.length; i++) {
            func.apply(this, [this.geometries[i], i, this.geometries]);
        }
    }

    get(i) {
        return new Primitive(this.geometries[i]);
    }
}
