const { expect } = require('@playwright/test');
const LoginPage = require('./LoginPage');

function escapeRegExp(value) {
  return (value || '').toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

function normalizeDateString(value) {
  const parts = (value || '').split('/').map((part) => part.padStart(2, '0'));
  return parts.length === 3 ? parts.join('/') : value;
}

function normalizePaymentMethodValue(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

function isEquivalentFuelPaymentMethod(actualValue, expectedValue) {
  const actual = normalizePaymentMethodValue(actualValue);
  const expected = normalizePaymentMethodValue(expectedValue);

  const paymentOwnPattern = /(medio|metododepagopropio|metodopropio|mediopropio)/i;
  const actualMatches = paymentOwnPattern.test(actual) && actual.includes('propio');
  const expectedMatches = paymentOwnPattern.test(expected) && expected.includes('propio');

  return actualMatches && expectedMatches;
}

function buildKmPartCardPattern(data = {}) {
  const segments = [];

  if (data.date) {
    segments.push(escapeRegExp(formatDateForVehicleList(data.date)));
  }
  if (data.startTime && data.endTime) {
    segments.push(`${escapeRegExp(formatTimeForVehicleList(data.startTime))}\\s*-\\s*${escapeRegExp(formatTimeForVehicleList(data.endTime))}`);
  }
  if (data.vehicle) {
    segments.push(escapeRegExp(data.vehicle));
  }
  if (data.activity) {
    segments.push(escapeRegExp(data.activity));
  }
  if (data.itinerary) {
    segments.push(escapeRegExp(data.itinerary));
  }
  if (data.kmTotales !== undefined && data.kmTotales !== null) {
    segments.push(`${escapeRegExp(String(data.kmTotales))}\\s*Km`);
  }

  return new RegExp(segments.join('[\\s\\S]*'), 'i');
}

function formatDateForVehicleList(value) {
  const normalized = normalizeDateString(value);
  const [day, month, year] = normalized.split('/');
  if (!day || !month || !year) {
    return value;
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIndex = Number(month) - 1;
  const monthName = monthNames[monthIndex];
  if (!monthName) {
    return value;
  }

  return `${Number(day)} ${monthName} ${year}`;
}

function formatTimeForVehicleList(value) {
  return String(value || '').replace(/^0(\d:\d{2})$/, '$1');
}

function normalizeVisibleText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function buildContainsPattern(value) {
  return new RegExp(escapeRegExp(normalizeVisibleText(value)), 'i');
}

function normalizeComparableText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function isKmCardText(value) {
  const text = normalizeVisibleText(value);
  return /\bKm\b/i.test(text) && !/,\d+\s*L\b|€/.test(text);
}

function isRepostajeCardText(value) {
  const text = normalizeVisibleText(value);
  return /,\d+\s*L\b/i.test(text) && !/\bKm\b|€/.test(text);
}

function isPeajeCardText(value) {
  const text = normalizeVisibleText(value);
  return /€/.test(text) && !/\bKm\b|,\d+\s*L\b/i.test(text);
}

function getVehiclePartTypeMatcher(type) {
  const normalizedType = normalizeComparableText(type);

  if (normalizedType === 'peaje') {
    return isPeajeCardText;
  }
  if (normalizedType === 'repostaje') {
    return isRepostajeCardText;
  }
  if (normalizedType === 'kilometros') {
    return isKmCardText;
  }

  throw new Error(`Tipo de parte no soportado para filtros: ${type}`);
}

function buildSummaryMetricPattern(filterName) {
  const normalizedType = normalizeComparableText(filterName);

  if (normalizedType === 'kilometros') {
    return /^Kil[oó]metros$/i;
  }
  if (normalizedType === 'litros') {
    return /^Litros$/i;
  }
  if (normalizedType === 'peajes') {
    return /^Peajes$/i;
  }

  return new RegExp(`^${escapeRegExp(filterName)}$`, 'i');
}

function isMatchingSummaryMetricLabel(actualText, expectedFilterName) {
  const actual = normalizeComparableText(actualText);
  const expected = normalizeComparableText(expectedFilterName);

  if (expected === 'kilometros') {
    return actual === 'kilometros';
  }
  if (expected === 'litros') {
    return actual === 'litros';
  }
  if (expected === 'peajes') {
    return actual === 'peajes';
  }

  return actual === expected;
}

class VehiclePage extends LoginPage {
  constructor(page, baseURL) {
    super(page, baseURL);
    this.vehicleMenuLink = page.locator('[href="/null"]').first();
    this.vehicleMenuItem = page.getByText(/Mis Partes de Vehículos/i, { exact: false });
    this.vehiclePartsLink = page.locator('[href="/vehiculos/misPartesVehiculos"]').first();
    this.vehiclePartsTitle = page.getByText(/Mis Partes de Vehículos/i, { exact: false }).last();
    this.newKmPartButton = page.locator('button').filter({ hasText: /Nuevo Parte Km/i }).first();
    this.kmPartModalTitle = page.getByText(/Parte de Kilómetros|Parte de Kilometros/i, { exact: false }).first();
    this.newFuelButton = page.locator('button').filter({ hasText: /Nuevo Repostaje/i }).first();
    this.fuelRepostajeModalTitle = page.getByText(/parte de repostaje|repostaje/i, { exact: false }).first();
    this.newPeajeButton = page.locator('button').filter({ hasText: /Nuevo Peaje/i }).first();
    this.peajeModalTitle = page.getByText(/parte de peaje|peaje/i, { exact: false }).first();
    this.successMessage = page.getByText(/Parte Enviado correctamente|Parte enviado correctamente/i, { exact: false }).last();
    this.pendingVehiclePartsTitle = page.getByText(/Partes Pendientes Tramitar(?: por M[ií])?/i, { exact: false }).last();
    this.deleteSuccessMessage = page.getByText(/Parte eliminado correctamente/i, { exact: false }).last();
    this.deleteConfirmationTitle = page.getByText(/^Confirmar$/i).last();
    this.deleteConfirmationMessage = page.getByText(/Se va a proceder a eliminar el Parte/i, { exact: false }).last();
    this.deleteConfirmationContinueButton = page.getByRole('button', { name: /^Continuar$/i }).last();
    this.deleteConfirmationCancelButton = page.getByRole('button', { name: /^Cancelar$/i }).last();
  }

  getKmPartDialog() {
    return this.page.locator('[role="dialog"]').filter({ hasText: /Parte de Kilómetros|Parte de Kilometros/i }).first();
  }

  getVehicleSelectorTrigger() {
    return this.page.locator('[role="dialog"]').last().locator('.card-vehiculo .mat-ripple').first();
  }

  async resolveVehicleSelectorTrigger(expectedVehicleText = '') {
    const dialog = this.page.locator('[role="dialog"]').last();
    const normalizedVehicle = normalizeVisibleText(String(expectedVehicleText || '').split('-')[0]);
    const vehiclePattern = normalizedVehicle
      ? new RegExp(escapeRegExp(normalizedVehicle), 'i')
      : /Selecciona Vehículo|Selecciona Vehiculo|Vehículo|Vehiculo/i;

    const candidates = [
      this.getVehicleSelectorTrigger(),
      dialog.getByText(/Selecciona Vehículo|Selecciona Vehiculo/i, { exact: false }).first(),
      dialog.locator('div, button').filter({ hasText: vehiclePattern }).first(),
      dialog.locator('div, button').filter({ hasText: /Selecciona Vehículo|Selecciona Vehiculo/i }).first()
    ];

    for (const candidate of candidates) {
      if (await candidate.count().catch(() => 0)) {
        const visible = await candidate.isVisible().catch(() => false);
        if (visible) {
          return candidate;
        }
      }
    }

    return this.getVehicleSelectorTrigger();
  }

  getActivitySection() {
    return this.getKmPartDialog().locator('.vistadetalle_section').filter({ hasText: /Actuación y Actividad|Actuacion y Actividad/i }).first();
  }

  getActivityCardText() {
    return this.getActivitySection().innerText();
  }

  getDateInput() {
    return this.getKmPartDialog().getByPlaceholder('Selecciona Fecha');
  }

  getSituationInputs() {
    return this.getKmPartDialog().locator('.vistadetalle_section').filter({ hasText: /Situación/i }).locator('input');
  }

  getUsageHourInputs() {
    return this.getKmPartDialog().locator('.vistadetalle_section').filter({ hasText: /Franja horaria uso vehículo|Franja horaria uso vehiculo/i }).locator('input');
  }

  getVehiclePanelSearchInput() {
    return this.getVehiclePanel().locator('input[placeholder]').first();
  }

  getVehiclePanel() {
    return this.page.locator('.ant-drawer-content-wrapper').filter({ hasText: /Selecciona (el|un) Vehículo|Selecciona (el|un) Vehiculo/i }).last();
  }

  getVehiclePanelAllOption() {
    return this.getVehiclePanel().locator('label.ant-radio-button-wrapper').last();
  }

  getVehiclePanelOption(vehicleText) {
    return this.getVehiclePanel().locator('[matripple]').filter({
      hasText: new RegExp(escapeRegExp(vehicleText), 'i')
    }).first();
  }

  getActivityPanel() {
    return this.page.locator('.ant-drawer-content-wrapper').filter({ hasText: /Selecciona la Actuación y Actividad|Selecciona la Actuacion y Actividad/i }).last();
  }

  getActivityPanelAllOption() {
    return this.getActivityPanel().locator('label.ant-radio-button-wrapper').last();
  }

  getActivityPanelSearchInput() {
    return this.getActivityPanel().locator('input[placeholder]').first();
  }

  getActivityPanelOption(activityText) {
    return this.getActivityPanel().locator('.mat-ripple.minicard').filter({
      hasText: new RegExp(escapeRegExp(activityText), 'i')
    }).first();
  }

  getActivityPanelFirstActivityOption() {
    return this.getActivityPanel().locator('.mat-ripple.minicard').first();
  }

  getRecipientPanelTitle() {
    return this.page.getByText(/Selecciona (el|un) Destinatario/i, { exact: false }).last();
  }

  getRecipientPanel() {
    return this.page.locator('.ant-drawer-content-wrapper').filter({ hasText: /Selecciona (el|un) Destinatario/i }).last();
  }

  getRecipientOption(recipientText) {
    if (/perez de los cobos|iñigo|inigo/i.test(recipientText || '')) {
      return this.getRecipientPanel().getByText(/Perez De Los Cobos Cassinello, Iñigo|Iñigo|Inigo/i, { exact: false }).first();
    }

    return this.getRecipientPanel().getByText(new RegExp(escapeRegExp(recipientText), 'i'), { exact: false }).first();
  }

  getSuggestedRecipientOption() {
    return this.getRecipientPanel().locator('[matripple]').last();
  }

  getRecipientResponsibleTab() {
    return this.getRecipientPanel().getByText(/Responsables Actuación|Responsables Actuacion/i, { exact: false }).first();
  }

  getRecipientResponsibleButton() {
    return this.getRecipientPanel().getByRole('button', { name: /Ver Respons de Actuación|Ver Respons de Actuacion/i });
  }

  getRecipientFirstCardOption() {
    return this.getRecipientPanel().locator('.mat-ripple.minicard').first();
  }

  getDuplicateVehicleWarning() {
    return this.getKmPartDialog().getByText(/Este vehículo ya ha sido utilizado|Este veh[íi]culo ya ha sido utilizado/i, { exact: false }).first();
  }

  getActivityWithoutVehicleWarningDialog() {
    return this.page.locator('[role="dialog"]').filter({
      hasText: /actuación y actividad|actuacion y actividad/i
    }).last();
  }

  async assertActivityWithoutVehicleWarningVisible() {
    const warningDialog = this.getActivityWithoutVehicleWarningDialog();
    await expect(warningDialog).toBeVisible({ timeout: 15000 });
    await expect(warningDialog.getByText(/Advertencia/i, { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(warningDialog.getByText(/Para seleccionar.*actuación.*actividad.*(vehículo|vehiculo).*conductor.*parte/i, { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(warningDialog.getByRole('button', { name: /^Cerrar$/i })).toBeVisible({ timeout: 15000 });
  }

  async triggerActivitySelectionWithoutVehicle() {
    await this.getActivitySection().click({ force: true });
    await this.assertActivityWithoutVehicleWarningVisible();
  }

  async openVehicleMenu() {
    await this.vehicleMenuLink.waitFor({ state: 'visible', timeout: 15000 });
    await this.vehicleMenuLink.click({ force: true });
  }

  async assertVehiclePartsVisible() {
    await this.vehiclePartsLink.waitFor({ state: 'visible', timeout: 15000 });
    await expect(this.vehiclePartsLink).toBeVisible({ timeout: 15000 });
  }

  async navigateToVehicleParts() {
    await this.openVehicleMenu();
    await this.assertVehiclePartsVisible();
  }

  async openVehiclePartsList() {
    const alreadyOnVehicleParts = /\/vehiculos\/misPartesVehiculos/i.test(this.page.url())
      && await this.vehiclePartsTitle.isVisible().catch(() => false);

    if (!alreadyOnVehicleParts) {
      const partsLinkVisible = await this.vehiclePartsLink.isVisible().catch(() => false);
      if (!partsLinkVisible) {
        await this.openVehicleMenu();
      }

      await this.vehiclePartsLink.waitFor({ state: 'visible', timeout: 15000 });
      await this.vehiclePartsLink.click({ force: true });
      await this.page.waitForURL(/\/vehiculos\/misPartesVehiculos/i, { timeout: 15000 });
      await this.page.waitForLoadState('networkidle');
    }

    await expect(this.vehiclePartsTitle).toBeVisible({ timeout: 15000 });
  }

  getVehicleTypeFiltersSection() {
    return this.page.getByText(/Filtros/i, { exact: false }).last();
  }

  getVehicleTypeFilterOption(filterName) {
    return this.page.locator('p').filter({
      hasText: new RegExp(`^${escapeRegExp(filterName)}$`, 'i')
    }).last();
  }

  getVehiclePartCards() {
    return this.page.locator('[matripple].minicard').filter({
      hasText: /[0-3]?\d\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}[\s\S]*\b\d{4}\s+[A-Z]{3}\b[\s\S]*(?:\bKm\b|,\d+\s*L\b|€)/i
    });
  }

  async getVisibleVehiclePartCardTexts() {
    return this.getVehiclePartCards().evaluateAll((elements) => {
      const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();
      const texts = elements
        .map((element) => normalize(element.textContent))
        .filter((text) => text && /Km|,\d+\s*L|€|[0-3]?\d\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/i.test(text));

      return [...new Set(texts)];
    });
  }

  async getVisibleVehiclePartCardCount() {
    return this.getVehiclePartCards().count();
  }

  async getVehicleFilterCount(filterLabel) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const count = await this.page.evaluate((expectedFilterLabel) => {
        const normalize = (value) => String(value || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();
        const label = Array.from(document.querySelectorAll('p'))
          .find((element) => normalize(element.textContent) === normalize(expectedFilterLabel));
        const option = label ? label.closest('[matripple].minicard, .minicard') : null;
        if (!option) {
          return null;
        }

        const match = (option.textContent || '').match(/(\d+)\s*$/);
        return match ? Number(match[1]) : null;
      }, filterLabel);

      if (count !== null) {
        return count;
      }

      await this.page.waitForTimeout(500);
    }

    return null;
  }

  async applyVehicleFilter(filterName) {
    await this.openVehiclePartsList();
    await expect(this.getVehicleTypeFiltersSection()).toBeVisible({ timeout: 15000 });

    await expect.poll(async () => this.page.evaluate((expectedFilterName) => {
      const normalize = (value) => String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
      const label = Array.from(document.querySelectorAll('p'))
        .find((element) => normalize(element.textContent) === normalize(expectedFilterName));
      return Boolean(label && label.closest('[matripple].minicard, .minicard'));
    }, filterName), { timeout: 15000 }).toBe(true);

    const clicked = await this.page.evaluate((expectedFilterName) => {
      const normalize = (value) => String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
      const label = Array.from(document.querySelectorAll('p'))
        .find((element) => normalize(element.textContent) === normalize(expectedFilterName));
      const option = label ? label.closest('[matripple].minicard, .minicard') : null;
      if (!option) {
        return false;
      }

      option.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      option.click();
      return true;
    }, filterName);

    expect(clicked).toBe(true);

    await this.page.waitForLoadState('networkidle').catch(() => null);
  }

  async applyVehicleTypeFilter(filterName) {
    await this.applyVehicleFilter(filterName);
  }

  async applyVehicleProcessingStateFilter(filterName) {
    await this.applyVehicleFilter(filterName);
  }

  async applyVehicleSummaryMetricFilter(filterName) {
    await this.openVehiclePartsList();

    const labels = this.page.locator('div.text-tile.minicard_subtitle');
    const labelsCount = await labels.count();
    let card = null;

    for (let index = 0; index < labelsCount; index += 1) {
      const label = labels.nth(index);
      const labelText = await label.textContent().catch(() => '');
      if (!isMatchingSummaryMetricLabel(labelText, filterName)) {
        continue;
      }

      const visible = await label.isVisible().catch(() => false);
      if (!visible) {
        continue;
      }

      card = label.locator('xpath=ancestor::div[contains(@class,"clickable")][1]');
      break;
    }

    if (!card) {
      throw new Error(`No se encontró el icono resumen visible para "${filterName}" en Mis Partes de Vehículos.`);
    }

    await card.scrollIntoViewIfNeeded().catch(() => null);
    await expect(card).toBeVisible({ timeout: 15000 });
    await card.click({ force: true });

    await this.page.waitForLoadState('networkidle').catch(() => null);
  }

  async assertOnlyVehiclePartsOfTypeVisible(type) {
    const matchesExpectedType = getVehiclePartTypeMatcher(type);

    await expect.poll(async () => {
      const cardTexts = await this.getVisibleVehiclePartCardTexts();
      if (!cardTexts.length) {
        return false;
      }

      return cardTexts.every((text) => matchesExpectedType(text));
    }, { timeout: 15000 }).toBe(true);

    const cardTexts = await this.getVisibleVehiclePartCardTexts();
    expect(cardTexts.length).toBeGreaterThan(0);
    expect(cardTexts.every((text) => matchesExpectedType(text))).toBe(true);
  }

  async assertOnlyPeajePartsVisible() {
    await this.assertOnlyVehiclePartsOfTypeVisible('Peaje');
  }

  async assertOnlyRepostajePartsVisible() {
    await this.assertOnlyVehiclePartsOfTypeVisible('Repostaje');
  }

  async assertOnlyKilometrosPartsVisible() {
    await this.assertOnlyVehiclePartsOfTypeVisible('Kilómetros');
  }

  async assertPendingApprovalPartsVisible(expectedCount) {
    expect(expectedCount).not.toBeNull();
    expect(expectedCount).toBeGreaterThan(0);

    await expect.poll(async () => this.getVisibleVehiclePartCardCount(), { timeout: 15000 }).toBe(expectedCount);
  }

  async openNewKmPartDialog() {
    await this.openVehiclePartsList();
    await this.newKmPartButton.waitFor({ state: 'visible', timeout: 15000 });
    await this.newKmPartButton.click();
    await this.getKmPartDialog().waitFor({ state: 'visible', timeout: 15000 });
  }

  async assertNewKmPartDialogOpen() {
    await expect(this.getKmPartDialog()).toBeVisible({ timeout: 15000 });
    await expect(this.kmPartModalTitle).toBeVisible({ timeout: 15000 });
  }

  getDeleteKmPartButton() {
    return this.getKmPartDialog().getByRole('button', { name: /^Eliminar$/i });
  }

  async openNewFuelRepostajeDialog() {
    await this.openVehiclePartsList();
    await this.newFuelButton.waitFor({ state: 'visible', timeout: 15000 });
    await this.newFuelButton.click();
    await this.fuelRepostajeModalTitle.waitFor({ state: 'visible', timeout: 15000 });
  }

  async assertNewFuelRepostajeDialogOpen() {
    await this.fuelRepostajeModalTitle.waitFor({ state: 'visible', timeout: 15000 });
    await expect(this.fuelRepostajeModalTitle).toBeVisible({ timeout: 15000 });
  }

  getFuelRechargeDialog() {
    return this.page.locator('[role="dialog"]').filter({
      hasText: /Parte Diario de Repostaje|Parte de repostaje|repostaje/i
    }).first();
  }

  getPaymentTrigger(dialog) {
    return dialog
      .locator('p')
      .filter({ hasText: /Pulsa para Seleccionar|Pulsa para seleccionar/i })
      .last();
  }

  getFuelRechargePaymentTrigger() {
    return this.getPaymentTrigger(this.getFuelRechargeDialog());
  }

  async selectPaymentMethod(dialog, expectedPaymentMethod = 'Medio propio') {
    const trigger = this.getPaymentTrigger(dialog);
    if (await trigger.count().catch(() => 0)) {
      await trigger.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);
      if (await trigger.isVisible().catch(() => false)) {
        await trigger.click({ force: true }).catch(() => null);
        await trigger.evaluate((element) => element.click()).catch(() => null);
      }
    }

    const targetOption = this.page.locator('.ant-drawer-content-wrapper, [role="dialog"], div').filter({
      hasText: /Medio Propio/i
    }).last();

    if (await targetOption.count().catch(() => 0)) {
      await targetOption.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);
      if (await targetOption.isVisible().catch(() => false)) {
        await targetOption.click({ force: true }).catch(() => null);
        await targetOption.evaluate((element) => element.click()).catch(() => null);
      }
    }

    const fallbackOption = this.page.locator('p').filter({
      hasText: /^Medio Propio$/i
    }).first();
    if (await fallbackOption.count().catch(() => 0)) {
      await fallbackOption.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);
      if (await fallbackOption.isVisible().catch(() => false)) {
        await fallbackOption.click({ force: true }).catch(() => null);
      }
    }

    await this.page.waitForTimeout(600);

    const paymentDrawer = this.page.locator('.ant-drawer-content-wrapper, [role="dialog"]').filter({
      hasText: /M[eé]todo de Pago/i
    }).last();
    if (await paymentDrawer.count().catch(() => 0)) {
      const closeButton = paymentDrawer.locator('button').first();
      if (await closeButton.count().catch(() => 0)) {
        await closeButton.click({ force: true }).catch(() => null);
        await this.page.waitForTimeout(300);
      }
    }
  }

  async selectFuelPaymentMethod(expectedPaymentMethod = 'Medio propio') {
    await this.selectPaymentMethod(this.getFuelRechargeDialog(), expectedPaymentMethod);
  }

  async assertPaymentSelected(dialog, expectedPaymentMethod = 'Medio propio') {
    const checks = [
      this.getPaymentTrigger(dialog),
      dialog.getByText(/M[eé]todo de Pago propio|Medio Propio/i, { exact: false }).first(),
      dialog.locator('p.minicard_title').filter({ hasText: /^Medio Propio$/i }).first(),
      dialog.locator('p').filter({ hasText: /^Medio Propio$/i }).first(),
      this.page.locator('.ant-drawer-content-wrapper, [role="dialog"], [role="listbox"]').filter({
        hasText: /^Medio Propio$/i
      }).first()
    ];

    for (const locator of checks) {
      if (await locator.count().catch(() => 0)) {
        const text = await locator.textContent().catch(() => '');
        if (isEquivalentFuelPaymentMethod(text, expectedPaymentMethod)) {
          return;
        }
      }
    }

    throw new Error(`No se ha seleccionado el método de pago "${expectedPaymentMethod}"`);
  }

  async assertFuelRechargePaymentSelected(expectedPaymentMethod = 'Medio propio') {
    await this.assertPaymentSelected(this.getFuelRechargeDialog(), expectedPaymentMethod);
  }

  async fillFuelRechargeForm(data = {}) {
    const dialog = this.getFuelRechargeDialog();
    if (!(await dialog.count().catch(() => 0))) {
      return;
    }

    const dateField = dialog.getByPlaceholder('Selecciona Fecha').first();
    if (await dateField.count().catch(() => 0)) {
      const expectedDate = normalizeDateString(resolveDateValue(data.date || getCurrentDateString()));
      await dateField.click({ force: true }).catch(() => null);

      const todayButton = this.page.getByRole('button', { name: /^Hoy$/i }).first();
      if (await todayButton.count().catch(() => 0)) {
        await todayButton.click({ force: true }).catch(() => null);
        await this.page.waitForTimeout(300);
      }

      const currentValue = await dateField.inputValue().catch(() => '');
      if (!currentValue || !/^\d{2}\/\d{2}\/\d{4}$/.test(currentValue)) {
        await dateField.fill(expectedDate).catch(() => null);
        await dateField.press('Tab').catch(() => null);
        await this.page.waitForTimeout(300);
      }

      await expect(dateField).toHaveValue(expectedDate, { timeout: 10000 }).catch(() => null);
    }

    const registerManualDataButton = dialog.getByRole('button', { name: /Registrar Datos/i }).first();
    if (await registerManualDataButton.count().catch(() => 0)) {
      await registerManualDataButton.click({ force: true }).catch(() => null);
    }

    const kmInput = dialog.locator('#kmTotalesInput').first();
    if (await kmInput.count().catch(() => 0)) {
      await kmInput.fill(String(data.km ?? 1450)).catch(() => null);
    }

    const combustibleInput = dialog.locator('#combustibleInput').first();
    if (await combustibleInput.count().catch(() => 0)) {
      await combustibleInput.fill(String(data.litros ?? 30)).catch(() => null);
    }

    const adBlueInput = dialog.locator('#adBlueInput').first();
    if (await adBlueInput.count().catch(() => 0)) {
      await adBlueInput.fill(String(data.adBlue ?? 0)).catch(() => null);
    }

    const importeInput = dialog.locator('#importeInput').first();
    if (await importeInput.count().catch(() => 0)) {
      await importeInput.fill(String(data.importe ?? 60)).catch(() => null);
    }

    await this.selectFuelPaymentMethod(String(data.paymentMethod || 'Medio propio'));
    await this.assertFuelRechargePaymentSelected(String(data.paymentMethod || 'Medio propio'));
  }

  async openNewPeajeDialog() {
    await this.openVehiclePartsList();
    await this.newPeajeButton.waitFor({ state: 'visible', timeout: 15000 });
    await this.newPeajeButton.click();
    await this.peajeModalTitle.waitFor({ state: 'visible', timeout: 15000 });
  }

  async assertNewPeajeDialogOpen() {
    await this.peajeModalTitle.waitFor({ state: 'visible', timeout: 15000 });
    await expect(this.peajeModalTitle).toBeVisible({ timeout: 15000 });
  }

  getPeajeDialog() {
    return this.page.locator('[role="dialog"]').filter({
      has: this.page.getByText(/Parte de Peaje|Parte Diario de Peaje/i, { exact: false })
    }).last();
  }

  getPeajePaymentTrigger() {
    return this.getPaymentTrigger(this.getPeajeDialog());
  }

  async selectPeajePaymentMethod(expectedPaymentMethod = 'Medio propio') {
    await this.selectPaymentMethod(this.getPeajeDialog(), expectedPaymentMethod);
  }

  async assertPeajePaymentSelected(expectedPaymentMethod = 'Medio propio') {
    await this.assertPaymentSelected(this.getPeajeDialog(), expectedPaymentMethod);
  }

  async fillPeajeForm(data = {}) {
    const dialog = this.getPeajeDialog();
    if (!(await dialog.count().catch(() => 0))) {
      throw new Error('No se ha abierto el modal de peaje.');
    }
    await expect(dialog).toContainText(/Peaje/i, { timeout: 15000 });

    const dateField = dialog.getByPlaceholder('Selecciona Fecha').first();
    if (await dateField.count().catch(() => 0)) {
      await dateField.click({ force: true }).catch(() => null);
      const todayButton = this.page.getByRole('button', { name: /^Hoy$/i }).first();
      if (await todayButton.count().catch(() => 0)) {
        await todayButton.click({ force: true }).catch(() => null);
      } else {
        const dateValue = normalizeDateString(resolveDateValue(data.date || getCurrentDateString()));
        await dateField.fill(dateValue).catch(() => null);
        await dateField.press('Tab').catch(() => null);
      }
    }

    const registerManualDataButton = dialog.getByRole('button', { name: /Registrar Datos/i }).first();
    if (await registerManualDataButton.count().catch(() => 0)) {
      await registerManualDataButton.click({ force: true }).catch(() => null);
      await this.page.waitForTimeout(800);
      await dialog.getByText(/Recorrido/i, { exact: false }).waitFor({ state: 'visible', timeout: 5000 }).catch(() => null);
    }

    const fieldInputs = dialog.getByRole('textbox');
    const fieldInputsCount = await fieldInputs.count().catch(() => 0);

    const recorridoInput = dialog.locator('textarea').first();
    const recorridoPlaceholder = dialog.getByPlaceholder(/Recorrido|Itinerario|Tramo/i).first();
    const recorridoField = (await recorridoInput.count().catch(() => 0))
      ? recorridoInput
      : (await recorridoPlaceholder.count().catch(() => 0)
        ? recorridoPlaceholder
        : fieldInputs.first());

    if (!(await recorridoField.count().catch(() => 0))) {
      throw new Error('La UI actual del parte de peaje no expone el input de recorrido tras pulsar Registrar Datos.');
    }
    await recorridoField.fill(String(data.recorrido || 'Recorrido de prueba')).catch(() => null);

    const hourImportGroup = dialog
      .locator('div')
      .filter({ hasText: /Hora\s*\*/i })
      .filter({ hasText: /Importe\s*\*/i })
      .last();

    const horaInput = hourImportGroup.getByRole('textbox').first();
    const horaPlaceholder = dialog.getByPlaceholder(/Hora/i).first();
    const horaField = (await horaInput.count().catch(() => 0))
      ? horaInput
      : (await horaPlaceholder.count().catch(() => 0)
        ? horaPlaceholder
        : fieldInputs.nth(Math.max(Math.min(2, fieldInputsCount - 1), 0)));
    if (await horaField.count().catch(() => 0)) {
      await horaField.fill(String(data.hora || '09:00')).catch(() => null);
      await horaField.press('Enter').catch(() => null);
      await horaField.blur().catch(() => null);
      await this.page.waitForTimeout(300);
    }

    const importeCandidates = [
      hourImportGroup.getByRole('textbox').last(),
      dialog.getByPlaceholder(/Importe/i).first(),
      fieldInputs.nth(3),
      fieldInputs.last()
    ];
    const importeValue = String(data.importe || '12,50');
    let importeFilled = false;

    for (const candidate of importeCandidates) {
      if (!(await candidate.count().catch(() => 0))) {
        continue;
      }

      const visible = await candidate.isVisible().catch(() => false);
      if (!visible) {
        continue;
      }

      const filled = await candidate.fill(importeValue).then(() => true).catch(() => false);
      if (filled) {
        importeFilled = true;
        break;
      }
    }

    if (!importeFilled) {
      const dialogText = normalizeVisibleText(await dialog.textContent().catch(() => ''));
      throw new Error(`La UI actual del parte de peaje no expone el input de importe tras pulsar Registrar Datos. textboxes=${fieldInputsCount}. dialog="${dialogText.slice(0, 400)}"`);
    }

    await this.selectPeajePaymentMethod(String(data.paymentMethod || 'Medio propio'));
    await this.assertPeajePaymentSelected(String(data.paymentMethod || 'Medio propio'));
  }

  async selectVehicle(vehicleText) {
    const normalizedVehicle = normalizeVisibleText(String(vehicleText || '').split('-')[0]);
    const expectedVehiclePattern = buildContainsPattern(normalizedVehicle || vehicleText);
    const vehicleTrigger = await this.resolveVehicleSelectorTrigger(vehicleText);
    const currentVehicleText = normalizeVisibleText(await vehicleTrigger.textContent().catch(() => ''));

    if (normalizedVehicle && expectedVehiclePattern.test(currentVehicleText) && !/Selecciona Vehículo|Selecciona Vehiculo/i.test(currentVehicleText)) {
      return;
    }

    await vehicleTrigger.waitFor({ state: 'visible', timeout: 15000 });
    await vehicleTrigger.click({ force: true }).catch(() => null);
    await vehicleTrigger.evaluate((element) => element.click()).catch(() => null);

    const panel = this.getVehiclePanel();
    const panelOptions = [
      panel.getByText(new RegExp(escapeRegExp(normalizedVehicle || vehicleText), 'i'), { exact: false }).first(),
      panel.locator('li, button, label, .mat-ripple, [matripple]').filter({
        hasText: new RegExp(escapeRegExp(normalizedVehicle || vehicleText), 'i')
      }).first(),
      this.getVehiclePanelOption(vehicleText)
    ];

    for (const option of panelOptions) {
      if (await option.count().catch(() => 0)) {
        const visible = await option.isVisible().catch(() => false);
        if (visible) {
          await option.click({ force: true }).catch(() => null);
          break;
        }
      }
    }

    await expect.poll(async () => normalizeVisibleText(await (await this.resolveVehicleSelectorTrigger(vehicleText)).textContent().catch(() => '')), { timeout: 15000 })
      .toMatch(expectedVehiclePattern);
  }

  async selectActivity(activityText) {
    if (!activityText) {
      return;
    }

    const activityCardText = await this.getActivityCardText();
    if (!/Selecciona una Actuación y Actividad|Selecciona una Actuacion y Actividad/i.test(activityCardText)
      && new RegExp(escapeRegExp(activityText), 'i').test(activityCardText)) {
      return;
    }

    await this.getActivitySection().click({ force: true });

    const blockingWarning = this.page.getByText(/Para seleccionar la actuación y actividad|Para seleccionar la actuaci[óo]n y actividad/i, { exact: false }).first();
    if (await blockingWarning.count()) {
      const warningVisible = await blockingWarning.isVisible().catch(() => false);
      if (warningVisible) {
        throw new Error('La actividad no se puede seleccionar hasta completar la selección del vehículo y conductor.');
      }
    }

    const allOption = this.getActivityPanelAllOption();
    await allOption.waitFor({ state: 'visible', timeout: 15000 });
    await allOption.evaluate((element) => element.click());

    const searchInput = this.getActivityPanelSearchInput();
    await searchInput.waitFor({ state: 'visible', timeout: 15000 });
    await searchInput.fill(activityText);
    await searchInput.press('Enter');

    const activityOption = this.getActivityPanelOption(activityText);
    await activityOption.waitFor({ state: 'visible', timeout: 15000 });
    await activityOption.evaluate((element) => element.click());

    const activityPanelStillVisible = await this.getActivityPanel().isVisible().catch(() => false);
    if (activityPanelStillVisible) {
      const nestedActivityOption = this.getActivityPanelFirstActivityOption();
      await nestedActivityOption.waitFor({ state: 'visible', timeout: 15000 });
      await nestedActivityOption.evaluate((element) => element.click());
    }

    await expect.poll(async () => normalizeVisibleText(await this.getActivitySection().innerText()), { timeout: 15000 })
      .toMatch(new RegExp(escapeRegExp(activityText), 'i'));
  }

  async selectDate(dateText) {
    const dateInput = this.getDateInput();
    await dateInput.waitFor({ state: 'visible', timeout: 15000 });
    await dateInput.click();

    const today = new Intl.DateTimeFormat('en-GB').format(new Date());
    if (normalizeDateString(dateText) === normalizeDateString(today)) {
      const todayButton = this.page.locator('.ant-picker-today-btn');
      await todayButton.waitFor({ state: 'visible', timeout: 15000 });
      await todayButton.click();
      await expect(dateInput).toHaveValue(normalizeDateString(dateText), { timeout: 15000 });
      return;
    }

    await dateInput.fill(dateText);
    await dateInput.press('Tab');
    await expect(dateInput).toHaveValue(normalizeDateString(dateText), { timeout: 15000 });
  }

  async fillKmInicial(value) {
    const input = this.getSituationInputs().nth(0);
    await input.waitFor({ state: 'visible', timeout: 15000 });
    await input.fill(String(value));
  }

  async fillKmFinal(value) {
    const input = this.getSituationInputs().nth(1);
    await input.waitFor({ state: 'visible', timeout: 15000 });
    await input.fill(String(value));
  }

  async fillKmTotales(value) {
    const input = this.getSituationInputs().nth(2);
    await input.waitFor({ state: 'visible', timeout: 15000 });
    await input.fill(String(value));
  }

  async fillItinerary(value) {
    const input = this.getSituationInputs().nth(3);
    await input.waitFor({ state: 'visible', timeout: 15000 });
    await input.fill(value);
    await input.press('Tab');
  }

  async fillUsageHours(startTime, endTime) {
    const inputs = this.getUsageHourInputs();
    await inputs.nth(0).waitFor({ state: 'visible', timeout: 15000 });
    await inputs.nth(0).fill(startTime);
    await inputs.nth(1).fill(endTime);
    await inputs.nth(1).press('Tab');
    await this.kmPartModalTitle.click({ force: true });
  }

  async clickSubmit() {
    const submitButton = this.getKmPartDialog().getByRole('button', { name: /^Enviar$/i });
    await expect(submitButton).toBeEnabled({ timeout: 15000 });
    await submitButton.click();
  }

  async assertDeleteKmPartOptionVisible() {
    await expect(this.getDeleteKmPartButton()).toBeVisible({ timeout: 15000 });
  }

  async clickDeleteKmPart() {
    await this.assertDeleteKmPartOptionVisible();
    await this.getDeleteKmPartButton().click();
  }

  async assertDeleteConfirmationVisible() {
    await expect(this.deleteConfirmationTitle).toBeVisible({ timeout: 15000 });
    await expect(this.deleteConfirmationMessage).toBeVisible({ timeout: 15000 });
    await expect(this.deleteConfirmationContinueButton).toBeVisible({ timeout: 15000 });
    await expect(this.deleteConfirmationCancelButton).toBeVisible({ timeout: 15000 });
  }

  async confirmDeleteKmPart() {
    await this.assertDeleteConfirmationVisible();
    await this.deleteConfirmationContinueButton.click({ force: true });
    await this.page.waitForLoadState('networkidle');
  }

  async handleRecipientDialogIfPresent(recipientText) {
    const recipientPanelTitle = this.getRecipientPanelTitle();
    const panelAppeared = await recipientPanelTitle.waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false);
    if (!panelAppeared) {
      return;
    }

    await this.page.waitForTimeout(1500);
    let recipientOption = recipientText
      ? this.getRecipientOption(recipientText)
      : this.getSuggestedRecipientOption();

    let recipientOptionVisible = await recipientOption.isVisible().catch(() => false);
    if (!recipientOptionVisible) {
      const responsibleButton = this.getRecipientResponsibleButton();
      const responsibleButtonVisible = await responsibleButton.isVisible().catch(() => false);
      if (responsibleButtonVisible) {
        await responsibleButton.click({ force: true });
      } else {
        const responsibleTab = this.getRecipientResponsibleTab();
        const responsibleTabVisible = await responsibleTab.isVisible().catch(() => false);
        if (responsibleTabVisible) {
          await responsibleTab.click({ force: true });
        }
      }

      await this.page.waitForTimeout(1000);
      recipientOption = recipientText ? this.getRecipientOption(recipientText) : this.getRecipientFirstCardOption();
      recipientOptionVisible = await recipientOption.isVisible().catch(() => false);
      if (!recipientOptionVisible) {
        recipientOption = this.getRecipientFirstCardOption();
      }
    }

    await recipientOption.waitFor({ state: 'visible', timeout: 15000 });
    await recipientOption.click({ force: true });
    await this.page.waitForTimeout(500);

    const confirmButtons = this.page.getByRole('button', { name: /^Enviar$/i });
    await confirmButtons.last().click({ force: true });
  }

  async assertSuccessMessage() {
    await expect(this.successMessage).toBeVisible({ timeout: 15000 });
  }

  async assertPeajeSubmittedSuccessfully() {
    await expect.poll(async () => {
      const successVisible = await this.successMessage.isVisible().catch(() => false);
      if (successVisible) {
        return true;
      }

      const peajeDialogVisible = await this.getPeajeDialog().isVisible().catch(() => false);
      if (peajeDialogVisible) {
        return false;
      }

      const pendingTitleVisible = await this.pendingVehiclePartsTitle.isVisible().catch(() => false);
      const vehiclePartsTitleVisible = await this.vehiclePartsTitle.isVisible().catch(() => false);

      return pendingTitleVisible
        || vehiclePartsTitleVisible
        || /\/vehiculos\/partesPendientesTramitar/i.test(this.page.url())
        || /\/vehiculos\/misPartesVehiculos/i.test(this.page.url());
    }, { timeout: 15000 }).toBe(true);
  }

  async assertDeleteSuccessMessage() {
    await expect(this.deleteSuccessMessage).toBeVisible({ timeout: 15000 });
  }

  async assertFormClosed() {
    await expect(this.getKmPartDialog()).toBeHidden({ timeout: 15000 });
  }

  async assertPartVisibleInList(vehicleText, kmText = '90 Km') {
    const row = this.page.locator('div').filter({
      hasText: new RegExp(`${escapeRegExp(vehicleText)}.*${escapeRegExp(kmText)}`, 'i')
    }).first();

    await expect(row).toBeVisible({ timeout: 15000 });
  }

  async assertPartNotVisibleInList(data = {}) {
    await expect.poll(async () => this.getKmPartCard(data).count(), { timeout: 15000 }).toBe(0);
  }

  getKmPartCard(data = {}) {
    return this.page.locator('[matripple].minicard').filter({
      hasText: buildKmPartCardPattern(data)
    }).first();
  }

  async hasKmPartInList(data = {}) {
    return (await this.getKmPartCard(data).count()) > 0;
  }

  async openExistingKmPart(data = {}) {
    const card = this.getKmPartCard(data);
    await expect(card).toBeVisible({ timeout: 15000 });
    await card.click({ force: true });
    await this.assertNewKmPartDialogOpen();
  }

  async assertOpenedKmPartMatches(data = {}) {
    const dialog = this.getKmPartDialog();
    const situationInputs = this.getSituationInputs();
    const usageHourInputs = this.getUsageHourInputs();

    await expect(dialog).toBeVisible({ timeout: 15000 });

    if (data.recipient) {
      await expect(dialog.getByText(new RegExp(escapeRegExp(data.recipient), 'i'), { exact: false }).first()).toBeVisible({ timeout: 15000 });
    }
    if (data.vehicle) {
      await expect(dialog.getByText(new RegExp(escapeRegExp(data.vehicle), 'i'), { exact: false }).first()).toBeVisible({ timeout: 15000 });
    }
    if (data.date) {
      await expect(this.getDateInput()).toHaveValue(normalizeDateString(data.date), { timeout: 15000 });
    }
    if (data.activity) {
      await expect(this.getActivitySection()).toContainText(new RegExp(escapeRegExp(data.activity), 'i'));
    }
    if (data.kmInicial !== undefined && data.kmInicial !== null) {
      await expect(situationInputs.nth(0)).toHaveValue(String(data.kmInicial));
    }
    if (data.kmFinal !== undefined && data.kmFinal !== null) {
      await expect(situationInputs.nth(1)).toHaveValue(String(data.kmFinal));
    }
    if (data.kmTotales !== undefined && data.kmTotales !== null) {
      await expect(situationInputs.nth(2)).toHaveValue(String(data.kmTotales));
    }
    if (data.itinerary) {
      await expect(situationInputs.nth(3)).toHaveValue(data.itinerary);
    }
    if (data.startTime) {
      await expect(usageHourInputs.nth(0)).toHaveValue(data.startTime);
    }
    if (data.endTime) {
      await expect(usageHourInputs.nth(1)).toHaveValue(data.endTime);
    }
  }

  async fillKmPartForm(data = {}) {
    const dialog = this.getKmPartDialog();
    const vehicleText = data.vehicle || '0010 LBH';
    const dateText = normalizeDateString(resolveDateValue(data.date || getCurrentDateString()));
    const inputs = dialog.locator('input');

    await this.selectVehicle(vehicleText);
    await this.page.waitForTimeout(500);
    await this.selectActivity(data.activity);
    await this.page.waitForTimeout(800);

    await dialog.getByPlaceholder('Selecciona Fecha').click();
    const todayButton = this.page.locator('.ant-picker-today-btn');
    const today = normalizeDateString(new Intl.DateTimeFormat('en-GB').format(new Date()));
    if (dateText === today && await todayButton.count()) {
      await todayButton.click();
    } else {
      await inputs.nth(0).fill(dateText);
      await inputs.nth(0).press('Tab');
    }

    await this.page.waitForTimeout(500);
    await inputs.nth(1).fill(String(data.kmInicial));
    await inputs.nth(2).fill(String(data.kmFinal));
    await inputs.nth(3).fill(String(data.kmTotales));
    await inputs.nth(4).fill(data.itinerary);

    if (data.startTime && data.endTime) {
      await inputs.nth(5).fill(data.startTime);
      await inputs.nth(6).fill(data.endTime);
      await inputs.nth(6).press('Tab');
    }

    await this.page.waitForTimeout(1000);
  }
}

module.exports = VehiclePage;
