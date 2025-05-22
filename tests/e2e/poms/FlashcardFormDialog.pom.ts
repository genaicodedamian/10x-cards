import { type Page, type Locator, expect } from "@playwright/test";

export class FlashcardFormDialog {
  readonly page: Page;
  readonly dialogContainer: Locator;
  readonly frontInput: Locator;
  readonly backInput: Locator;
  readonly saveFlashcardButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Zakładamy, że dialog jest już otwarty, więc lokalizujemy wewnątrz niego
    this.dialogContainer = page.locator('[data-testid="flashcard-form-dialog"]');
    this.frontInput = this.dialogContainer.locator('[data-testid="flashcard-front-input"]');
    this.backInput = this.dialogContainer.locator('[data-testid="flashcard-back-input"]');
    this.saveFlashcardButton = this.dialogContainer.locator('[data-testid="save-flashcard-button"]');
  }

  async fillFlashcard(front: string, back: string) {
    await this.frontInput.fill(front);
    await this.frontInput.blur();
    await this.backInput.fill(back);
    await this.backInput.blur();
  }

  async saveFlashcard() {
    await this.saveFlashcardButton.waitFor({ state: "visible", timeout: 5000 });
    await expect(this.saveFlashcardButton).toBeEnabled({ timeout: 5000 });

    await this.saveFlashcardButton.click();
    await this.dialogContainer.waitFor({ state: 'hidden', timeout: 5000 });
  }

  async isVisible() {
    return this.dialogContainer.isVisible();
  }
} 