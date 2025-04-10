# 🎯 Prompt: Fiszki AI – Kontekst dla LLM

## 🧠 Cel Aplikacji

Stwórz aplikację webową "Fiszki AI", która umożliwia użytkownikowi szybkie generowanie fiszek do nauki słówek. Użytkownik podaje temat, a AI tworzy zestaw 20 fiszek (PL → EN). Użytkownik może je przeglądać, edytować i uczyć się w interaktywnych sesjach.

---

# Dokument wymagań produktu (PRD) - Fiszki AI MVP

**1. Wprowadzenie**

1.1. **Cel dokumentu**
Ten dokument określa wymagania dla Minimalnej Wersji Produktu (MVP) aplikacji webowej "Fiszki AI", która generuje fiszki z tłumaczeniami na podstawie tematu podanego przez użytkownika.

1.2. **Odbiorcy dokumentu**
* Zespół programistyczny
* Zespół projektowy
* Interesariusze

**2. Cel produktu**

Stworzenie aplikacji webowej, która w prosty i intuicyjny sposób umożliwi użytkownikom naukę słówek z wykorzystaniem fiszek generowanych przez AI. Aplikacja ma rozwiązać problem czasochłonnego tworzenia fiszek, oferując szybkie i automatyczne generowanie zestawów słówek na dany temat.

**3. Grupa docelowa**

* Samoucy języków obcych
* Uczniowie i studenci

**4. Konkurencja**

Obecnie brak bezpośredniej konkurencji oferującej tak prosty i intuicyjny interfejs do generowania fiszek z wykorzystaniem AI.

**5. Zakres produktu (MVP)**

5.1. **Funkcjonalności**

* **Generowanie fiszek:**
    * Użytkownik podaje tematykę fiszek.
    * AI generuje zestaw 20 fiszek: "przód" - słowo po polsku, "tył" - tłumaczenie na angielski.
* **Review fiszek:**
    * Użytkownik przegląda wygenerowane fiszki.
    * Użytkownik akceptuje lub usuwa cały zestaw fiszek.
    * Użytkownik ma możliwość edycji "przodu" i "tyłu" fiszki.
* **Zarządzanie stosami fiszek:**
    * Fiszki są przechowywane w stosach (maks. 20 fiszek na stos).
    * Użytkownik może tworzyć wiele stosów fiszek.
    * Główny ekran wyświetla listę stosów fiszek (grafika generyczna - żółty sticky-note).
    * Użytkownik może przeglądać, edytować i usuwać fiszki.
* **Sesje nauki:**
    * Użytkownik wybiera stos fiszek.
    * Użytkownik przegląda fiszki w sesjach:
        * Wyświetlany jest "przód" fiszki.
        * Po kliknięciu w fiszkę wyświetlany jest "tył" fiszki.
        * Użytkownik klika zielony przycisk (fiszka zapamiętana) lub czerwony przycisk (fiszka do powtórki).
        * Po kliknięciu zielonego przycisku wyświetlana jest kolejna fiszka.
        * Po kliknięciu czerwonego przycisku fiszka wraca na koniec listy fiszek w sesji.
        * Po zapamiętaniu wszystkich fiszek w zestawie, sesja się kończy i wyświetlany jest pop-up z gratulacjami.
* **Baza danych:**
    * Przechowywanie danych o fiszkach (przód, tył, data utworzenia, data ostatniej sesji).

5.2. **User flow**

```mermaid
graph LR
    A[Ekran główny] --> B{Klik "Stwórz nowy zestaw fiszek"};
    B -- Tak --> C[User podaje tematykę fiszek];
    C --> D[AI generuje zestaw 20 fiszek];
    D --> E{User wybiera zestaw fiszek lub tworzy kolejny};
    E -- Wybiera zestaw --> F[Otwiera się sesja nauki];
    F --> G[User widzi "przód" pierwszej fiszki];
    G --> H{User klika w fiszkę};
    H -- Tak --> I[Fiszka obraca się i user widzi "tył" fiszki"];
    I --> J{User klika w zielony button};
    I --> L{User klika w czerwony button};
    J --> K[User widzi "przód" kolejnej fiszki];
    L --> M[Fiszka wraca na koniec listy fiszek w sesji];
    M --> K;
    K --> F{Zielony (wszystkie fiszki)?};
    F -- Tak --> O[Sesja się kończy, pop-up z gratulacjami];
    O --> P[User klika OK];
    P --> A;
    F -- Nie --> G;
    E -- Tworzy kolejny --> C;
```



5.3. *** Funkcjonalności poza zakresem MVP ***

Własny, zaawansowany algorytm powtórek (jak SuperMemo, Anki)
Import wielu formatów (PDF, DOCX, itp.)
Współdzielenie zestawów fiszek między użytkownikami
Integracje z innymi platformami edukacyjnymi
Aplikacje mobilne

6. *** Kryteria sukcesu *** 

75% fiszek wygenerowanych przez AI jest akceptowane przez użytkownika.

7. *** Wymagania niefunkcjonalne ***

(Na ten moment brak wymagań niefunkcjonalnych)

8. *** Interfejs użytkownika (UI) ***

Prosty i intuicyjny interfejs.
Minimalistyczny design.
Responsywność (dostosowanie do różnych rozmiarów ekranów).
Grafika generyczna dla stosów fiszek: żółty sticky-note.
Potwierdzenie usunięcia zestawu fiszek (pop-up).

9. *** Obsługa błędów i sytuacji wyjątkowych ***

Wyświetlanie komunikatów o błędach w przypadku problemów z generowaniem fiszek.
Obsługa braku połączenia z internetem.

10. *** Monitoring i logowanie błędów ***

Logowanie błędów po stronie serwera.
Monitorowanie wydajności aplikacji.

11. *** Bezpieczeństwo ***

(Na ten moment brak specyficznych wymagań dotyczących bezpieczeństwa)

12. *** Skalowalność ***

(Na ten moment brak specyficznych wymagań dotyczących skalowalności)


**Nazwa Aplikacji:** Fiszki AI



**Ocena Dopasowania Stosu Technologicznego do Wymagań PRD:**

| Kategoria | Ocena | Uzasadnienie |
|---|---|---|
| **Frontend** | Bardzo dobre | Astro zapewnia szybkie ładowanie strony i optymalizację pod kątem SEO, co jest ważne dla dostępności aplikacji. React z Shadcn/ui ułatwia tworzenie interaktywnych komponentów UI. TypeScript zwiększa bezpieczeństwo kodu. Tailwind przyspiesza proces stylowania. |
| **Backend** | Bardzo dobre | Supabase jako BaaS upraszcza zarządzanie bazą danych i autentykacją użytkowników, co pozwala skupić się na logice biznesowej aplikacji. PostgreSQL to solidna i skalowalna baza danych. |
| **AI** | Bardzo dobre | Openrouter.ai daje elastyczność w wyborze modelu AI i pozwala na optymalizację kosztów. Ustawianie limitów finansowych jest kluczowe dla kontroli budżetu. |
| **CI/CD i Hosting** | Dobre | GitHub Actions to popularne narzędzie CI/CD, a DigitalOcean to sprawdzony dostawca hostingu. Użycie obrazu Docker ułatwia wdrażanie i skalowanie aplikacji. |

**Szczegółowa Analiza:**

*   **Frontend:** Wybór Astro z React jest bardzo dobry dla aplikacji, która ma być szybka i responsywna. Astro pozwala na renderowanie większości strony po stronie serwera (SSR), co poprawia wydajność i SEO. React jest używany tylko tam, gdzie potrzebna jest interaktywność. Użycie TypeScript i Tailwind dodatkowo zwiększa produktywność i jakość kodu. Shadcn/ui przyspiesza tworzenie interfejsu użytkownika.
*   **Backend:** Supabase jest doskonałym wyborem dla MVP, ponieważ oferuje gotowe rozwiązania dla wielu typowych problemów backendowych, takich jak autentykacja, baza danych i przechowywanie plików. Pozwala to na szybkie uruchomienie aplikacji bez konieczności budowania własnego backendu od zera.
*   **AI:** Openrouter.ai jest dobrym rozwiązaniem, ponieważ daje dostęp do wielu różnych modeli AI, co pozwala na eksperymentowanie i znalezienie najlepszego modelu dla generowania fiszek. Możliwość ustawiania limitów finansowych jest bardzo ważna, aby uniknąć nieoczekiwanych kosztów.
*   **CI/CD i Hosting:** GitHub Actions i DigitalOcean to popularne i sprawdzone narzędzia, które ułatwiają automatyzację procesu wdrażania aplikacji. Użycie obrazu Docker zapewnia spójność środowiska między różnymi etapami wdrażania.

**Zalecenia:**

*   **AI:** Monitoruj koszty korzystania z Openrouter.ai i eksperymentuj z różnymi modelami, aby znaleźć optymalne rozwiązanie pod względem jakości i kosztów.
*   **CI/CD:** Zautomatyzuj proces testowania aplikacji w GitHub Actions, aby zapewnić wysoką jakość kodu.
*   **Monitoring:** Wprowadź monitoring wydajności aplikacji na DigitalOcean, aby szybko identyfikować i rozwiązywać problemy.

**Podsumowanie:**

Stos technologiczny jest dobrze dopasowany do wymagań PRD i pozwala na szybkie zbudowanie i wdrożenie MVP aplikacji Fiszki AI. Wybór nowoczesnych i popularnych technologii ułatwi znalezienie programistów i utrzymanie aplikacji w przyszłości.