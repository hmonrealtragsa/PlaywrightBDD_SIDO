const { SIDO2_USERNAME, SIDO2_PASSWORD } = require('../config/env');

async function doLogin(loginPage, username, password) {
  await loginPage.goto();
  await loginPage.assertLoginPageIsDisplayed();
  await loginPage.login(username, password);
}

async function doLogout(loginPage) {
  await loginPage.expectSuccessfulLogin();
  await loginPage.clickLogout();
  await loginPage.assertLoginPageIsDisplayed();
}

async function doInvalidLoginAndVerifyWarning(loginPage, username, password) {
  await loginPage.login(username, password);
  await loginPage.assertInvalidCredentialsWarning();
}

async function doLoginAndRepeatAfterLogout(loginPage, username, password) {
  await doLogin(loginPage, username, password);
  await loginPage.expectSuccessfulLogin();
  await loginPage.clickLogout();
  await loginPage.assertLoginPageIsDisplayed();
  await loginPage.login(username, password);
  await loginPage.expectSuccessfulLogin();
}

function createAuthSteps() {
  return {
    login: async (loginPage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doLogin(loginPage, username, password);
      await loginPage.expectSuccessfulLogin();
    },
    logout: async (loginPage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doLogin(loginPage, username, password);
      await doLogout(loginPage);
    },
    'logout-invalid': async (loginPage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doLogin(loginPage, username, password);
      await doLogout(loginPage);
      await doInvalidLoginAndVerifyWarning(loginPage, username, password);
    },
    'logout-valid': async (loginPage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doLoginAndRepeatAfterLogout(loginPage, username, password);
    },
    'missing-password': async (loginPage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      await loginPage.goto();
      await loginPage.ensureLoggedOut();
      await loginPage.loginWithoutPassword(username);
      await loginPage.assertPasswordFieldMarkedInvalid();
      await loginPage.assertLoginPageIsDisplayed();
    }
  };
}

module.exports = {
  createAuthSteps,
  doLogin,
  doLogout,
  doInvalidLoginAndVerifyWarning,
  doLoginAndRepeatAfterLogout
};
