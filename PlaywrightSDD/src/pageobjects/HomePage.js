const { expect } = require('@playwright/test');
const LoginPage = require('./LoginPage');

const HOME_MONTH_PATTERN = /^(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)\s+\d{4}$/i;
const SPANISH_MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

function getCurrentMonthLabel(date = new Date()) {
  return `${SPANISH_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function getNextMonthLabel(monthLabel) {
  const match = String(monthLabel || '').trim().match(/^([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s+(\d{4})$/);
  if (!match) {
    throw new Error(`No se pudo interpretar el mes visible de home: ${monthLabel}`);
  }

  const monthIndex = SPANISH_MONTHS.findIndex((month) => month.toLowerCase() === match[1].toLowerCase());
  if (monthIndex === -1) {
    throw new Error(`Mes no soportado en home: ${monthLabel}`);
  }

  const nextMonthIndex = (monthIndex + 1) % SPANISH_MONTHS.length;
  const year = Number(match[2]) + (nextMonthIndex === 0 ? 1 : 0);
  return `${SPANISH_MONTHS[nextMonthIndex]} ${year}`;
}

function getPreviousMonthLabel(monthLabel) {
  const match = String(monthLabel || '').trim().match(/^([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s+(\d{4})$/);
  if (!match) {
    throw new Error(`No se pudo interpretar el mes visible de home: ${monthLabel}`);
  }

  const monthIndex = SPANISH_MONTHS.findIndex((month) => month.toLowerCase() === match[1].toLowerCase());
  if (monthIndex === -1) {
    throw new Error(`Mes no soportado en home: ${monthLabel}`);
  }

  const previousMonthIndex = (monthIndex - 1 + SPANISH_MONTHS.length) % SPANISH_MONTHS.length;
  const year = Number(match[2]) - (monthIndex === 0 ? 1 : 0);
  return `${SPANISH_MONTHS[previousMonthIndex]} ${year}`;
}

function monthListsAreEqual(left = [], right = []) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeVisibleText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function parseActuationCodeAndName(value) {
  const normalizedValue = String(value || '').replace(/\s+/g, ' ').trim();
  const match = normalizedValue.match(/(\d{7})\s*-\s*(.+)$/);
  if (!match) {
    throw new Error(`No se pudo interpretar la actuación seleccionada: ${value}`);
  }

  return {
    code: match[1],
    name: match[2].trim()
  };
}

class HomePage extends LoginPage {
  constructor(page, baseURL) {
    super(page, baseURL);
    this.monthlyQuadrantDialog = page.getByRole('dialog').filter({ hasText: /Cuadrante Mensual/i }).first();
    this.monthlyQuadrantOpenButtons = page.getByRole('button', { name: /Abrir Cuadrante/i });
    this.monthlyQuadrantCapturedDataTab = this.monthlyQuadrantDialog.getByText(/^Datos Capturados$/i).first();
    this.monthlyQuadrantWorkdayScheduleTab = this.monthlyQuadrantDialog.getByText(/^Horario Jornada$/i).first();
    this.monthlyQuadrantWorkdayScheduleMessage = this.monthlyQuadrantDialog
      .getByText(/Jornada realizada seg[uú]n los fichajes/i, { exact: false })
      .first();
    this.monthlyQuadrantNewActuationButton = this.monthlyQuadrantDialog.getByRole('button', { name: /Nueva Actuaci[oó]n|Nueva Actuacion/i }).first();
    this.userProfileTrigger = page.locator('div[matripple].d-flex.flex-row').filter({
      has: page.locator('img[src*="avatar_white.png"]')
    }).first();
    this.userInfoDrawer = page.locator('.ant-drawer.ant-drawer-open').first();
    this.userInfoCalendarButton = page.locator('.ant-drawer.ant-drawer-open button:has(i.fas.fa-calendar-alt)').first();
    this.previousHomeMonthsButton = page.locator('i.fas.fa-chevron-left').locator('..').first();
    this.nextHomeMonthsButton = page.locator('i.fas.fa-chevron-right').locator('..').first();
    this.homeMonthsCarousel = this.nextHomeMonthsButton.locator('..');
  }

  async openCurrentMonthQuadrant() {
    await this.assertHomeMonthsAreVisible();
    const currentMonthLabel = getCurrentMonthLabel();
    const visibleMonths = await this.getVisibleMonthLabels();
    const currentMonthIndex = visibleMonths.findIndex((monthLabel) => monthLabel.toLowerCase() === currentMonthLabel.toLowerCase());

    if (currentMonthIndex === -1) {
      throw new Error(
        `No se encontró el mes actual (${currentMonthLabel}) entre los meses visibles de home: ${visibleMonths.join(', ')}`
      );
    }

    const openCurrentMonthQuadrantButton = this.monthlyQuadrantOpenButtons.nth(currentMonthIndex);
    await openCurrentMonthQuadrantButton.waitFor({ state: 'visible', timeout: 20000 });
    await openCurrentMonthQuadrantButton.click({ force: true });
    await this.page.waitForLoadState('networkidle');
  }

  async assertMonthlyQuadrantDialogOpen() {
    await expect(this.monthlyQuadrantDialog).toBeVisible({ timeout: 20000 });
    await expect(this.page.getByText(/Cuadrante Mensual/i, { exact: false }).first()).toBeVisible({ timeout: 20000 });
  }

  async openWorkdayScheduleFromCurrentMonthQuadrant() {
    await this.openCurrentMonthQuadrant();
    await this.assertMonthlyQuadrantDialogOpen();
    await this.monthlyQuadrantWorkdayScheduleTab.waitFor({ state: 'visible', timeout: 20000 });
    await this.monthlyQuadrantWorkdayScheduleTab.click();
  }

  async assertWorkdayScheduleMessageVisible() {
    await expect(this.monthlyQuadrantWorkdayScheduleMessage).toBeVisible({ timeout: 20000 });
  }

  async assertWorkdayScheduleCanBeOpenedFromCurrentMonthQuadrant() {
    await this.openWorkdayScheduleFromCurrentMonthQuadrant();
    await this.assertWorkdayScheduleMessageVisible();
  }

  getNewActuationDrawer() {
    return this.page.locator('app-selector-actuaciones-planificar-empleado-tragsatec').first();
  }

  getNewActuationOptionRows() {
    return this.getNewActuationDrawer()
      .locator('div.d-flex.flex-row.align-items-center')
      .filter({ has: this.page.locator('label.ant-checkbox-wrapper') });
  }

  async openCapturedDataTab() {
    await this.monthlyQuadrantCapturedDataTab.waitFor({ state: 'visible', timeout: 20000 });
    await this.monthlyQuadrantCapturedDataTab.click();
  }

  async getActuationDetailEntries() {
    return this.monthlyQuadrantDialog.evaluate((dialogNode) => {
      const headingNode = Array.from(dialogNode.querySelectorAll('div, span, p'))
        .find((node) => /^Detalle por Actuaci[oó]n\s*\(\d+\)$/i.test((node.textContent || '').trim()));

      if (!headingNode || !headingNode.parentElement) {
        throw new Error('No se encontró la sección "Detalle por Actuación" en el cuadrante mensual');
      }

      const paragraphs = Array.from(headingNode.parentElement.querySelectorAll('p'))
        .map((node) => (node.textContent || '').replace(/"/g, '').trim())
        .filter(Boolean);

      const entries = [];
      for (let index = 0; index < paragraphs.length - 1; index += 1) {
        if (/^\d{7}$/.test(paragraphs[index])) {
          entries.push({
            code: paragraphs[index],
            name: paragraphs[index + 1]
          });
        }
      }

      return entries;
    });
  }

  async openNewActuationDrawer() {
    await this.monthlyQuadrantNewActuationButton.waitFor({ state: 'visible', timeout: 20000 });
    await this.monthlyQuadrantNewActuationButton.click();
    await this.getNewActuationDrawer().waitFor({ state: 'visible', timeout: 20000 });
  }

  async selectAllActuationsInDrawer() {
    const drawer = this.getNewActuationDrawer();
    const allOption = drawer.getByText(/^Todas$/i).first();
    await allOption.waitFor({ state: 'visible', timeout: 20000 });
    await allOption.click();
  }

  async selectFirstActuationFromDrawer(existingDetailEntries = []) {
    const optionRows = this.getNewActuationOptionRows();
    await optionRows.first().waitFor({ state: 'visible', timeout: 20000 });

    const optionCount = await optionRows.count();
    for (let index = 0; index < optionCount; index += 1) {
      const optionRow = optionRows.nth(index);
      const optionSummary = await optionRow.evaluate((rowNode) => {
        const paragraphs = Array.from(rowNode.querySelectorAll('p'))
          .map((node) => (node.textContent || '').trim())
          .filter(Boolean);

        return {
          title: paragraphs[0] || '',
          description: paragraphs[1] || ''
        };
      });

      const selectedActuation = parseActuationCodeAndName(optionSummary.description);
      if (this.countActuationOccurrences(existingDetailEntries, selectedActuation) > 0) {
        continue;
      }

      const checkbox = optionRow.locator('label.ant-checkbox-wrapper').first();
      await checkbox.waitFor({ state: 'visible', timeout: 20000 });
      await checkbox.click();

      return {
        ...selectedActuation,
        title: optionSummary.title
      };
    }

    throw new Error('No se encontró una actuación nueva disponible en la lista "Todas"');
  }

  async continueNewActuationSelection() {
    const continueButton = this.getNewActuationDrawer().getByRole('button', { name: /^Continuar$/i }).first();
    await continueButton.waitFor({ state: 'visible', timeout: 20000 });
    await continueButton.click();
  }

  async confirmNewActuationSelection() {
    const confirmButton = this.getNewActuationDrawer().getByRole('button', { name: /^Confirmar$/i }).first();
    await confirmButton.waitFor({ state: 'visible', timeout: 20000 });
    await confirmButton.click();
    await this.getNewActuationDrawer().waitFor({ state: 'hidden', timeout: 20000 });
  }

  countActuationOccurrences(entries, targetActuation) {
    const targetCode = normalizeVisibleText(targetActuation.code);
    const targetName = normalizeVisibleText(targetActuation.name);

    return entries.filter((entry) => {
      return normalizeVisibleText(entry.code) === targetCode
        && normalizeVisibleText(entry.name) === targetName;
    }).length;
  }

  async createNewActuationFromCurrentMonthQuadrant() {
    await this.openCurrentMonthQuadrant();
    await this.assertMonthlyQuadrantDialogOpen();
    await this.openCapturedDataTab();

    const detailEntriesBefore = await this.getActuationDetailEntries();

    await this.openNewActuationDrawer();
    await this.selectAllActuationsInDrawer();
    const selectedActuation = await this.selectFirstActuationFromDrawer(detailEntriesBefore);
    await this.continueNewActuationSelection();
    await this.confirmNewActuationSelection();
    await this.openCapturedDataTab();

    const expectedOccurrencesAfter = this.countActuationOccurrences(detailEntriesBefore, selectedActuation) + 1;

    await expect.poll(async () => {
      const detailEntriesAfter = await this.getActuationDetailEntries();
      return {
        totalEntries: detailEntriesAfter.length,
        matchingEntries: this.countActuationOccurrences(detailEntriesAfter, selectedActuation)
      };
    }, {
      timeout: 20000,
      message: `La actuación ${selectedActuation.code} - ${selectedActuation.name} no apareció en el detalle del cuadrante`
    }).toEqual({
      totalEntries: detailEntriesBefore.length + 1,
      matchingEntries: expectedOccurrencesAfter
    });
  }

  async assertNewActuationCanBeCreatedFromCurrentMonthQuadrant() {
    await this.createNewActuationFromCurrentMonthQuadrant();
  }

  async getHeaderUserName() {
    return (await this.userProfileTrigger
      .locator('div')
      .filter({ hasText: /.+/ })
      .last()
      .innerText()).trim();
  }

  async openUserInfoDrawer() {
    await this.userProfileTrigger.waitFor({ state: 'visible', timeout: 20000 });
    await this.userProfileTrigger.click();
  }

  async assertUserInfoDrawerOpen() {
    const currentUserName = await this.getHeaderUserName();
    const expectedUserName = currentUserName.toUpperCase();

    await expect(this.userInfoDrawer).toBeVisible({ timeout: 20000 });
    await expect(this.userInfoDrawer.getByText(/Empleado Tragsatec/i)).toBeVisible({ timeout: 20000 });
    await expect(this.userInfoDrawer.getByText(new RegExp(escapeRegExp(expectedUserName), 'i'))).toBeVisible({ timeout: 20000 });
    await expect(this.userInfoDrawer.getByText(/Contrato Actual/i)).toBeVisible({ timeout: 20000 });
    await expect(this.userInfoDrawer.getByText(/Información de Contacto y Residencia Laboral/i)).toBeVisible({ timeout: 20000 });
  }

  async openUserMonthlyQuadrantFromDrawer() {
    await this.assertUserInfoDrawerOpen();
    await this.userInfoCalendarButton.waitFor({ state: 'visible', timeout: 20000 });
    await this.userInfoCalendarButton.click();
  }

  async assertUserMonthlyQuadrantOpenedFromDrawer() {
    const currentUserName = await this.getHeaderUserName();

    await expect(this.monthlyQuadrantDialog).toBeVisible({ timeout: 20000 });
    await expect(this.monthlyQuadrantDialog.getByText(/Cuadrante Mensual de/i)).toBeVisible({ timeout: 20000 });
    await expect(this.monthlyQuadrantDialog.getByText(new RegExp(escapeRegExp(currentUserName), 'i'))).toBeVisible({ timeout: 20000 });
    await expect(this.monthlyQuadrantDialog.getByText(/Datos Capturados/i)).toBeVisible({ timeout: 20000 });
  }

  async getVisibleMonthLabels() {
    const monthLabels = await this.homeMonthsCarousel.evaluate((carouselNode, patternSource) => {
      const pattern = new RegExp(patternSource, 'i');
      return Array.from(carouselNode.children)
        .filter((child) => (child.getAttribute('style') || '').includes('cursor: pointer'))
        .map((child) => {
          const titleNode = Array.from(child.querySelectorAll('div'))
            .find((node) => pattern.test((node.textContent || '').trim()));
          return (titleNode?.textContent || '').trim();
        })
        .filter((text) => pattern.test(text));
    }, HOME_MONTH_PATTERN.source);

    return monthLabels;
  }

  async assertHomeMonthsAreVisible() {
    await expect.poll(async () => this.getVisibleMonthLabels(), {
      timeout: 20000,
      message: 'No se han encontrado los meses visibles del carrusel de home'
    }).toHaveLength(3);
  }

  async advanceHomeMonths() {
    await this.nextHomeMonthsButton.waitFor({ state: 'visible', timeout: 20000 });
    await this.nextHomeMonthsButton.click();
  }

  async goBackHomeMonths() {
    await this.previousHomeMonthsButton.waitFor({ state: 'visible', timeout: 20000 });
    await this.previousHomeMonthsButton.click();
  }

  async waitForVisibleMonthsToAdvance(visibleMonthsBefore, expectedMonthsAfter) {
    const deadline = Date.now() + 20000;
    let currentMonths = await this.getVisibleMonthLabels();

    while (Date.now() < deadline) {
      currentMonths = await this.getVisibleMonthLabels();
      if (
        !monthListsAreEqual(currentMonths, visibleMonthsBefore)
        && monthListsAreEqual(currentMonths, expectedMonthsAfter)
      ) {
        return currentMonths;
      }

      await this.page.waitForTimeout(250);
    }

    throw new Error(
      `Los meses visibles no avanzaron correctamente. Antes: ${visibleMonthsBefore.join(', ')}. ` +
      `Después: ${currentMonths.join(', ')}. Esperado: ${expectedMonthsAfter.join(', ')}`
    );
  }

  async assertHomeMonthsAdvanceAfterNextClick() {
    await this.assertHomeMonthsAreVisible();
    const visibleMonthsBefore = await this.getVisibleMonthLabels();
    const expectedMonthsAfter = [
      visibleMonthsBefore[1],
      visibleMonthsBefore[2],
      getNextMonthLabel(visibleMonthsBefore[2])
    ];
    await this.advanceHomeMonths();
    const visibleMonthsAfter = await this.waitForVisibleMonthsToAdvance(visibleMonthsBefore, expectedMonthsAfter);

    expect(visibleMonthsAfter).toEqual(expectedMonthsAfter);
    expect(visibleMonthsAfter).not.toEqual(visibleMonthsBefore);
  }

  async assertHomeMonthsGoBackAfterPreviousClick() {
    await this.assertHomeMonthsAreVisible();
    const visibleMonthsBefore = await this.getVisibleMonthLabels();
    const expectedMonthsAfter = [
      getPreviousMonthLabel(visibleMonthsBefore[0]),
      visibleMonthsBefore[0],
      visibleMonthsBefore[1]
    ];

    await this.goBackHomeMonths();
    const visibleMonthsAfter = await this.waitForVisibleMonthsToAdvance(visibleMonthsBefore, expectedMonthsAfter);

    expect(visibleMonthsAfter).toEqual(expectedMonthsAfter);
    expect(visibleMonthsAfter).not.toEqual(visibleMonthsBefore);
  }

  async assertUserInfoCanBeOpenedFromHome() {
    await this.openUserInfoDrawer();
    await this.assertUserInfoDrawerOpen();
  }

  async assertUserMonthlyQuadrantCanBeOpenedFromHomeUserDrawer() {
    await this.openUserInfoDrawer();
    await this.openUserMonthlyQuadrantFromDrawer();
    await this.assertUserMonthlyQuadrantOpenedFromDrawer();
  }
}

module.exports = HomePage;
