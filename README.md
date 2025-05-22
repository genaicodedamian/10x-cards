# 10x-cards

## Table of Contents
- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project structure](#project-structure)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description
10x-cards is an application designed to help users quickly create and manage sets of educational flashcards. It leverages Large Language Models (LLMs) via an API to generate flashcard suggestions from user-provided text, aiming to reduce the time and effort needed for manual flashcard creation and simplify the management of learning materials. The core problem it solves is the time-consuming nature of creating high-quality flashcards, which often discourages users from utilizing effective learning methods like spaced repetition.

## Tech Stack

### Frontend
*   **Astro 5:** For building fast, content-focused websites with minimal JavaScript.
*   **React 19:** For creating interactive user interface components.
*   **TypeScript 5:** For static typing, enhancing code quality and developer experience.
*   **Tailwind CSS 4:** A utility-first CSS framework for rapid UI development.
*   **Shadcn/ui:** A collection of re-usable, accessible UI components built with Radix UI and Tailwind CSS.

### Backend
*   **Supabase:** An open-source Firebase alternative providing:
    *   PostgreSQL database
    *   Backend-as-a-Service (BaaS) SDKs (client and admin for server-side operations)
    *   User authentication

### AI
*   **Openrouter.ai:** A service providing access to a wide variety of LLMs (e.g., OpenAI, Anthropic, Google) for generating flashcard content.

### Testing
*   **Vitest:** For unit and component testing.
*   **Playwright:** For end-to-end testing.

### CI/CD & Hosting
*   **GitHub Actions:** For automating build, test, and deployment pipelines.
*   **DigitalOcean:** For hosting the application, via Docker containers.

## Getting Started Locally

### Prerequisites
*   **Node.js:** Version `22.14.0` (it's recommended to use a version manager like `nvm`).
    *   If you use `nvm`, run `nvm use` or `nvm install $(cat .nvmrc)` in the project root.
*   **npm** (Node Package Manager, comes with Node.js)
*   **Supabase Account/Setup:** You'll need Supabase project credentials.
    *   Set up a project on [Supabase](https://supabase.com/).
    *   Obtain your Project URL and Anon Key.
*   **Openrouter.ai API Key:**
    *   Sign up at [Openrouter.ai](https://openrouter.ai/).
    *   Obtain your API key.

### Installation & Setup
1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd 10x-cards 
    ```
    (Replace `<repository-url>` with the actual URL and `10x-cards` with the repository directory name if different, e.g. `10x-astro-starter`)

2.  **Install Node.js version:**
    If you are using `nvm`:
    ```bash
    nvm use
    ```
    This command will use the version specified in the `.nvmrc` file. If the version is not installed, `nvm` will prompt you to install it.

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the `.env.example` file (if one exists, otherwise create it).
    ```bash
    cp .env.example .env
    ```
    Add your Supabase and Openrouter.ai credentials to the `.env` file:
    ```env
    PUBLIC_SUPABASE_URL=your_supabase_project_url
    PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    OPENROUTER_API_KEY=your_openrouter_api_key
    # Add any other necessary environment variables
    ```
    *Note: Ensure `.env` is listed in your `.gitignore` file to prevent committing sensitive keys.*

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running locally, typically at `http://localhost:4321`.

## Available Scripts

The `package.json` file includes the following scripts:

*   `npm run dev`: Starts the Astro development server with Hot Module Replacement (HMR).
*   `npm run build`: Builds the application for production.
*   `npm run preview`: Serves the production build locally for previewing.
*   `npm run astro`: Provides access to the Astro CLI for various commands.
*   `npm run lint`: Lints the codebase using ESLint to identify and report on patterns in JavaScript, TypeScript, and Astro files.
*   `npm run lint:fix`: Lints the codebase and automatically fixes fixable issues.
*   `npm run format`: Formats the codebase using Prettier to ensure consistent styling.
*   `npm run test`: Runs unit and component tests using Vitest.
*   `npm run test:watch`: Runs Vitest in watch mode for interactive testing.
*   `npm run test:ui`: Opens the Vitest UI for a more visual testing experience.
*   `npm run test:coverage`: Runs Vitest tests and generates a code coverage report.
*   `npm run e2e`: Runs end-to-end tests using Playwright.
*   `npm run e2e:ui`: Opens the Playwright UI for interactive E2E test debugging.
*   `npm run e2e:headed`: Runs Playwright tests with the browser visible.
*   `npm run e2e:codegen`: Starts Playwright Codegen to help record E2E tests.

## Project Structure

```md
.
├── src/
│   ├── assets/     # static internal assets
│   ├── components/ # Client-side components written in Astro (static) and React (dynamic)
│   │   └── ui/     # Client-side components from Shadcn/ui
│   ├── db/         # Supabase clients and types
│   ├── layouts/    # Astro layouts
│   ├── lib/        # Services and helpers 
│   ├── middleware/ # Astro middleware
│   │   └── index.ts
│   ├── pages/      # Astro pages
│   │   └── api/    # API endpoints
│   └── types.ts    # Shared types for backend and frontend (Entities, DTOs)
├── public/         # Public assets
```

## Project Scope

### Key Features (MVP)
*   **AI-Powered Flashcard Generation:** Users can paste text (1000-10000 characters), and the application will suggest flashcards (questions and answers) generated by an LLM. Users can accept, edit, or reject these suggestions before saving them as a new named set.
*   **Manual Flashcard Creation & Management:** Users can manually create flashcards (front and back), add them to a temporary list, edit or remove them from this list, and then save them as a new named set.
*   **User Authentication:** Secure registration (email, password with confirmation, min. 7 characters), login, and account management, including password reset (forgotten password and user-initiated) and account deletion.
*   **Spaced Repetition Integration:** Flashcards are integrated with a basic spaced repetition mechanism for study sessions. Users mark cards as "Umiem" (I know) or "Nie umiem" (I don't know), with "Nie umiem" cards repeated until marked as "Umiem".
*   **Data Storage & Scalability:** User data (accounts, flashcard sets, flashcards) and AI generation error logs are securely stored in a PostgreSQL database (Supabase), designed for scalability.
*   **Flashcard Set Management:** Users can view a paginated list of their flashcard sets, sorted by last study date and creation date. Each set displays its name, flashcard count, source (AI/Manual), and last study date. Users can start a study session or delete a set (delete function to be activated later, currently shows "Coming soon").
*   **Usage Statistics:** The system collects data on how many AI-generated flashcards are accepted unedited to help gauge generation quality.
*   **GDPR Compliance:** Adherence to data privacy regulations, including the right to data access and deletion (account deletion removes all associated flashcards and anonymizes error logs).

### To be implemented after MVP
*   Advanced, custom-built spaced repetition algorithms (using a ready-made open-source library/algorithm for MVP).
*   Gamification features.
*   Importing from multiple document formats (e.g., PDF, DOCX) - only plain text input for AI generation.
*   Public API for third-party integrations.
*   Flashcard sharing between users.
*   Advanced notification system (beyond basic toasts for actions like login/registration/set creation).
*   Keyword-based search for flashcards within sets or across all user flashcards.
*   Advanced AI regeneration of individual flashcards already saved in a set (beyond standard manual editing of those flashcards).
*   Editing individual flashcards within already saved sets (MVP focuses on creating sets; management of existing, saved flashcards is limited to deleting whole sets or initiating study sessions).

## Project Status
The project is currently in active development, with a primary focus on delivering the Minimum Viable Product (MVP) features outlined above.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
```
