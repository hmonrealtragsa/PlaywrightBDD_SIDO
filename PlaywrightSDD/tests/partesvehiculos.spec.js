const { registerFeatureTests } = require('./feature-runner');
const VehiclePage = require('../src/pageobjects/VehiclePage');
const { createVehicleSteps } = require('../src/steps/vehicleSteps');

registerFeatureTests('partesvehiculos.spec.json', createVehicleSteps(), VehiclePage);
