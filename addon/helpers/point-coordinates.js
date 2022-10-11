import { helper } from '@ember/component/helper';
import Terraformer from 'terraformer';

export default helper(function pointCoordinates([point]) {
  if (point instanceof Terraformer.Point) {
    return `${point.coordinates[1]} ${point.coordinates[0]}`;
  }

  return 'Invalid coordinates';
});
