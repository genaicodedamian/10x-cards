import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RegisterForm } from './RegisterForm'; // Dostosuj ścieżkę w razie potrzeby
import { supabase } from '@/lib/supabaseClient'; // Importujemy supabase

// Mockowanie supabase klienta
// Fabryka mocka dostarczy implementację, gdzie supabase.auth.signUp jest funkcją vi.fn()
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(), // signUp jest teraz funkcją mockującą Vitest
    },
  },
}));

// Rzutujemy supabase.auth.signUp na Vi.MockedFunction dla bezpieczeństwa typów i dostępu do metod mockujących
const mockedSupabaseSignUp = supabase.auth.signUp as vi.MockedFunction<typeof supabase.auth.signUp>;

describe('RegisterForm', () => {
  let windowSpy: any;

  beforeEach(() => {
    // Resetowanie wszystkich mocków (w tym mockedSupabaseSignUp) przed każdym testem
    vi.clearAllMocks();
    // Mockowanie window.location.href
    windowSpy = vi.spyOn(window, 'location', 'get');
    const mockLocation = {
        ...window.location,
        href: '',
    };
    windowSpy.mockImplementation(() => mockLocation);
    Object.defineProperty(window, 'location', {
        writable: true,
        value: { href: '' },
    });
  });

  afterEach(() => {
    windowSpy.mockRestore();
  });

  it('powinien poprawnie renderować początkowy formularz', () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText(/adres e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hasło \(min. 7 znaków\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/potwierdź hasło/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zarejestruj się/i })).toBeInTheDocument();
    expect(screen.getByText(/masz już konto\?/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /zaloguj się/i })).toHaveAttribute('href', '/login');
  });

  it('powinien aktualizować stan pól podczas wpisywania', () => {
    render(<RegisterForm />);
    const emailInput = screen.getByLabelText(/adres e-mail/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/hasło \(min. 7 znaków\)/i) as HTMLInputElement;
    const confirmPasswordInput = screen.getByLabelText(/potwierdź hasło/i) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
    expect(confirmPasswordInput.value).toBe('password123');
  });

  it('powinien wyświetlić błąd walidacji dla pustych pól', async () => {
    render(<RegisterForm />);
    fireEvent.submit(screen.getByRole('button', { name: /zarejestruj się/i }));
    await waitFor(() => {
      expect(screen.getByText('Wszystkie pola są wymagane.')).toBeInTheDocument();
    });
    expect(mockedSupabaseSignUp).not.toHaveBeenCalled();
  });

  it('powinien wyświetlić błąd walidacji dla nieprawidłowego formatu email', async () => {
    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText(/adres e-mail/i), { target: { value: 'invalid' } });
    fireEvent.change(screen.getByLabelText(/hasło \(min. 7 znaków\)/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/potwierdź hasło/i), { target: { value: 'password123' } });
    fireEvent.submit(screen.getByRole('button', { name: /zarejestruj się/i }));
    await waitFor(() => {
      expect(screen.getByText('Nieprawidłowy format adresu e-mail.')).toBeInTheDocument();
    });
  });

  it('powinien wyświetlić błąd walidacji dla za krótkiego hasła', async () => {
    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText(/adres e-mail/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/hasło \(min. 7 znaków\)/i), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText(/potwierdź hasło/i), { target: { value: '123' } });
    fireEvent.submit(screen.getByRole('button', { name: /zarejestruj się/i }));
    await waitFor(() => {
      expect(screen.getByText('Hasło musi mieć co najmniej 7 znaków.')).toBeInTheDocument();
    });
  });

  it('powinien wyświetlić błąd walidacji dla niezgodnych haseł', async () => {
    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText(/adres e-mail/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/hasło \(min. 7 znaków\)/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/potwierdź hasło/i), { target: { value: 'password456' } });
    fireEvent.submit(screen.getByRole('button', { name: /zarejestruj się/i }));
    await waitFor(() => {
      expect(screen.getByText('Hasła nie są zgodne.')).toBeInTheDocument();
    });
  });

  it('powinien pomyślnie zarejestrować użytkownika i wyświetlić modal sukcesu', async () => {
    mockedSupabaseSignUp.mockResolvedValueOnce({ data: { user: { id: '123' } }, error: null });

    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText(/adres e-mail/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/hasło \(min. 7 znaków\)/i), { target: { value: 'ValidPass123' } });
    fireEvent.change(screen.getByLabelText(/potwierdź hasło/i), { target: { value: 'ValidPass123' } });
    fireEvent.submit(screen.getByRole('button', { name: /zarejestruj się/i }));

    expect(screen.getByRole('button', { name: /rejestrowanie.../i })).toBeDisabled();

    await waitFor(() => {
      expect(mockedSupabaseSignUp).toHaveBeenCalledWith({ email: 'new@example.com', password: 'ValidPass123' });
    });
    await waitFor(() => {
      expect(screen.getByText('Rejestracja Zakończona Pomyślnie!')).toBeInTheDocument();
    });
    expect(screen.getByText('Gratulacje! Twoje konto 10x-cards zostało utworzone!')).toBeInTheDocument();
  });

  it('powinien zamknąć modal sukcesu i przekierować na /login po kliknięciu OK', async () => {
    mockedSupabaseSignUp.mockResolvedValueOnce({ data: { user: { id: '123' } }, error: null });

    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText(/adres e-mail/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/hasło \(min. 7 znaków\)/i), { target: { value: 'ValidPass123' } });
    fireEvent.change(screen.getByLabelText(/potwierdź hasło/i), { target: { value: 'ValidPass123' } });
    fireEvent.submit(screen.getByRole('button', { name: /zarejestruj się/i }));

    await waitFor(() => {
      expect(screen.getByText('Rejestracja Zakończona Pomyślnie!')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => {
      expect(screen.queryByText('Rejestracja Zakończona Pomyślnie!')).not.toBeInTheDocument();
    });
    expect(window.location.href).toBe('/login');
  });

  it('powinien wyświetlić błąd, gdy Supabase zwróci błąd (np. użytkownik istnieje)', async () => {
    mockedSupabaseSignUp.mockResolvedValueOnce({ data: {}, error: { message: 'User already registered' } });

    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText(/adres e-mail/i), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByLabelText(/hasło \(min. 7 znaków\)/i), { target: { value: 'ValidPass123' } });
    fireEvent.change(screen.getByLabelText(/potwierdź hasło/i), { target: { value: 'ValidPass123' } });
    fireEvent.submit(screen.getByRole('button', { name: /zarejestruj się/i }));

    await waitFor(() => {
      expect(screen.getByText('Użytkownik o podanym adresie e-mail już istnieje.')).toBeInTheDocument();
    });
    expect(screen.queryByText('Rejestracja Zakończona Pomyślnie!')).not.toBeInTheDocument();
  });
  
  it('powinien wyświetlić błąd, gdy Supabase zwróci ogólny błąd', async () => {
    mockedSupabaseSignUp.mockResolvedValueOnce({ data: {}, error: { message: 'Some Supabase error' } });

    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText(/adres e-mail/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/hasło \(min. 7 znaków\)/i), { target: { value: 'ValidPass123' } });
    fireEvent.change(screen.getByLabelText(/potwierdź hasło/i), { target: { value: 'ValidPass123' } });
    fireEvent.submit(screen.getByRole('button', { name: /zarejestruj się/i }));

    await waitFor(() => {
      expect(screen.getByText('Some Supabase error')).toBeInTheDocument();
    });
  });

  it('powinien wyświetlić błąd, jeśli rejestracja przebiegnie pomyślnie, ale nie ma danych użytkownika', async () => {
    mockedSupabaseSignUp.mockResolvedValueOnce({ data: { user: null }, error: null }); // Brak użytkownika w danych

    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText(/adres e-mail/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/hasło \(min. 7 znaków\)/i), { target: { value: 'ValidPass123' } });
    fireEvent.change(screen.getByLabelText(/potwierdź hasło/i), { target: { value: 'ValidPass123' } });
    fireEvent.submit(screen.getByRole('button', { name: /zarejestruj się/i }));

    await waitFor(() => {
      expect(screen.getByText('Rejestracja przebiegła pomyślnie, ale wystąpił problem z weryfikacją. Spróbuj zalogować się ręcznie.')).toBeInTheDocument();
    });
  });
  
  it('powinien wyświetlać stan ładowania na przycisku podczas rejestracji', async () => {
    mockedSupabaseSignUp.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: { user: { id: '123' } }, error: null }), 100))
    );

    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText(/adres e-mail/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/hasło \(min. 7 znaków\)/i), { target: { value: 'ValidPass123' } });
    fireEvent.change(screen.getByLabelText(/potwierdź hasło/i), { target: { value: 'ValidPass123' } });
    
    const submitButton = screen.getByRole('button', { name: /zarejestruj się/i });
    fireEvent.submit(submitButton);

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Rejestrowanie...');

    // Oczekiwanie na pojawienie się modala jako potwierdzenie zakończenia operacji
    await waitFor(() => {
      expect(screen.getByText('Rejestracja Zakończona Pomyślnie!')).toBeInTheDocument();
    }, { timeout: 500 });

    // Przycisk może pozostać wyłączony, jeśli modal jest widoczny, 
    // ale tekst powinien wrócić do normy (w tym komponencie jest to obsługiwane przez `isLoading`)
    // Sprawdzamy, czy isLoading jest false, co powinno odblokować przycisk i zmienić tekst
    // Jeśli modal się pojawia, isLoading jest resetowane
    // W tym przypadku, testujemy, czy przycisk nie jest już w stanie 'Rejestrowanie...' po pojawieniu się modala
    // ale testujemy, czy operacja się zakończyła (modal widoczny)
    expect(submitButton).toBeEnabled(); 
    expect(submitButton).toHaveTextContent('Zarejestruj się');
  });
}); 