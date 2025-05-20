import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StudySessionView from "./StudySessionView";
import type { FlashcardDto } from "@/types";

// Import the hook that we are going to mock.
// Vitest will replace this with the mock due to the vi.mock call below.
import { useStudySession } from "@/hooks/useStudySession";

// Mock the entire module. The factory returns an object where
// useStudySession is a new vi.fn() mock instance.
vi.mock("@/hooks/useStudySession", () => ({
  useStudySession: vi.fn(),
}));

// Mock child components
vi.mock("./StudyFlashcard", () => ({
  default: vi.fn(({ flashcard, isFlipped, onFlip }) => (
    <div data-testid="study-flashcard" onClick={onFlip}>
      <span data-testid="flashcard-front">{flashcard.front}</span>
      {isFlipped && <span data-testid="flashcard-back">{flashcard.back}</span>}
    </div>
  )),
}));

vi.mock("./FlashcardRatingButtons", () => ({
  default: vi.fn(({ onRateKnown, onRateUnknown, disabled }) => (
    <div data-testid="flashcard-rating-buttons">
      <button data-testid="rate-known-button" onClick={onRateKnown} disabled={disabled}>
        Known
      </button>
      <button data-testid="rate-unknown-button" onClick={onRateUnknown} disabled={disabled}>
        Unknown
      </button>
    </div>
  )),
}));

vi.mock("./StudyCompletionSummary", () => ({
  default: vi.fn(() => <div data-testid="study-completion-summary">Session Complete!</div>),
}));

const mockFlashcards: FlashcardDto[] = [
  {
    id: "1",
    front: "Front 1",
    back: "Back 1",
    setId: "set1",
    lastReviewed: null,
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    userId: "user1",
  },
  {
    id: "2",
    front: "Front 2",
    back: "Back 2",
    setId: "set1",
    lastReviewed: null,
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    userId: "user1",
  },
];

const defaultProps = {
  flashcards: mockFlashcards,
  setId: "set1",
};

describe("StudySessionView", () => {
  const setupMockStudySession = (overrides = {}) => {
    // Now, useStudySession IS the mock function itself.
    (useStudySession as vi.Mock).mockReturnValue({
      currentFlashcard: mockFlashcards[0],
      isFlipped: false,
      isSessionCompleted: false,
      isSubmittingRating: false,
      flipCard: vi.fn(),
      rateKnown: vi.fn(),
      rateUnknown: vi.fn(),
      totalFlashcardsInSet: mockFlashcards.length,
      cardsRemainingToLearn: mockFlashcards.length,
      ...overrides,
    });
  };

  beforeEach(() => {
    // Reset the imported mock before each test
    (useStudySession as vi.Mock).mockReset();
    // vi.clearAllMocks() can also be used if you have other global mocks to clear
    // or other vi.fn() instances created within tests, but for this specific mock, mockReset() is direct.
  });

  it("should render loading message if no current flashcard and session not completed", () => {
    setupMockStudySession({ currentFlashcard: null, isSessionCompleted: false });
    render(<StudySessionView {...defaultProps} />);
    expect(screen.getByText("Ładowanie karty lub sesja zakończona...")).toBeInTheDocument();
  });

  it("should render completion summary if session is completed (with cards)", () => {
    setupMockStudySession({ isSessionCompleted: true });
    render(<StudySessionView {...defaultProps} />);
    expect(screen.getByTestId("study-completion-summary")).toBeInTheDocument();
    // Ensure no specific empty message is shown if there were cards initially
    expect(screen.queryByText("Brak fiszek w tym zestawie")).not.toBeInTheDocument();
  });

  it("should render specific message and completion summary if session completed and initial flashcards were empty", () => {
    setupMockStudySession({ isSessionCompleted: true, totalFlashcardsInSet: 0, cardsRemainingToLearn: 0 });
    render(<StudySessionView {...defaultProps} flashcards={[]} />);
    expect(screen.getByText("Brak fiszek w tym zestawie")).toBeInTheDocument();
    expect(screen.getByText("Ten zestaw nie zawiera żadnych fiszek do nauki.")).toBeInTheDocument();
    expect(screen.getByTestId("study-completion-summary")).toBeInTheDocument(); // StudyCompletionSummary is also rendered here
  });

  it("should render StudyFlashcard with correct props when a card is active", () => {
    const flipCardMock = vi.fn();
    setupMockStudySession({ currentFlashcard: mockFlashcards[0], isFlipped: false, flipCard: flipCardMock });
    render(<StudySessionView {...defaultProps} />);

    const flashcardElement = screen.getByTestId("study-flashcard");
    expect(flashcardElement).toBeInTheDocument();
    expect(screen.getByTestId("flashcard-front")).toHaveTextContent("Front 1");
    expect(screen.queryByTestId("flashcard-back")).not.toBeInTheDocument();

    fireEvent.click(flashcardElement);
    expect(flipCardMock).toHaveBeenCalledTimes(1);
  });

  it("should display progress counter correctly", () => {
    setupMockStudySession({
      currentFlashcard: mockFlashcards[0],
      totalFlashcardsInSet: 5,
      cardsRemainingToLearn: 3,
    });
    render(<StudySessionView {...defaultProps} />);
    expect(screen.getByText("Pozostało do nauki: 3 / 5")).toBeInTheDocument();
  });

  it("should not display progress counter if totalFlashcardsInSet is 0", () => {
    setupMockStudySession({
      currentFlashcard: mockFlashcards[0], // still need a card to avoid completion screen
      totalFlashcardsInSet: 0,
      cardsRemainingToLearn: 0,
    });
    render(<StudySessionView {...defaultProps} />);
    expect(screen.queryByText(/Pozostało do nauki:/)).not.toBeInTheDocument();
  });

  it("should render FlashcardRatingButtons when card is flipped and not submitting", () => {
    const rateKnownMock = vi.fn();
    const rateUnknownMock = vi.fn();
    setupMockStudySession({
      currentFlashcard: mockFlashcards[0],
      isFlipped: true,
      isSubmittingRating: false,
      rateKnown: rateKnownMock,
      rateUnknown: rateUnknownMock,
    });
    render(<StudySessionView {...defaultProps} />);

    expect(screen.getByTestId("flashcard-rating-buttons")).toBeInTheDocument();
    const knownButton = screen.getByTestId("rate-known-button");
    const unknownButton = screen.getByTestId("rate-unknown-button");

    expect(knownButton).not.toBeDisabled();
    expect(unknownButton).not.toBeDisabled();

    fireEvent.click(knownButton);
    expect(rateKnownMock).toHaveBeenCalledTimes(1);

    fireEvent.click(unknownButton);
    expect(rateUnknownMock).toHaveBeenCalledTimes(1);
  });

  it("should not render FlashcardRatingButtons when card is not flipped", () => {
    setupMockStudySession({ currentFlashcard: mockFlashcards[0], isFlipped: false });
    render(<StudySessionView {...defaultProps} />);
    expect(screen.queryByTestId("flashcard-rating-buttons")).not.toBeInTheDocument();
  });

  it('should render "Przetwarzanie..." message and disable rating buttons when submitting rating', () => {
    setupMockStudySession({
      currentFlashcard: mockFlashcards[0],
      isFlipped: true,
      isSubmittingRating: true,
    });
    render(<StudySessionView {...defaultProps} />);

    expect(screen.getByText("Przetwarzanie...")).toBeInTheDocument();
    // When isSubmittingRating is true, the FlashcardRatingButtons are not rendered according to component logic.
    expect(screen.queryByTestId("flashcard-rating-buttons")).not.toBeInTheDocument();
    // Consequently, we cannot and should not test if its inner buttons are disabled.
  });
});
