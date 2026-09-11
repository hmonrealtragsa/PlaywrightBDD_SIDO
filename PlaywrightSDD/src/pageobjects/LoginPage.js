const { expect } = require('@playwright/test');

class LoginPage {
  constructor(page, baseURL) {
    this.page = page;
    this.baseURL = baseURL;
    this.userNameInput = page.locator('[formcontrolname="usuario"]');
    this.passwordInput = page.getByPlaceholder('Contraseña', { exact: true });
    this.loginTitle = page.getByText('Acceso al Sistema', { exact: true });
    this.accessButton = page.locator('button').filter({ hasText: /^Acceder$/ });
    this.logoutButton = page.locator('[matripple]:has(i.fa-sign-out-alt)');
    this.siteTitle = page.getByText(/S\s*I\s*D\s*O\s*2/, { exact: true });
    this.warningMessage = page.locator('div.animated.fast.fadeIn.ng-star-inserted').filter({ hasText: 'Usuario y contraseña no válidos' });
  }

  async goto() {
    await this.page.goto(this.baseURL, { waitUntil: 'domcontentloaded' });
  }

  async login(username, password) {
    await this.loginTitle.waitFor({ state: 'visible', timeout: 15000 });
    await this.userNameInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.userNameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.accessButton.waitFor({ state: 'visible', timeout: 15000 });
    await this.accessButton.click({ force: true });
    await this.page.waitForURL(/home|inicio|index/i, { timeout: 20000 }).catch(() => null);
    await this.page.waitForLoadState('networkidle');
  }

  async loginWithoutPassword(username) {
    await this.loginTitle.waitFor({ state: 'visible', timeout: 15000 });
    await this.userNameInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.userNameInput.fill(username);
    await this.passwordInput.fill('');
    await this.accessButton.waitFor({ state: 'visible', timeout: 15000 });
    await this.accessButton.click({ force: true });
    await this.page.waitForLoadState('networkidle');
  }

  async ensureLoggedOut() {
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.page.goto(this.baseURL, { waitUntil: 'domcontentloaded' });
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(1000);

      const loginVisible = await this.loginTitle.isVisible().catch(() => false);
      if (loginVisible) {
        return;
      }

      const logoutVisible = await this.logoutButton.isVisible().catch(() => false);
      if (logoutVisible) {
        await this.clickLogout();
        await this.page.waitForTimeout(1000);
        const loginNowVisible = await this.loginTitle.isVisible().catch(() => false);
        if (loginNowVisible) {
          return;
        }
      }
    }

    await this.assertLoginPageIsDisplayed();
  }

  async assertLoginPageIsDisplayed() {
    await expect(this.loginTitle).toBeVisible({ timeout: 15000 });
    await expect(this.userNameInput).toBeVisible({ timeout: 15000 });
    await expect(this.passwordInput).toBeVisible({ timeout: 15000 });
    await expect(this.accessButton).toBeVisible({ timeout: 15000 });
  }

  async expectSuccessfulLogin() {
    await expect(this.siteTitle).toBeVisible();
    await expect(this.logoutButton).toBeVisible();
  }

  async clickLogout() {
    await this.logoutButton.waitFor({ state: 'visible', timeout: 15000 });
    await this.logoutButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async assertInvalidCredentialsWarning() {
    await expect(this.warningMessage).toBeVisible({ timeout: 15000 });
  }

  async assertPasswordFieldMarkedInvalid() {
    await this.passwordInput.waitFor({ state: 'visible', timeout: 15000 });
    const className = await this.passwordInput.getAttribute('class');
    const ariaInvalid = await this.passwordInput.getAttribute('aria-invalid');
    const invalidClass = /(ng-invalid|invalid|is-invalid|error)/i.test(className || '');
    const invalidAttribute = ariaInvalid === 'true';

    expect(invalidClass || invalidAttribute).toBeTruthy();
  }

}

module.exports = LoginPage;
