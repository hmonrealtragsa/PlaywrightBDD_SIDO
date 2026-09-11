const { SIDO2_USERNAME, SIDO2_PASSWORD } = require('../config/env');
const { doLogin } = require('./authSteps');

async function doOpenCurrentMonthQuadrant(homePage, username, password) {
  await doLogin(homePage, username, password);
  await homePage.expectSuccessfulLogin();
  await homePage.openCurrentMonthQuadrant();
  await homePage.assertMonthlyQuadrantDialogOpen();
}

async function doOpenWorkdayScheduleFromCurrentMonthQuadrant(homePage, username, password) {
  await doLogin(homePage, username, password);
  await homePage.expectSuccessfulLogin();
  await homePage.assertWorkdayScheduleCanBeOpenedFromCurrentMonthQuadrant();
}

async function doCreateNewActuationFromCurrentMonthQuadrant(homePage, username, password) {
  await doLogin(homePage, username, password);
  await homePage.expectSuccessfulLogin();
  await homePage.assertNewActuationCanBeCreatedFromCurrentMonthQuadrant();
}

async function doAdvanceHomeMonths(homePage, username, password) {
  await doLogin(homePage, username, password);
  await homePage.expectSuccessfulLogin();
  await homePage.assertHomeMonthsAreVisible();
  await homePage.assertHomeMonthsAdvanceAfterNextClick();
}

async function doGoBackHomeMonths(homePage, username, password) {
  await doLogin(homePage, username, password);
  await homePage.expectSuccessfulLogin();
  await homePage.assertHomeMonthsAreVisible();
  await homePage.assertHomeMonthsGoBackAfterPreviousClick();
}

async function doOpenUserInfoDrawer(homePage, username, password) {
  await doLogin(homePage, username, password);
  await homePage.expectSuccessfulLogin();
  await homePage.assertUserInfoCanBeOpenedFromHome();
}

async function doOpenUserMonthlyQuadrantFromDrawer(homePage, username, password) {
  await doLogin(homePage, username, password);
  await homePage.expectSuccessfulLogin();
  await homePage.assertUserMonthlyQuadrantCanBeOpenedFromHomeUserDrawer();
}

function createHomeSteps() {
  return {
    'open-current-month-quadrant': async (homePage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doOpenCurrentMonthQuadrant(homePage, username, password);
    },
    'open-current-month-workday-schedule': async (homePage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doOpenWorkdayScheduleFromCurrentMonthQuadrant(homePage, username, password);
    },
    'create-current-month-actuation': async (homePage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doCreateNewActuationFromCurrentMonthQuadrant(homePage, username, password);
    },
    'advance-home-months': async (homePage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doAdvanceHomeMonths(homePage, username, password);
    },
    'go-back-home-months': async (homePage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doGoBackHomeMonths(homePage, username, password);
    },
    'open-user-info-drawer': async (homePage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doOpenUserInfoDrawer(homePage, username, password);
    },
    'open-user-monthly-quadrant-from-drawer': async (homePage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doOpenUserMonthlyQuadrantFromDrawer(homePage, username, password);
    }
  };
}

module.exports = {
  createHomeSteps,
  doOpenCurrentMonthQuadrant,
  doOpenWorkdayScheduleFromCurrentMonthQuadrant,
  doCreateNewActuationFromCurrentMonthQuadrant,
  doAdvanceHomeMonths,
  doGoBackHomeMonths,
  doOpenUserInfoDrawer,
  doOpenUserMonthlyQuadrantFromDrawer
};
