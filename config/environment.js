/* eslint-env node */
'use strict';
const { name } = require('../package');

module.exports = function (environment) {
    let ENV = {
        modulePrefix: name,
        environment,

        defaultValues: {
            driverImage: 'https://s3.ap-southeast-1.amazonaws.com/flb-assets/static/no-avatar.png',
        },
    };

    return ENV;
};
