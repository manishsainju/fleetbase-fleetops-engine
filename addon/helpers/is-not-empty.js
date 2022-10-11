import { helper } from '@ember/component/helper';
import { isEmpty } from '@ember/utils';

export default helper(function isNotEmpty([mixed]) {
  return !isEmpty(mixed);
});
