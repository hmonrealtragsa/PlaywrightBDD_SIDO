const { SIDO2_USERNAME, SIDO2_PASSWORD } = require('../config/env');
const { doLogin } = require('./authSteps');

async function doVehicleNavigation(loginPage, username, password) {
  await doLogin(loginPage, username, password);
  await loginPage.navigateToVehicleParts();
}

function getCurrentDateString() {
  return new Intl.DateTimeFormat('en-GB').format(new Date());
}

function resolveDateValue(dateValue) {
  const normalized = String(dateValue ?? '').trim().toLowerCase();
  if (!normalized || ['today', '$today', '{{today}}', '${today}'].includes(normalized)) {
    return getCurrentDateString();
  }

  return dateValue;
}

function resolveKmPartData(scenario = {}, defaults = {}) {
  const data = scenario?.data || {};

  return {
    vehicle: data.vehicle || defaults.vehicle || '0010 LBH',
    activity: data.activity || defaults.activity || 'INFORMATICA GENERAL',
    date: resolveDateValue(data.date || defaults.date || getCurrentDateString()),
    kmInicial: data.kmInicial ?? defaults.kmInicial ?? 10,
    kmFinal: data.kmFinal ?? defaults.kmFinal ?? 100,
    kmTotales: data.kmTotales ?? defaults.kmTotales ?? 90,
    itinerary: data.itinerary || defaults.itinerary || 'TEST',
    startTime: data.startTime || defaults.startTime || '09:00',
    endTime: data.endTime || defaults.endTime || '10:00',
    recipient: data.recipient || defaults.recipient || 'Perez De Los Cobos Cassinello, Iñigo'
  };
}

async function ensureKmPartExists(loginPage, data = {}) {
  await loginPage.openVehiclePartsList();

  const partAlreadyExists = await loginPage.hasKmPartInList({
    vehicle: data.vehicle,
    activity: data.activity,
    date: data.date,
    kmTotales: data.kmTotales,
    itinerary: data.itinerary,
    startTime: data.startTime,
    endTime: data.endTime
  });

  if (partAlreadyExists) {
    return;
  }

  await loginPage.openNewKmPartDialog();
  await loginPage.assertNewKmPartDialogOpen();
  await loginPage.fillKmPartForm(data);
  await loginPage.clickSubmit();
  await loginPage.handleRecipientDialogIfPresent(data.recipient);
  await loginPage.assertSuccessMessage();
  await loginPage.assertFormClosed();
  await loginPage.openVehiclePartsList();
}

async function doNewKmPartFlow(loginPage, username, password, scenario = {}) {
  await doVehicleNavigation(loginPage, username, password);
  await loginPage.openNewKmPartDialog();
  await loginPage.assertNewKmPartDialogOpen();

  if (scenario?.data && typeof loginPage.fillKmPartForm === 'function') {
    // Deferred: fill with parsed values once the real modal selectors match the application.
    // Keep the flow as a UI open check to avoid breaking the current suite.
  }
}

async function doNewFuelRechargeFlow(loginPage, username, password) {
  await doVehicleNavigation(loginPage, username, password);
  await loginPage.openNewFuelRepostajeDialog();
  await loginPage.assertNewFuelRepostajeDialogOpen();
}

async function doCreateFuelRechargeFlow(loginPage, username, password, scenario = {}) {
  const data = {
    vehicle: scenario?.data?.vehicle || '0010 LBH - TOYOTA LAND CRUISER 5P',
    date: scenario?.data?.date || 'today',
    km: scenario?.data?.km ?? 1450,
    litros: scenario?.data?.litros ?? 30,
    importe: scenario?.data?.importe ?? 60,
    paymentMethod: scenario?.data?.paymentMethod || 'Medio propio'
  };

  await doVehicleNavigation(loginPage, username, password);
  await loginPage.openNewFuelRepostajeDialog();
  await loginPage.assertNewFuelRepostajeDialogOpen();
  await loginPage.selectVehicle(data.vehicle);
  await loginPage.fillFuelRechargeForm(data);
  await loginPage.assertFuelRechargePaymentSelected(data.paymentMethod || 'Medio propio');

  const submitButton = loginPage.getFuelRechargeDialog().getByRole('button', { name: /^Enviar$/i }).first();
  if (await submitButton.count().catch(() => 0)) {
    await submitButton.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null);
    if (await submitButton.isVisible().catch(() => false)) {
      await submitButton.click({ force: true });
    }
  }

  await loginPage.assertSuccessMessage();
}

async function doCreatePeajeFlow(loginPage, username, password, scenario = {}) {
  const data = {
    vehicle: scenario?.data?.vehicle || '0010 LBH - TOYOTA LAND CRUISER 5P',
    date: scenario?.data?.date || 'today',
    recorrido: scenario?.data?.recorrido || 'Recorrido de prueba',
    hora: scenario?.data?.hora || '09:00',
    importe: scenario?.data?.importe || '12,50',
    paymentMethod: scenario?.data?.paymentMethod || 'Medio propio'
  };

  await doVehicleNavigation(loginPage, username, password);
  await loginPage.openNewPeajeDialog();
  await loginPage.assertNewPeajeDialogOpen();
  await loginPage.selectVehicle(data.vehicle);
  await loginPage.fillPeajeForm(data);
  await loginPage.assertPeajePaymentSelected(data.paymentMethod || 'Medio propio');

  const submitButton = loginPage.getPeajeDialog().getByRole('button', { name: /^Enviar$/i }).first();
  if (await submitButton.count().catch(() => 0)) {
    await submitButton.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null);
    if (await submitButton.isVisible().catch(() => false)) {
      await submitButton.click({ force: true });
    }
  }

  await loginPage.assertPeajeSubmittedSuccessfully();
}

async function doFilterPeajePartsFlow(loginPage, username, password) {
  await doVehicleNavigation(loginPage, username, password);
  await loginPage.applyVehicleTypeFilter('Peaje');
  await loginPage.assertOnlyPeajePartsVisible();
}

async function doFilterRepostajePartsFlow(loginPage, username, password) {
  await doVehicleNavigation(loginPage, username, password);
  await loginPage.applyVehicleTypeFilter('Repostaje');
  await loginPage.assertOnlyRepostajePartsVisible();
}

async function doFilterKilometrosPartsFlow(loginPage, username, password) {
  await doVehicleNavigation(loginPage, username, password);
  await loginPage.applyVehicleTypeFilter('Kilómetros');
  await loginPage.assertOnlyKilometrosPartsVisible();
}

async function doFilterPendingApprovalPartsFlow(loginPage, username, password) {
  await doVehicleNavigation(loginPage, username, password);
  await loginPage.openVehiclePartsList();
  const expectedCount = await loginPage.getVehicleFilterCount('Pendiente de Aprobar');
  await loginPage.applyVehicleProcessingStateFilter('Pendiente de Aprobar');
  await loginPage.assertPendingApprovalPartsVisible(expectedCount);
}

async function doFilterKilometrosSummaryFlow(loginPage, username, password) {
  await doVehicleNavigation(loginPage, username, password);
  await loginPage.applyVehicleSummaryMetricFilter('Kilómetros');
  await loginPage.assertOnlyKilometrosPartsVisible();
}

async function doFilterLitrosSummaryFlow(loginPage, username, password) {
  await doVehicleNavigation(loginPage, username, password);
  await loginPage.applyVehicleSummaryMetricFilter('Litros');
  await loginPage.assertOnlyRepostajePartsVisible();
}

async function doFilterPeajesSummaryFlow(loginPage, username, password) {
  await doVehicleNavigation(loginPage, username, password);
  await loginPage.applyVehicleSummaryMetricFilter('Peajes');
  await loginPage.assertOnlyPeajePartsVisible();
}

async function doNewPeajeFlow(loginPage, username, password) {
  await doVehicleNavigation(loginPage, username, password);
  await loginPage.openNewPeajeDialog();
  await loginPage.assertNewPeajeDialogOpen();
}

async function doCreateKmPartFlow(loginPage, username, password, scenario = {}) {
  const {
    vehicle,
    activity,
    date,
    kmInicial,
    kmFinal,
    kmTotales,
    itinerary,
    startTime,
    endTime,
    recipient
  } = resolveKmPartData(scenario, {
    vehicle: '0010 LBH - TOYOTA LAND CRUISER 5P'
  });

  await doVehicleNavigation(loginPage, username, password);
  await loginPage.openNewKmPartDialog();
  await loginPage.assertNewKmPartDialogOpen();
  await loginPage.fillKmPartForm({
    vehicle,
    activity,
    date,
    kmInicial,
    kmFinal,
    kmTotales,
    itinerary,
    startTime,
    endTime
  });
  await loginPage.clickSubmit();
  await loginPage.handleRecipientDialogIfPresent(recipient);

  await loginPage.assertSuccessMessage();
  await loginPage.assertFormClosed();
  await loginPage.assertPartVisibleInList(vehicle, `${kmTotales} Km`);
}

async function doOpenKmPartFlow(loginPage, username, password, scenario = {}) {
  const {
    vehicle,
    activity,
    date,
    kmInicial,
    kmFinal,
    kmTotales,
    itinerary,
    startTime,
    endTime,
    recipient
  } = resolveKmPartData(scenario);

  await doVehicleNavigation(loginPage, username, password);
  await ensureKmPartExists(loginPage, {
    vehicle,
    activity,
    date,
    kmInicial,
    kmFinal,
    kmTotales,
    itinerary,
    startTime,
    endTime,
    recipient
  });

  await loginPage.openExistingKmPart({
    vehicle,
    activity,
    date,
    kmTotales,
    itinerary,
    startTime,
    endTime
  });
  await loginPage.assertOpenedKmPartMatches({
    vehicle,
    activity,
    date,
    kmInicial,
    kmFinal,
    kmTotales,
    itinerary,
    startTime,
    endTime,
    recipient
  });
}

async function doDeleteKmPartFlow(loginPage, username, password, scenario = {}) {
  const data = resolveKmPartData(scenario, {
    kmInicial: 14,
    kmFinal: 114,
    kmTotales: 100,
    itinerary: 'AUTO DELETE KM PART',
    startTime: '12:00',
    endTime: '13:00'
  });

  await doVehicleNavigation(loginPage, username, password);
  await ensureKmPartExists(loginPage, data);
  await loginPage.openExistingKmPart(data);
  await loginPage.assertDeleteKmPartOptionVisible();
  await loginPage.clickDeleteKmPart();
  await loginPage.assertDeleteConfirmationVisible();
  await loginPage.confirmDeleteKmPart();
  await loginPage.assertFormClosed();
  await loginPage.assertDeleteSuccessMessage();
  await loginPage.assertPartNotVisibleInList(data);
}

async function doWarningNoVehicleKmPartFlow(loginPage, username, password) {
  await doVehicleNavigation(loginPage, username, password);
  await loginPage.openNewKmPartDialog();
  await loginPage.assertNewKmPartDialogOpen();
  await loginPage.triggerActivitySelectionWithoutVehicle();
}

function createVehicleSteps() {
  return {
    'vehicle-navigation': async (loginPage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doVehicleNavigation(loginPage, username, password);
    },
    'new-km-part': async (loginPage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doNewKmPartFlow(loginPage, username, password, scenario);
    },
    'new-fuel-recharge': async (loginPage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doNewFuelRechargeFlow(loginPage, username, password);
    },
    'create-repostaje-part': async (loginPage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doCreateFuelRechargeFlow(loginPage, username, password, scenario);
    },
    'new-peaje': async (loginPage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doNewPeajeFlow(loginPage, username, password);
    },
    'create-peaje-part': async (loginPage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doCreatePeajeFlow(loginPage, username, password, scenario);
    },
    'filter-peaje-parts': async (loginPage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doFilterPeajePartsFlow(loginPage, username, password);
    },
    'filter-repostaje-parts': async (loginPage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doFilterRepostajePartsFlow(loginPage, username, password);
    },
    'filter-kilometros-parts': async (loginPage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doFilterKilometrosPartsFlow(loginPage, username, password);
    },
    'filter-pending-approval-parts': async (loginPage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doFilterPendingApprovalPartsFlow(loginPage, username, password);
    },
    'filter-kilometros-summary-parts': async (loginPage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doFilterKilometrosSummaryFlow(loginPage, username, password);
    },
    'filter-litros-summary-parts': async (loginPage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doFilterLitrosSummaryFlow(loginPage, username, password);
    },
    'filter-peajes-summary-parts': async (loginPage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doFilterPeajesSummaryFlow(loginPage, username, password);
    },
    'create-km-part': async (loginPage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doCreateKmPartFlow(loginPage, username, password, scenario);
    },
    'open-km-part': async (loginPage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doOpenKmPartFlow(loginPage, username, password, scenario);
    },
    'delete-km-part': async (loginPage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doDeleteKmPartFlow(loginPage, username, password, scenario);
    },
    'warningNoVehiculo-km-part': async (loginPage, scenario) => {
      const username = scenario?.given?.username || SIDO2_USERNAME;
      const password = scenario?.given?.password || SIDO2_PASSWORD;
      await doWarningNoVehicleKmPartFlow(loginPage, username, password);
    }
  };
}

module.exports = {
  createVehicleSteps,
  doVehicleNavigation,
  doNewKmPartFlow,
  doNewFuelRechargeFlow,
  doCreateFuelRechargeFlow,
  doNewPeajeFlow,
  doCreatePeajeFlow,
  doFilterPeajePartsFlow,
  doFilterRepostajePartsFlow,
  doFilterKilometrosPartsFlow,
  doFilterPendingApprovalPartsFlow,
  doFilterKilometrosSummaryFlow,
  doFilterLitrosSummaryFlow,
  doFilterPeajesSummaryFlow,
  doCreateKmPartFlow,
  doOpenKmPartFlow,
  doDeleteKmPartFlow,
  doWarningNoVehicleKmPartFlow
};
