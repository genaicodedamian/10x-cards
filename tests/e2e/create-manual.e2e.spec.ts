import { test, expect } from "@playwright/test";
import { LoginPage } from "./poms/LoginPage.pom";
import { CreateManualPage } from "./poms/CreateManualPage.pom";
import { FlashcardFormDialog } from "./poms/FlashcardFormDialog.pom";
import { SaveSetDialog } from "./poms/SaveSetDialog.pom";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types"; // Zakładając, że typy bazy są w tej lokalizacji

// Inicjalizacja klienta Supabase poza blokiem test, aby był dostępny globalnie w tym pliku
// Zmienne środowiskowe powinny być już załadowane przez dotenv w playwright.config.ts
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is not defined in .env.test. Make sure they are set.");
}

const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseAnonKey);

test.describe("Manual Flashcard Set Creation E2E", () => {
  let loginPage: LoginPage;
  let createManualPage: CreateManualPage;
  let flashcardFormDialog: FlashcardFormDialog;
  let saveSetDialog: SaveSetDialog;
  const timestamp = Date.now();
  const flashcardFront = `test-front-${timestamp}`;
  const flashcardBack = `test-back-${timestamp}`;
  const setName = `Test-set-${timestamp}`;
  let createdSetId: string | null = null;

  test.beforeAll(async () => {
    // Logowanie użytkownika E2E w Supabase client dla operacji na bazie (np. teardown)
    // Używamy kluczy z .env.test, więc operacje powinny być na bazie testowej
    const e2eUsername = process.env.E2E_USERNAME;
    const e2ePassword = process.env.E2E_PASSWORD;

    if (!e2eUsername || !e2ePassword) {
      throw new Error("E2E username or password not defined in .env.test");
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: e2eUsername,
      password: e2ePassword,
    });

    if (signInError) {
      console.error("Error signing in to Supabase for E2E:", signInError);
      throw signInError;
    }
    console.log("Successfully signed in to Supabase for E2E setup/teardown.");
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    createManualPage = new CreateManualPage(page);
    flashcardFormDialog = new FlashcardFormDialog(page);
    saveSetDialog = new SaveSetDialog(page);

    // Logowanie przez UI
    await loginPage.goto();
    // Używamy zmiennych środowiskowych dla E2E_USERNAME i E2E_PASSWORD
    const e2eUsername = process.env.E2E_USERNAME;
    const e2ePassword = process.env.E2E_PASSWORD;
    if (!e2eUsername || !e2ePassword) {
      throw new Error("E2E_USERNAME or E2E_PASSWORD not defined in environment variables.");
    }
    await loginPage.login(e2eUsername, e2ePassword);

    // Sprawdź, czy nie ma widocznego komunikatu o błędzie logowania na stronie
    // (zakładając, że błędy są wyświetlane w elemencie p z klasą text-red-500)
    const loginErrorMessages = page.locator("p.text-red-500");
    await expect(loginErrorMessages).toHaveCount(0, { timeout: 5000 }); // Oczekuj, że nie ma takich elementów lub są ukryte

    // Upewnij się, że logowanie zakończyło się sukcesem, np. przez sprawdzenie URL lub elementu na stronie dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should allow a user to create a new flashcard set manually", async ({ page }) => {
    // 1. Otwórz widok '/create-manual'
    await createManualPage.goto();
    await expect(page).toHaveURL(/.*create-manual/);
    await expect(page.locator('[data-testid="create-manual-view"]')).toBeVisible();

    // 2. Kliknij w button "+Stwórz nową fiszkę"
    await createManualPage.openFlashcardForm();
    await expect(flashcardFormDialog.isVisible()).resolves.toBe(true);

    // 3. Stwórz fiszkę
    await flashcardFormDialog.fillFlashcard(flashcardFront, flashcardBack);

    // 4. Kliknij w button "Zapisz fiszkę"
    await flashcardFormDialog.saveFlashcard();
    await expect(flashcardFormDialog.isVisible()).resolves.toBe(false); // Dialog powinien się zamknąć

    // Dodatkowa weryfikacja: sprawdź, czy fiszka pojawiła się na liście tymczasowej (jeśli jest taki element)
    // await expect(page.locator(`text=${flashcardFront}`)).toBeVisible();

    // 5. Kliknij w button "Zapisz zestaw fiszek"
    await createManualPage.openSaveSetDialog();
    await expect(saveSetDialog.isVisible()).resolves.toBe(true);

    // 6. Wpisz w modalu Nazwę zestawu i kliknij button "Zapisz zestaw"
    await saveSetDialog.fillSetName(setName);
    await saveSetDialog.saveSet();
    await expect(saveSetDialog.isVisible()).resolves.toBe(false); // Dialog powinien się zamknąć

    // Poczekaj na modal sukcesu i potwierdź
    await createManualPage.confirmSuccess();

    // Użytkownik powinien zostać przekierowany na dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // await page.pause(); // PAUZA USUNIĘTA LUB ZAKOMENTOWANA

    await expect(page.locator('h1:has-text("Witaj, test!")')).toBeVisible(); // Sprawdzenie nagłówka na dashboardzie

    // 7. Potwierdź poprawne zapisanie zestawu w db
    // To jest uproszczona weryfikacja. W idealnym świecie pobralibyśmy ID zestawu
    // i sprawdzili jego zawartość oraz powiązane fiszki.
    // Tutaj zakładamy, że jeśli nie ma błędu, to zestaw został utworzony.
    // Aby uzyskać ID, potrzebowalibyśmy go np. z URL po przekierowaniu lub z odpowiedzi API (jeśli testujemy API)
    // Na potrzeby tego testu, spróbujemy znaleźć zestaw po nazwie i użytkowniku.
    const { data: userSession } = await supabase.auth.getSession();
    const userId = userSession?.session?.user?.id;
    if (!userId) {
      throw new Error("User not logged in for DB check or session expired.");
    }

    const { data: sets, error: fetchError } = await supabase
      .from("flashcard_sets")
      .select("id, name")
      .eq("name", setName)
      .eq("user_id", userId) // Upewnij się, że to pole istnieje i jest poprawne
      .single(); // Oczekujemy jednego zestawu o tej nazwie dla tego użytkownika

    expect(fetchError).toBeNull();
    expect(sets).not.toBeNull();
    expect(sets?.name).toBe(setName);
    if (sets?.id) {
      createdSetId = sets.id; // Zapisz ID do teardown
    }
    console.log(`Created set with ID: ${createdSetId} and name: ${setName}`);
  });

  test.afterAll(async () => {
    if (createdSetId) {
      console.log(`Attempting to delete flashcards for set ID: ${createdSetId}`);
      const { error: deleteFlashcardsError } = await supabase.from("flashcards").delete().eq("set_id", createdSetId);

      if (deleteFlashcardsError) {
        console.error(`Error deleting flashcards for set ${createdSetId}:`, deleteFlashcardsError);
      } else {
        console.log(`Successfully deleted flashcards for set ID: ${createdSetId}`);
      }

      console.log(`Attempting to delete set with ID: ${createdSetId}`);
      const { error: deleteSetError } = await supabase.from("flashcard_sets").delete().eq("id", createdSetId);

      if (deleteSetError) {
        console.error(`Error deleting flashcard set ${createdSetId}:`, deleteSetError);
      } else {
        console.log(`Successfully deleted flashcard set with ID: ${createdSetId}`);
      }
    } else {
      console.warn("No createdSetId found, skipping teardown for flashcard_sets and flashcards.");
    }

    // Wylogowanie użytkownika Supabase
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("Error signing out from Supabase after E2E:", signOutError);
    } else {
      console.log("Successfully signed out from Supabase after E2E.");
    }
  });
});
