import Engine from '@ember/engine';
import loadInitializers from 'ember-load-initializers';
import Resolver from 'ember-resolver';
import config from './config/environment';
import services from '@fleetbase/ember-core/exports/services';

const { modulePrefix } = config;
const externalRoutes = ['console', 'extensions'];

export default class FleetOpsEngine extends Engine {
    modulePrefix = modulePrefix;
    Resolver = Resolver;
    dependencies = {
        services,
        externalRoutes,
    };
    setupExtension = function (app, engine, universe) {
        // register menu item in header
        universe.registerHeaderMenuItem('Fleet-Ops', 'console.fleet-ops', { icon: 'route', priority: 0 });

        // register the vehicle panel
        universe.createRegistry('component:vehicle-panel');

        // register the driver panel
        universe.createRegistry('component:driver-panel');
    };
}

loadInitializers(FleetOpsEngine, modulePrefix);
