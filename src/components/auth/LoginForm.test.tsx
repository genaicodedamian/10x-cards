import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LoginForm } from './LoginForm'; // Dostosuj ścieżkę w razie potrzeby
import { toast } from 'sonner';

// Mockowanie 'sonner'
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(), // Dodajemy mock dla toast.error na wszelki wypadek
  },
}));

describe('LoginForm', () => {
  let windowSpy: any;

  beforeEach(() => {
    // Resetowanie mocków przed każdym testem
    vi.clearAllMocks();

    // Mockowanie window.location.href
    windowSpy = vi.spyOn(window, 'location', 'get');
    const mockLocation = {
        ...window.location,
        href: '',
    };
    windowSpy.mockImplementation(() => mockLocation);
    // Umożliwienie przypisania do href
    Object.defineProperty(window, 'location', {
        writable: true,
        value: { href: '' },
    });


    // Mockowanie globalnego fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    windowSpy.mockRestore();
    // @ts-ignore
    delete global.fetch;
  });

  it('powinien poprawnie renderować początkowy formularz', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/adres e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hasło/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zaloguj się/i })).toBeInTheDocument();
    expect(screen.getByText(/nie masz konta?/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /zarejestruj się/i })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: /zapomniałeś hasła?/i })).toHaveAttribute('href', '/forgot-password');
  });

  it('powinien aktualizować stan pól email i password podczas wpisywania', () => {
    render(<LoginForm />);
    const emailInput = screen.getByLabelText(/adres e-mail/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/hasło/i) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('powinien wyświetlić błąd walidacji dla pustych pól', async () => {
    render(<LoginForm />);
    fireEvent.submit(screen.getByRole('button', { name: /zaloguj się/i }));

    await waitFor(() => {
      expect(screen.getByText('Adres e-mail i hasło są wymagane.')).toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('powinien wyświetlić błąd walidacji dla nieprawidłowego formatu email', async () => {
    render(<LoginForm />);
    const emailInput = screen.getByLabelText(/adres e-mail/i);
    const passwordInput = screen.getByLabelText(/hasło/i);

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.submit(screen.getByRole('button', { name: /zaloguj się/i }));

    await waitFor(() => {
      expect(screen.getByText('Nieprawidłowy format adresu e-mail.')).toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('powinien pomyślnie zalogować użytkownika i przekierować', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Login successful' }),
    });

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/adres e-mail/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/hasło/i), { target: { value: 'password123' } });
    fireEvent.submit(screen.getByRole('button', { name: /zaloguj się/i }));

    expect(screen.getByRole('button', { name: /logowanie.../i })).toBeDisabled();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Zalogowano pomyślnie!'));
    await waitFor(() => expect(window.location.href).toBe('/dashboard'));
    expect(screen.queryByText(/błąd/i)).not.toBeInTheDocument();
  });

  it('powinien wyświetlić błąd logowania przy niepowodzeniu API', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/adres e-mail/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/hasło/i), { target: { value: 'wrongpassword' } });
    fireEvent.submit(screen.getByRole('button', { name: /zaloguj się/i }));

    expect(screen.getByRole('button', { name: /logowanie.../i })).toBeDisabled();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(window.location.href).not.toBe('/dashboard');
    expect(screen.getByRole('button', { name: /zaloguj się/i })).toBeEnabled();
  });

  it('powinien wyświetlić błąd logowania przy błędzie sieci', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/adres e-mail/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/hasło/i), { target: { value: 'password123' } });
    fireEvent.submit(screen.getByRole('button', { name: /zaloguj się/i }));
    
    expect(screen.getByRole('button', { name: /logowanie.../i })).toBeDisabled();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByText('Nie można połączyć się z serwerem. Spróbuj ponownie później.')).toBeInTheDocument();
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(window.location.href).not.toBe('/dashboard');
    expect(screen.getByRole('button', { name: /zaloguj się/i })).toBeEnabled();
  });
  
  it('powinien wyświetlać stan ładowania na przycisku podczas logowania', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ message: 'Login successful' }),
      }), 100))
    );

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/adres e-mail/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/hasło/i), { target: { value: 'password123' } });
    
    const submitButton = screen.getByRole('button', { name: /zaloguj się/i });
    fireEvent.submit(submitButton);

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Logowanie...');

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
      expect(submitButton).toHaveTextContent('Zaloguj się');
    }, { timeout: 500 }); // Dajemy więcej czasu na zakończenie Promise
  });
}); 