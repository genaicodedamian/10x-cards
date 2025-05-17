import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ensureSupabaseClient } from "@/lib/supabaseClient"; // Import ensureSupabaseClient

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    if (!email) {
      setError("Adres e-mail jest wymagany.");
      setIsLoading(false);
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Nieprawidłowy format adresu e-mail.");
      setIsLoading(false);
      return;
    }

    try {
      const client = ensureSupabaseClient(); // Get client instance
      const redirectURL = new URL("/reset-password", window.location.origin).toString();

      const { error: supabaseError } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: redirectURL,
      });

      if (supabaseError) {
        setMessage("Jeśli konto o podanym adresie e-mail istnieje, wysłaliśmy na nie instrukcję resetowania hasła.");
      } else {
        setMessage("Jeśli konto o podanym adresie e-mail istnieje, wysłaliśmy na nie instrukcję resetowania hasła.");
      }
    } catch (catchError: any) {
      setError(catchError.message || "Wystąpił nieoczekiwany błąd podczas próby resetowania hasła.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl">Zapomniałeś hasła?</CardTitle>
          <CardDescription>
            Wprowadź swój adres e-mail. Jeśli istnieje w naszej bazie, wyślemy na niego link do zresetowania hasła.
          </CardDescription>
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
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            {message && <p className="text-sm text-green-600 text-center">{message}</p>}
            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? "Wysyłanie..." : "Wyślij link do resetowania hasła"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-sm">
          <div className="text-center">
            <a href="/login" className="underline">
              Wróć do logowania
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
