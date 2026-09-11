const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const LoginPage = require('../src/pageobjects/LoginPage');
const { SIDO2_BASE_URL } = require('../src/config/env');

const specDir = path.join(__dirname, '../src/specs');

function loadSpec(specFileName) {
  const fullPath = path.join(specDir, specFileName);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function escapeRegExp(value) {
  return (value || '').toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getLocatorCandidates(locatorDefinition) {
  if (!locatorDefinition) {
    return [];
  }

  if (locatorDefinition.strategy) {
    return [locatorDefinition];
  }

  return [
    locatorDefinition.primary,
    ...(Array.isArray(locatorDefinition.fallbacks) ? locatorDefinition.fallbacks : [])
  ].filter(Boolean);
}

function locatorFromCandidate(page, candidate) {
  if (!candidate || !candidate.strategy) {
    return null;
  }

  if (candidate.strategy === 'css') {
    return page.locator(candidate.value).first();
  }
  if (candidate.strategy === 'role') {
    return page.getByRole(candidate.role, { name: new RegExp(escapeRegExp(candidate.name), 'i') }).first();
  }
  if (candidate.strategy === 'label') {
    return page.getByLabel(new RegExp(escapeRegExp(candidate.value), 'i')).first();
  }
  if (candidate.strategy === 'text') {
    return page.getByText(new RegExp(escapeRegExp(candidate.value), 'i'), { exact: false }).first();
  }
  if (candidate.strategy === 'placeholder') {
    return page.getByPlaceholder(candidate.value, { exact: false }).first();
  }

  return null;
}

async function resolveGeneratedLocator(page, locatorDefinition, description) {
  return resolveGeneratedLocatorWithOptions(page, locatorDefinition, description, {});
}

async function locatorIsEditable(locator) {
  return locator.evaluate((element) => {
    const tagName = element.tagName;
    const role = element.getAttribute('role');
    const contentEditable = element.getAttribute('contenteditable');
    const disabled = element.disabled || element.getAttribute('disabled') !== null || element.getAttribute('aria-disabled') === 'true';
    const readOnly = element.readOnly || element.getAttribute('readonly') !== null || element.getAttribute('aria-readonly') === 'true';

    if (disabled || readOnly) {
      return false;
    }

    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName)
      || contentEditable === 'true'
      || role === 'textbox'
      || role === 'combobox';
  });
}

async function resolveGeneratedLocatorWithOptions(page, locatorDefinition, description, options = {}) {
  const { requireEditable = false } = options;
  const candidates = getLocatorCandidates(locatorDefinition);
  for (const candidate of candidates) {
    if (requireEditable && candidate.strategy === 'text') {
      continue;
    }

    const locator = locatorFromCandidate(page, candidate);
    if (!locator) {
      continue;
    }

    const count = await locator.count();
    if (count > 0) {
      if (requireEditable) {
        const editable = await locatorIsEditable(locator).catch(() => false);
        if (!editable) {
          continue;
        }
      }
      return locator;
    }
  }

  throw new Error(`No se encontró un locator válido para: ${description}`);
}

async function runGeneratedAutomation(pageObject, scenario) {
  const page = pageObject.page;
  const automation = scenario.automation;

  for (const step of automation.steps || []) {
    if (step.type === 'login') {
      await pageObject.goto();
      if (typeof pageObject.assertLoginPageIsDisplayed === 'function') {
        await pageObject.assertLoginPageIsDisplayed();
      }
      await pageObject.login(step.username, step.password);
      continue;
    }

    if (step.type === 'invoke-page-object') {
      if (typeof pageObject[step.method] !== 'function') {
        throw new Error(`El page object no implementa el método ${step.method}`);
      }
      await pageObject[step.method]();
      continue;
    }

    if (step.type === 'click') {
      const locator = await resolveGeneratedLocator(page, step.locator, step.description || 'click');
      await locator.waitFor({ state: 'visible', timeout: 15000 });
      await locator.click();
      await page.waitForLoadState('networkidle');
      continue;
    }

    if (step.type === 'fill') {
      const locator = await resolveGeneratedLocatorWithOptions(page, step.locator, step.description || 'fill', { requireEditable: true });
      await locator.waitFor({ state: 'visible', timeout: 15000 });
      await locator.fill(step.value);
      continue;
    }

    if (step.type === 'assert-visible') {
      const locator = await resolveGeneratedLocator(page, step.locator, step.description || 'assert-visible');
      await expect(locator).toBeVisible({ timeout: 15000 });
      continue;
    }

    throw new Error(`Unsupported generated automation step: ${step.type}`);
  }
}

async function runStructuredScenarioFallback(pageObject, scenario) {
  const page = pageObject.page;
  const whenText = (scenario.when || '').toLowerCase();
  const thenText = (scenario.then || '').toLowerCase();

  if (whenText.includes('nuevo repostaje') || whenText.includes('repostaje')) {
    const button = page.getByRole('button', { name: /Nuevo Repostaje/i });
    await button.waitFor({ state: 'visible', timeout: 15000 });
    await button.click();
    await page.waitForLoadState('networkidle');

    const expectedModal = page.getByText(/parte de repostaje|repostaje/i, { exact: false }).first();
    await expectedModal.waitFor({ state: 'visible', timeout: 15000 });
    await expectedModal.scrollIntoViewIfNeeded();
    return;
  }

  if (whenText.includes('nuevo peaje') || whenText.includes('peaje')) {
    const button = page.getByRole('button', { name: /Nuevo Peaje/i });
    await button.waitFor({ state: 'visible', timeout: 15000 });
    await button.click();
    await page.waitForLoadState('networkidle');

    const expectedModal = page.getByText(/parte de peaje|peaje/i, { exact: false }).first();
    await expectedModal.waitFor({ state: 'visible', timeout: 15000 });
    await expectedModal.scrollIntoViewIfNeeded();
    return;
  }

  if (whenText.includes('mis partes de vehiculos') || whenText.includes('vehiculo') || whenText.includes('vehículos')) {
    if (typeof pageObject.navigateToVehicleParts === 'function') {
      await pageObject.navigateToVehicleParts();
      return;
    }
    const menuLink = page.locator('[href="/null"]').first();
    await menuLink.waitFor({ state: 'visible', timeout: 15000 });
    await menuLink.click();
    const menuItem = page.getByText(/Mis Partes de Vehículos/i, { exact: false }).first();
    await menuItem.waitFor({ state: 'visible', timeout: 15000 });
    return;
  }

  if (whenText.includes('nuevo parte km') || whenText.includes('parte de kilometro') || whenText.includes('parte de kilómetros')) {
    if (typeof pageObject.openNewKmPartDialog === 'function') {
      await pageObject.openNewKmPartDialog();
      return;
    }
    const triggerButton = page.getByRole('button', { name: /Nuevo Parte Km/i });
    await triggerButton.waitFor({ state: 'visible', timeout: 15000 });
    await triggerButton.click();
    const modalTitle = page.getByText(/Parte de Kilómetros|Parte de Kilometros/i, { exact: false }).first();
    await modalTitle.waitFor({ state: 'visible', timeout: 15000 });
    return;
  }

  if (whenText.includes('sin contraseña') || whenText.includes('sin password') || whenText.includes('contraseña') && whenText.includes('vac')) {
    await pageObject.goto();
    await pageObject.ensureLoggedOut();
    await pageObject.loginWithoutPassword(scenario.given?.username || 'hmonreal');
    await pageObject.assertPasswordFieldMarkedInvalid();
    return;
  }

  if (whenText.includes('logout') || whenText.includes('deslogue')) {
    if (typeof pageObject.clickLogout === 'function') {
      await pageObject.expectSuccessfulLogin();
      await pageObject.clickLogout();
      return;
    }
  }

  if (thenText.includes('ventana') || thenText.includes('popup') || thenText.includes('modal')) {
    const candidateText = page.getByText(/repostaje|parte de repostaje|peaje|parte de peaje|ventana|modal/i, { exact: false }).first();
    await candidateText.waitFor({ state: 'visible', timeout: 15000 });
    return;
  }

  throw new Error(`No generic fallback step available for scenario: ${scenario.name || scenario.action || 'unknown action'}`);
}

function registerFeatureTests(specFileName, steps = {}, PageObjectClass = LoginPage) {
  const spec = loadSpec(specFileName);

  for (const scenario of spec.scenarios) {
    test(`${spec.feature || specFileName} - ${scenario.name}`, async ({ page }) => {
      const pageObject = new PageObjectClass(page, SIDO2_BASE_URL);
      const action = scenario.action || 'login';
      const step = steps[action];

      if (scenario.automation && Array.isArray(scenario.automation.steps) && scenario.automation.steps.length) {
        await runGeneratedAutomation(pageObject, scenario);
        return;
      }

      if (step) {
        await step(pageObject, scenario);
        return;
      }

      if (scenario.when || scenario.then) {
        await runStructuredScenarioFallback(pageObject, scenario);
        return;
      }

      throw new Error(`No reusable step mapped for action: ${action}`);
    });
  }
}

module.exports = { registerFeatureTests, runStructuredScenarioFallback };
