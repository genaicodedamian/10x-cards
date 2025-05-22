import { type Page, type Locator, expect } from "@playwright/test";

export class SaveSetDialog {
  readonly page: Page;
  readonly dialogContainer: Locator;
  readonly setNameInput: Locator;
  readonly confirmSaveSetButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Zakładamy, że dialog jest już otwarty
    this.dialogContainer = page.locator('[data-testid="save-set-dialog"]');
    this.setNameInput = this.dialogContainer.locator('[data-testid="set-name-input"]');
    this.confirmSaveSetButton = this.dialogContainer.locator('[data-testid="confirm-save-set-button"]');
  }

  async fillSetName(setName: string) {
    await this.setNameInput.fill(setName);
    await this.setNameInput.blur();
  }

  async saveSet() {
    await this.confirmSaveSetButton.waitFor({ state: "visible", timeout: 5000 });
    await expect(this.confirmSaveSetButton).toBeEnabled({ timeout: 5000 });

    await this.confirmSaveSetButton.click();
    await this.dialogContainer.waitFor({ state: 'hidden', timeout: 5000 });
  }

  async isVisible() {
    return this.dialogContainer.isVisible();
  }
} 