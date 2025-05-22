import { type Page, type Locator } from "@playwright/test";

export class CreateManualPage {
  readonly page: Page;
  readonly createNewFlashcardButton: Locator;
  readonly saveSetButton: Locator;
  readonly successModalOkButton: Locator; // Dodane dla modalu sukcesu

  constructor(page: Page) {
    this.page = page;
    this.createNewFlashcardButton = page.locator('[data-testid="create-new-flashcard-button"]');
    this.saveSetButton = page.locator('[data-testid="save-set-button"]');
    this.successModalOkButton = page.locator('[data-testid="success-modal-ok-button"]');
  }

  async goto() {
    await this.page.goto("/create-manual");
  }

  async openFlashcardForm() {
    await this.createNewFlashcardButton.click();
  }

  async openSaveSetDialog() {
    await this.saveSetButton.click();
  }

  async confirmSuccess() {
    await this.page.waitForSelector('[data-testid="success-modal-ok-button"]', { state: 'visible', timeout: 5000 });
    await this.successModalOkButton.click();
  }
} 