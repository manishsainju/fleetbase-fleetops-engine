import Service from '@ember/service';
import Evented from '@ember/object/evented';

export default class EngineContextService extends Service.extend(Evented) {
    options = {};

    setOption(key, value) {
        this.options = {
            ...this.options,
            [key]: value,
        };
    }

    getOption(key) {
        return this.options[key];
    }
}
