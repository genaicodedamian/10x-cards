import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ensureSupabaseClient } from "@/lib/supabaseClient"; // Import ensureSupabaseClient

export function RegisterForm() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [registrationError, setRegistrationError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const validateForm = () => {
    setValidationError(null);
    if (!email || !password || !confirmPassword) {
      setValidationError("Wszystkie pola są wymagane.");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError("Nieprawidłowy format adresu e-mail.");
      return false;
    }
    if (password.length < 7) {
      setValidationError("Hasło musi mieć co najmniej 7 znaków.");
      return false;
    }
    if (password !== confirmPassword) {
      setValidationError("Hasła nie są zgodne.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegistrationError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const client = ensureSupabaseClient(); // Get client instance
      const { data, error } = await client.auth.signUp({
        email: email,
        password: password,
      });

      if (error) {
        if (error.message.includes("User already registered") || error.message.includes("already exists")) {
          setRegistrationError("Użytkownik o podanym adresie e-mail już istnieje.");
        } else {
          setRegistrationError(error.message || "Wystąpił błąd podczas rejestracji.");
        }
      } else if (data?.user) {
        // US-001: Redirect to /dashboard and toast message handled by page/navigation logic
        window.location.href = "/dashboard";
      } else {
        setRegistrationError("Nie udało się utworzyć konta. Spróbuj ponownie.");
      }
    } catch (catchError: any) {
      const message =
        catchError instanceof Error ? catchError.message : "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";
      setRegistrationError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl">Rejestracja</CardTitle>
          <CardDescription>Wprowadź swój adres e-mail i hasło, aby utworzyć konto.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Adres e-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="jan@kowalski.pl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Hasło (min. 7 znaków)</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Potwierdź hasło</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {(validationError || registrationError) && (
              <p className="text-sm text-red-500 text-center">{validationError || registrationError}</p>
            )}
            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? "Rejestrowanie..." : "Zarejestruj się"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-sm">
          <div className="text-center">
            Masz już konto?{" "}
            <a href="/login" className="underline">
              Zaloguj się
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
