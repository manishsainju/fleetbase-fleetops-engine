import { helper } from '@ember/component/helper';
import { isArray } from '@ember/array';

export default helper(function isObject([mixed]) {
  return (
    !isArray(mixed) &&
    typeof mixed === 'object' &&
    Object.keys(mixed).length > 0
  );
});
