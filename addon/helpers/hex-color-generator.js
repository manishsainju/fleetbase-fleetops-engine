import { helper } from '@ember/component/helper';

export default helper(function hexColorGenerator() {
  return `#${Math.random().toString(16).slice(2, 8)}`;
});
