import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import AIFlashcardGenerator from "./AIFlashcardGenerator";
import * as sonner from "sonner"; // To mock toast
import "@testing-library/jest-dom/vitest";

// Mocking crypto.randomUUID
let uuidCounter = 0; // Added a counter for unique UUIDs
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => {
    uuidCounter++;
    return `mock-uuid-${uuidCounter}`;
  }),
});

// Mocking fetch
global.fetch = vi.fn();

// Mocking sonner
vi.mock("sonner", () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: vi.fn(() => null), // Mock Toaster jako komponent, który nic nie renderuje
}));

// Mock window.confirm for tests that use it
global.window.confirm = vi.fn(() => true); // Default to true (user confirms)

const MIN_TEXT_LENGTH = 1000; // As defined in the component
const MAX_TEXT_LENGTH = 10000; // As defined in the component

describe("AIFlashcardGenerator", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockReset();

    // Mock successful fetch for generate
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url, options) => {
      if (url === "/api/ai/generate-flashcards") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              suggestions: [
                { front: "Q1", back: "A1", validation_status: "valid" },
                { front: "Q2", back: "A2", validation_status: "valid" },
              ],
              metadata: {
                model_used: "test-model",
                source_text_hash: "test-hash",
                generation_duration_ms: 100,
                truncated_count: 0,
                rejected_count: 0,
              },
            }),
        } as Response);
      }
      if (url === "/api/flashcard-sets") {
        const body = options?.body ? JSON.parse(options.body as string) : {};
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "set-123", name: body.name || "Test Set" }),
        } as Response);
      }
      if (String(url).includes("/api/flashcard-sets/set-123/flashcards/batch-create")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              created_flashcards_count: 2,
              errors: [],
            }),
        } as Response);
      }
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) } as Response);
    });
  });

  afterEach(() => {
    // restore crypto if it was changed
    vi.unstubAllGlobals();
  });

  it("renders initial state correctly", () => {
    render(<AIFlashcardGenerator />);
    expect(screen.getByText("Generator Fiszek z AI")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generuj Fiszki" })).toBeDisabled();
  });

  describe("Source Text Input and Validation", () => {
    it("enables generate button when text is valid", () => {
      render(<AIFlashcardGenerator />);
      const textArea = screen.getByRole("textbox");
      fireEvent.change(textArea, { target: { value: "a".repeat(MIN_TEXT_LENGTH) } });
      expect(screen.getByRole("button", { name: "Generuj Fiszki" })).toBeEnabled();
    });

    it("disables generate button and shows message for text too short", () => {
      render(<AIFlashcardGenerator />);
      const textArea = screen.getByRole("textbox");
      fireEvent.change(textArea, { target: { value: "short" } });
      expect(screen.getByRole("button", { name: "Generuj Fiszki" })).toBeDisabled();
      expect(screen.getByText(`Tekst musi mieć przynajmniej ${MIN_TEXT_LENGTH} znaków.`)).toBeInTheDocument();
    });

    it("disables generate button and shows message for text too long", () => {
      render(<AIFlashcardGenerator />);
      const textArea = screen.getByRole("textbox");
      fireEvent.change(textArea, { target: { value: "a".repeat(MAX_TEXT_LENGTH + 1) } });
      expect(screen.getByRole("button", { name: "Generuj Fiszki" })).toBeDisabled();
      expect(screen.getByText(`Tekst nie może przekraczać ${MAX_TEXT_LENGTH} znaków.`)).toBeInTheDocument();
    });

    it("clears validation message when text is cleared", () => {
      render(<AIFlashcardGenerator />);
      const textArea = screen.getByRole("textbox");
      fireEvent.change(textArea, { target: { value: "short" } });
      expect(screen.getByText(`Tekst musi mieć przynajmniej ${MIN_TEXT_LENGTH} znaków.`)).toBeInTheDocument();
      fireEvent.change(textArea, { target: { value: "" } });
      expect(screen.queryByText(`Tekst musi mieć przynajmniej ${MIN_TEXT_LENGTH} znaków.`)).not.toBeInTheDocument();
    });
  });

  describe("Flashcard Generation", () => {
    it("calls API and displays suggestions on successful generation", async () => {
      render(<AIFlashcardGenerator />);
      const textArea = screen.getByRole("textbox");
      fireEvent.change(textArea, { target: { value: "a".repeat(MIN_TEXT_LENGTH) } });
      fireEvent.click(screen.getByRole("button", { name: "Generuj Fiszki" }));

      expect(sonner.toast.loading).toHaveBeenCalledWith("Generowanie propozycji...");
      await waitFor(() => expect(screen.getByText("Sugerowane Fiszki")).toBeInTheDocument());

      expect(global.fetch).toHaveBeenCalledWith("/api/ai/generate-flashcards", expect.any(Object));
      expect(screen.getByText("Q1")).toBeInTheDocument();
      expect(screen.getByText("A1")).toBeInTheDocument();
      expect(screen.getByText("Q2")).toBeInTheDocument();
      expect(screen.getByText("A2")).toBeInTheDocument();
      expect(sonner.toast.success).toHaveBeenCalledWith("Propozycje wygenerowane pomyślnie!");
      expect(screen.getByText(/Model: test-model/)).toBeInTheDocument();
    });

    it("shows error toast if API call fails during generation", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce((url) => {
        if (url === "/api/ai/generate-flashcards") {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ message: "AI Error" }),
          } as Response);
        }
        return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) } as Response);
      });

      render(<AIFlashcardGenerator />);
      const textArea = screen.getByRole("textbox");
      fireEvent.change(textArea, { target: { value: "a".repeat(MIN_TEXT_LENGTH) } });
      fireEvent.click(screen.getByRole("button", { name: "Generuj Fiszki" }));

      await waitFor(() =>
        expect(sonner.toast.error).toHaveBeenCalledWith("Błąd podczas generowania propozycji: AI Error")
      );
      expect(screen.queryByText("Sugerowane Fiszki")).not.toBeInTheDocument();
    });
  });

  describe("Suggestion Management", () => {
    const generateSuggestions = async () => {
      const textArea = screen.getByRole("textbox");
      fireEvent.change(textArea, { target: { value: "a".repeat(MIN_TEXT_LENGTH) } });
      fireEvent.click(screen.getByRole("button", { name: "Generuj Fiszki" }));
      await waitFor(() => expect(screen.getByText("Sugerowane Fiszki")).toBeInTheDocument());
    };

    it("accepts a suggestion", async () => {
      render(<AIFlashcardGenerator />);
      await generateSuggestions();
      // Assuming the first suggestion is Q1/A1
      const acceptButtons = screen.getAllByRole("button", { name: "Zaakceptuj sugestię" });
      fireEvent.click(acceptButtons[0]); // Accept the first suggestion
      expect(sonner.toast.success).toHaveBeenCalledWith("Propozycja zaakceptowana!");
      // Check if the "Zapisz Zaakceptowane" button count updates
      expect(screen.getByRole("button", { name: "Zapisz Zaakceptowane (1)" })).toBeInTheDocument();
    });

    it("unaccepts a suggestion and reverts content", async () => {
      render(<AIFlashcardGenerator />);
      await generateSuggestions();

      // First, accept it
      const acceptButtons = screen.getAllByRole("button", { name: "Zaakceptuj sugestię" });
      fireEvent.click(acceptButtons[0]);
      await waitFor(() => expect(screen.getByRole("button", { name: "Zapisz Zaakceptowane (1)" })).toBeInTheDocument());

      // Edit it (which also accepts)
      const editButtons = screen.getAllByRole("button", { name: "Edytuj sugestię" });
      fireEvent.click(editButtons[0]); // Edit the first suggestion

      await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
      fireEvent.change(screen.getByLabelText("Awers"), { target: { value: "Edited Q1" } });
      fireEvent.change(screen.getByLabelText("Rewers"), { target: { value: "Edited A1" } });
      fireEvent.click(screen.getByRole("button", { name: "Zapisz Zmiany" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await waitFor(() => expect(screen.getByText("Edited Q1")).toBeInTheDocument()); // Wait for edit to apply
      await waitFor(() => expect(screen.getByText("Edited A1")).toBeInTheDocument()); // Wait for edit to apply

      // Now unaccept
      const unacceptButtons = screen.getAllByRole("button", { name: "Cofnij akceptację sugestii" });
      fireEvent.click(unacceptButtons[0]);

      expect(sonner.toast.info).toHaveBeenCalledWith(
        "Propozycja odrzucona. Treść przywrócona do oryginalnej sugestii."
      );
      expect(screen.getByText("Q1")).toBeInTheDocument(); // Reverted to original
      expect(screen.queryByText("Edited Q1")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Zapisz Zaakceptowane (0)" })).toBeInTheDocument();
    });

    it("rejects a suggestion after confirmation", async () => {
      render(<AIFlashcardGenerator />);
      await generateSuggestions();
      await waitFor(() => {
        expect(screen.getByText("Q1")).toBeInTheDocument();
        expect(screen.getByText("Q2")).toBeInTheDocument();
      });

      const rejectButtons = screen.getAllByRole("button", { name: "Odrzuć sugestię" });
      fireEvent.click(rejectButtons[0]); // Reject the first suggestion (Q1)

      await waitFor(() =>
        expect(
          screen.getByRole("alertdialog", { name: "Czy na pewno chcesz odrzucić tę sugestię fiszki?" })
        ).toBeInTheDocument()
      );
      fireEvent.click(screen.getByRole("button", { name: "Tak, Odrzuć" }));

      await waitFor(() => expect(sonner.toast.success).toHaveBeenCalledWith("Propozycja odrzucona."));
      expect(screen.queryByText("Q1")).not.toBeInTheDocument();
      expect(screen.getByText("Q2")).toBeInTheDocument(); // Second suggestion should still be there
      expect(screen.getByRole("button", { name: "Zapisz Wszystkie (1)" })).toBeInTheDocument();
    });

    it("edits a suggestion", async () => {
      render(<AIFlashcardGenerator />);
      await generateSuggestions();

      const editButtons = screen.getAllByRole("button", { name: "Edytuj sugestię" });
      fireEvent.click(editButtons[0]); // Edit the first suggestion

      await waitFor(() => expect(screen.getByRole("dialog", { name: "Edytuj Sugestię Fiszki" })).toBeInTheDocument());
      fireEvent.change(screen.getByLabelText("Awers"), { target: { value: "Edited Q1" } });
      fireEvent.change(screen.getByLabelText("Rewers"), { target: { value: "Edited A1" } });
      fireEvent.click(screen.getByRole("button", { name: "Zapisz Zmiany" }));

      await waitFor(() =>
        expect(screen.queryByRole("dialog", { name: "Edytuj Sugestię Fiszki" })).not.toBeInTheDocument()
      );
      expect(screen.getByText("Edited Q1")).toBeInTheDocument();
      expect(screen.getByText("Edited A1")).toBeInTheDocument();
      expect(sonner.toast.success).toHaveBeenCalledWith("Fiszka zaktualizowana i zaakceptowana!");
      // After editing, it should also be considered accepted
      expect(screen.getByRole("button", { name: "Zapisz Zaakceptowane (1)" })).toBeInTheDocument();
    });
  });

  describe("Saving Flashcard Sets", () => {
    const generateAndAcceptFirstSuggestion = async () => {
      render(<AIFlashcardGenerator />);
      const textArea = screen.getByRole("textbox");
      fireEvent.change(textArea, { target: { value: "a".repeat(MIN_TEXT_LENGTH) } });
      fireEvent.click(screen.getByRole("button", { name: "Generuj Fiszki" }));
      await waitFor(() => expect(screen.getByText("Sugerowane Fiszki")).toBeInTheDocument());

      const acceptButtons = screen.getAllByRole("button", { name: "Zaakceptuj sugestię" });
      fireEvent.click(acceptButtons[0]); // Accept Q1
      await waitFor(() => expect(screen.getByRole("button", { name: "Zapisz Zaakceptowane (1)" })).toBeInTheDocument());
    };

    it("saves accepted flashcards successfully", async () => {
      await generateAndAcceptFirstSuggestion();

      fireEvent.click(screen.getByRole("button", { name: "Zapisz Zaakceptowane (1)" }));

      // Wait for the dialog to appear
      const dialog = await waitFor(() => screen.getByRole("dialog", { name: "Zapisz Nowy Zestaw Fiszke" }), {
        timeout: 3000,
      });

      fireEvent.change(within(dialog).getByLabelText("Nazwa Zestawu"), { target: { value: "My Accepted Set" } });
      fireEvent.click(within(dialog).getByRole("button", { name: "Zapisz Zestaw" }));

      expect(sonner.toast.loading).toHaveBeenCalledWith("Zapisywanie zestawu fiszek...");
      await waitFor(() => expect(global.fetch).toHaveBeenCalledWith("/api/flashcard-sets", expect.any(Object)));
      await waitFor(() =>
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/flashcard-sets/set-123/flashcards/batch-create",
          expect.any(Object)
        )
      );
      await waitFor(() =>
        expect(sonner.toast.success).toHaveBeenCalledWith(
          'Zestaw fiszek "My Accepted Set" i wszystkie 1 fiszki zapisane pomyślnie!'
        )
      );
    });

    it("saves all flashcards successfully", async () => {
      render(<AIFlashcardGenerator />);
      const textArea = screen.getByRole("textbox");
      fireEvent.change(textArea, { target: { value: "a".repeat(MIN_TEXT_LENGTH) } });
      fireEvent.click(screen.getByRole("button", { name: "Generuj Fiszki" }));
      await waitFor(() => expect(screen.getByText("Sugerowane Fiszki")).toBeInTheDocument()); // Wait for Q1, Q2

      fireEvent.click(screen.getByRole("button", { name: "Zapisz Wszystkie (2)" }));

      const dialog = await waitFor(() => screen.getByRole("dialog", { name: "Zapisz Nowy Zestaw Fiszke" }), {
        timeout: 3000,
      });

      fireEvent.change(within(dialog).getByLabelText("Nazwa Zestawu"), { target: { value: "My All Set" } });
      fireEvent.click(within(dialog).getByRole("button", { name: "Zapisz Zestaw" }));

      expect(sonner.toast.loading).toHaveBeenCalledWith("Zapisywanie zestawu fiszek...");
      await waitFor(() => expect(global.fetch).toHaveBeenCalledWith("/api/flashcard-sets", expect.any(Object)));
      await waitFor(() =>
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/flashcard-sets/set-123/flashcards/batch-create",
          expect.any(Object)
        )
      );
      await waitFor(() =>
        expect(sonner.toast.success).toHaveBeenCalledWith(
          'Zestaw fiszek "My All Set" i wszystkie 2 fiszki zapisane pomyślnie!'
        )
      );
    });

    it("shows error if saving set API call fails", async () => {
      // Ensure generateSuggestions call within generateAndAcceptFirstSuggestion works
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce((url) => {
        // First call for generate-flashcards
        if (url === "/api/ai/generate-flashcards") {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                suggestions: [
                  { front: "Q1", back: "A1", validation_status: "valid" },
                  { front: "Q2", back: "A2", validation_status: "valid" },
                ],
                metadata: {
                  model_used: "test-model",
                  source_text_hash: "test-hash",
                  generation_duration_ms: 100,
                  truncated_count: 0,
                  rejected_count: 0,
                },
              }),
          } as Response);
        }
        // Fallback for unexpected calls during this first specific mock
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ message: "Unexpected call in mockImplementationOnce for generate" }),
        } as Response);
      });

      // Subsequent calls, including the one that should fail for set creation
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url) => {
        if (url === "/api/flashcard-sets") {
          // This is the call that should fail
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ message: "Set Save Error" }),
          } as Response);
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response); // Other calls fine
      });

      await generateAndAcceptFirstSuggestion();
      fireEvent.click(screen.getByRole("button", { name: "Zapisz Zaakceptowane (1)" }));

      const dialog = await waitFor(() => screen.getByRole("dialog", { name: "Zapisz Nowy Zestaw Fiszke" }));
      fireEvent.change(within(dialog).getByLabelText("Nazwa Zestawu"), { target: { value: "Fail Set" } });
      fireEvent.click(within(dialog).getByRole("button", { name: "Zapisz Zestaw" }));

      await waitFor(() => expect(sonner.toast.error).toHaveBeenCalledWith("Set Save Error"));
    });

    it("shows error for batch create but success for set if batch API call fails", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url) => {
        if (url === "/api/flashcard-sets") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: "set-failure-case", name: "Batch Fail Set" }),
          } as Response);
        }
        if (String(url).includes("/api/flashcard-sets/set-failure-case/flashcards/batch-create")) {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ message: "Batch Create Error" }),
          } as Response);
        }
        // Mock for generate flashcards
        if (url === "/api/ai/generate-flashcards") {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                suggestions: [{ front: "Q1", back: "A1", validation_status: "valid" }],
                metadata: {
                  model_used: "test-model",
                  source_text_hash: "test-hash",
                  generation_duration_ms: 100,
                  truncated_count: 0,
                  rejected_count: 0,
                },
              }),
          } as Response);
        }
        return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) } as Response);
      });

      await generateAndAcceptFirstSuggestion();
      fireEvent.click(screen.getByRole("button", { name: "Zapisz Zaakceptowane (1)" }));

      const dialog = await waitFor(() => screen.getByRole("dialog", { name: "Zapisz Nowy Zestaw Fiszke" }));
      fireEvent.change(within(dialog).getByLabelText("Nazwa Zestawu"), { target: { value: "Batch Fail Set" } });
      fireEvent.click(within(dialog).getByRole("button", { name: "Zapisz Zestaw" }));

      await waitFor(() =>
        expect(sonner.toast.success).toHaveBeenCalledWith(
          'Zestaw fiszek "Batch Fail Set" i wszystkie 1 fiszki zapisane pomyślnie!'
        )
      );
    });

    it("saves an edited flashcard correctly with 'ai_generated_modified' source", async () => {
      // Mock fetch specifically for this test to control set name in response
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url, options) => {
        if (url === "/api/ai/generate-flashcards") {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                suggestions: [
                  { front: "Q1", back: "A1", validation_status: "valid" },
                  { front: "Q2", back: "A2", validation_status: "valid" },
                ],
                metadata: {
                  model_used: "test-model",
                  source_text_hash: "test-hash",
                  generation_duration_ms: 100,
                  truncated_count: 0,
                  rejected_count: 0,
                },
              }),
          } as Response);
        }
        if (url === "/api/flashcard-sets") {
          // Ensure the set name in the response matches what the test will assert for the toast
          const body = options?.body ? JSON.parse(options.body as string) : {};
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: "set-edited-123", name: body.name || "Default Mocked Set Name" }),
          } as Response);
        }
        if (String(url).includes("/api/flashcard-sets/set-edited-123/flashcards/batch-create")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ created_flashcards_count: 2, errors: [] }),
          } as Response);
        }
        return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) } as Response);
      });

      render(<AIFlashcardGenerator />);
      const textArea = screen.getByRole("textbox");
      fireEvent.change(textArea, { target: { value: "a".repeat(MIN_TEXT_LENGTH) } });
      fireEvent.click(screen.getByRole("button", { name: "Generuj Fiszki" }));
      await waitFor(() => expect(screen.getByText("Q1")).toBeInTheDocument()); // Wait for suggestions

      // Edit the first suggestion
      const editButtons = screen.getAllByRole("button", { name: "Edytuj sugestię" });
      fireEvent.click(editButtons[0]);

      const editDialog = await waitFor(() => screen.getByRole("dialog", { name: "Edytuj Sugestię Fiszki" }), {
        timeout: 2000,
      });
      fireEvent.change(within(editDialog).getByLabelText("Awers"), { target: { value: "Edited Front Q1" } });
      fireEvent.change(within(editDialog).getByLabelText("Rewers"), {
        target: { value: "Edited Back A1" },
      });
      fireEvent.click(within(editDialog).getByRole("button", { name: "Zapisz Zmiany" }));

      await waitFor(() =>
        expect(screen.queryByRole("dialog", { name: "Edytuj Sugestię Fiszki" })).not.toBeInTheDocument()
      );
      expect(screen.getByText("Edited Front Q1")).toBeInTheDocument(); // Check if the edit is reflected

      // Save all (which now includes the edited card)
      fireEvent.click(screen.getByRole("button", { name: "Zapisz Wszystkie (2)" })); // Assuming 2 suggestions initially

      const saveDialog = await waitFor(() => screen.getByRole("dialog", { name: "Zapisz Nowy Zestaw Fiszke" }), {
        timeout: 2000,
      });
      fireEvent.change(within(saveDialog).getByLabelText("Nazwa Zestawu"), { target: { value: "Edited Set" } });
      fireEvent.click(within(saveDialog).getByRole("button", { name: "Zapisz Zestaw" }));

      await waitFor(() => {
        const fetchCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
        const batchCreateCall = fetchCalls.find((call) => String(call[0]).includes("/batch-create"));
        expect(batchCreateCall).toBeDefined();
        if (batchCreateCall) {
          const requestBody = JSON.parse(batchCreateCall[1].body as string);
          expect(requestBody.flashcards).toContainEqual(
            expect.objectContaining({
              front: "Edited Front Q1",
              back: "Edited Back A1",
              source: "ai_generated_modified",
            })
          );
          expect(requestBody.flashcards).toContainEqual(
            expect.objectContaining({
              front: "Q2", // The second, unedited suggestion
              back: "A2",
              source: "ai_generated",
            })
          );
        }
      });
      await waitFor(() =>
        expect(sonner.toast.success).toHaveBeenCalledWith(
          'Zestaw fiszek "Edited Set" i wszystkie 2 fiszki zapisane pomyślnie!'
        )
      );
    });
  });

  describe("Navigation", () => {
    it("'Go Back' button redirects to /dashboard", () => {
      const originalLocation = window.location;
      // @ts-expect-error Przechodzimy przez standardowy mechanizm window.location
      delete window.location;
      window.location = { ...originalLocation, href: "" } as Location; // Mock location

      render(<AIFlashcardGenerator />);
      fireEvent.click(screen.getByRole("button", { name: "Wróć do panelu" }));
      expect(window.location.href).toBe("/dashboard");

      window.location = originalLocation; // Restore original location
    });
  });
});
