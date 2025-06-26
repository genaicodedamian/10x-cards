import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";

export function RegisterForm() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);

  const validateForm = () => {
    setError(null);
    if (!email || !password || !confirmPassword) {
      setError("Wszystkie pola są wymagane.");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Nieprawidłowy format adresu e-mail.");
      return false;
    }
    if (password.length < 7) {
      setError("Hasło musi mieć co najmniej 7 znaków.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Hasła nie są zgodne.");
      return false;
    }
    return true;
  };

  const handleModalOkClick = () => {
    setShowSuccessModal(false);
    window.location.href = "/login";
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);

    if (!supabase) {
      setError("Błąd inicjalizacji klienta Supabase. Spróbuj odświeżyć stronę.");
      setIsLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      if (
        signUpError.message.includes("User already registered") ||
        signUpError.message.includes("already registered")
      ) {
        setError("Użytkownik o podanym adresie e-mail już istnieje.");
      } else {
        setError(signUpError.message || "Wystąpił błąd podczas rejestracji.");
      }
      setIsLoading(false);
      return;
    }

    if (data.user) {
      setShowSuccessModal(true);
    } else {
      setError("Rejestracja przebiegła pomyślnie, ale wystąpił problem z weryfikacją. Spróbuj zalogować się ręcznie.");
    }

    setIsLoading(false);
  };

  return (
    <>
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
                <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
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

      {showSuccessModal && (
        <AlertDialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sprawdź swoją skrzynkę e-mail</AlertDialogTitle>
              <AlertDialogDescription>
                Wysłaliśmy na adres <strong>{email}</strong> wiadomość z linkiem potwierdzającym rejestrację. Kliknij w
                link w e-mailu, aby aktywować swoje konto i móc się zalogować.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleModalOkClick}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
