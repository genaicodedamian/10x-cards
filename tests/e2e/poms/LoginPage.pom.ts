import { type Page, type Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator("#email");
    this.passwordInput = page.locator("#password");
    this.loginButton = page.locator('button[type="submit"]:has-text("Zaloguj się")');
  }

  async goto() {
    await this.page.goto("/login"); // Lub inna ścieżka do logowania
  }

  async login(email: string, password?: string) {
    if (!password) {
      throw new Error("Password is required for login.");
    }
    await this.emailInput.waitFor({ state: "visible", timeout: 5000 });
    await this.emailInput.fill(email);

    await this.passwordInput.waitFor({ state: "visible", timeout: 5000 });
    await this.passwordInput.fill(password);

    await this.loginButton.click();
  }
}
