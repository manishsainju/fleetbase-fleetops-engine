import { helper } from '@ember/component/helper';
import { get } from '@ember/object';
import env from '../config/environment';

export default helper(function config([path]) {
    return get(env, path);
});
