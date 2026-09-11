const { registerFeatureTests } = require('./feature-runner');
const LoginPage = require('../src/pageobjects/LoginPage');
const { createAuthSteps } = require('../src/steps/authSteps');

registerFeatureTests('login.spec.json', createAuthSteps(), LoginPage);
