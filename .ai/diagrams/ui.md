```flowchart TD
    classDef astroPage fill:#D6EAF8,stroke:#2E86C1,stroke-width:2px;
    classDef reactComp fill:#E8DAEF,stroke:#8E44AD,stroke-width:2px;
    classDef shadcnComp fill:#D5F5E3,stroke:#28B463,stroke-width:2px;
    classDef layoutComp fill:#FCF3CF,stroke:#F1C40F,stroke-width:2px;
    classDef stateMgmt fill:#FADBD8,stroke:#E74C3C,stroke-width:2px;

    subgraph "Warstwa Prezentacji (Astro Pages)"
        direction LR
        P_Start["StronaGlowna.astro (`/`)"]:::astroPage
        P_Login["LoginPage.astro (`/login`)"]:::astroPage
        P_Register["RegisterPage.astro (`/register`)"]:::astroPage
        P_Forgot["ForgotPasswordPage.astro (`/forgot-password`)"]:::astroPage
        P_Reset["ResetPasswordPage.astro (`/reset-password`)"]:::astroPage
        P_Dashboard["DashboardPage.astro (`/dashboard`)"]:::astroPage
    end

    subgraph "Layout (Astro/React)"
        L_Main["GłownyLayout.astro"]:::layoutComp
        C_TopBar["TopBar (React/Shadcn)"]:::reactComp
    end

    subgraph "Komponenty Formularzy (React + Shadcn)"
        C_LoginF["LoginForm.tsx"]:::reactComp
        C_RegisterF["RegisterForm.tsx"]:::reactComp
        C_ForgotF["ForgotPasswordForm.tsx"]:::reactComp
        C_ResetF["ResetPasswordForm.tsx"]:::reactComp
    end

    subgraph "Komponenty UI (Shadcn - Współdzielone)"
        S_Button["Button"]:::shadcnComp
        S_Input["Input"]:::shadcnComp
        S_Label["Label"]:::shadcnComp
        S_Card["Card"]:::shadcnComp
        S_AlertDialog["AlertDialog (dla Usuń Konto)"]:::shadcnComp
        S_Sonner["Sonner (Toasts)"]:::shadcnComp
        S_NavMenu["NavigationMenu"]:::shadcnComp
        S_Dropdown["DropdownMenu"]:::shadcnComp
    end

    subgraph "Zarządzanie Stanem Autentykacji"
        SupabaseSDK["Supabase JS SDK"]:::stateMgmt
    end

    %% Powiązania Layoutu i Stron
    L_Main --> C_TopBar
    L_Main --> P_Start
    L_Main --> P_Login
    L_Main --> P_Register
    L_Main --> P_Forgot
    L_Main --> P_Reset
    L_Main --> P_Dashboard

    %% Strona Główna
    P_Start --> S_Buttonยอดนิยม["Button ('Zaloguj się')"]
    P_Start --> S_Buttonลงทะเบียน["Button ('Zarejestruj się')"]
    S_Buttonยอดนิยม --> P_Login
    S_Buttonลงทะเบียน --> P_Register

    %% Strona Logowania
    P_Login --> C_LoginF
    C_LoginF --> S_Card
    C_LoginF --> S_Label
    C_LoginF --> S_Input
    C_LoginF --> S_Button
    C_LoginF -- Form Submit --> SupabaseSDK
    P_Login -.-> S_Sonner
    C_LoginF -- Link --> P_Register
    C_LoginF -- Link --> P_Forgot

    %% Strona Rejestracji
    P_Register --> C_RegisterF
    C_RegisterF --> S_Card
    C_RegisterF --> S_Label
    C_RegisterF --> S_Input
    C_RegisterF --> S_Button
    C_RegisterF -- Form Submit --> SupabaseSDK
    P_Register -.-> S_Sonner
    C_RegisterF -- Link --> P_Login

    %% Strona Zapomniałem Hasła
    P_Forgot --> C_ForgotF
    C_ForgotF --> S_Card
    C_ForgotF --> S_Label
    C_ForgotF --> S_Input
    C_ForgotF --> S_Button
    C_ForgotF -- Form Submit --> SupabaseSDK
    C_ForgotF -- Link --> P_Login

    %% Strona Resetowania Hasła
    P_Reset --> C_ResetF
    C_ResetF --> S_Card
    C_ResetF --> S_Label
    C_ResetF --> S_Input
    C_ResetF --> S_Button
    C_ResetF -- Form Submit --> SupabaseSDK

    %% TopBar i Autentykacja
    C_TopBar --> S_NavMenu
    C_TopBar --> S_Dropdown
    S_Dropdown -- "Usuń konto" --> S_AlertDialog
    S_AlertDialog -- Potwierdź --> SupabaseSDK
    C_TopBar -- Odczyt stanu zalogowania --> SupabaseSDK
    SupabaseSDK -- Zmiana stanu (zalogowano/wylogowano) --> C_TopBar

    %% Przekierowania po autentykacji
    SupabaseSDK -- Logowanie/Rejestracja Sukces --> P_Dashboard
    SupabaseSDK -- Wylogowanie/Usunięcie konta --> P_Start


    %% Ogólne użycie Sonner
    P_Dashboard -.-> S_Sonner

    %% Dostęp stron do SupabaseSDK (np. dla ochrony routingu po stronie klienta lub pobrania usera)
    P_Start -. dane użytkownika .-> SupabaseSDK
    P_Login -. dane użytkownika .-> SupabaseSDK
    P_Register -. dane użytkownika .-> SupabaseSDK
    P_Dashboard -. dane użytkownika .-> SupabaseSDK

    note over SupabaseSDK
      Supabase JS SDK zarządza stanem
      sesji użytkownika (tokeny, user object),
      komunikuje się z Supabase Auth backend.
      Formularze wywołują jego metody.
      TopBar i strony mogą odczytywać stan.
    end note
```