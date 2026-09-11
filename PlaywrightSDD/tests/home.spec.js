const { registerFeatureTests } = require('./feature-runner');
const HomePage = require('../src/pageobjects/HomePage');
const { createHomeSteps } = require('../src/steps/homeSteps');

registerFeatureTests('home.spec.json', createHomeSteps(), HomePage);
