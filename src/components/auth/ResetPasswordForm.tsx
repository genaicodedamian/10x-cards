import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase, ensureSupabaseClient } from "@/lib/supabaseClient"; // Assuming supabase browser client is exported from here
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"; // Import types

export function ResetPasswordForm() {
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [sessionFromRecovery, setSessionFromRecovery] = React.useState<Session | null>(null); // To store session from PASSWORD_RECOVERY

  React.useEffect(() => {
    // 1. Check for token in URL hash (common for Supabase email links)
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1)); // remove #
    const accessToken = params.get("access_token");
    const errorParam = params.get("error_description");

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      return;
    }

    // 2. Listen for onAuthStateChange for PASSWORD_RECOVERY event
    // This event indicates Supabase has processed the recovery token from the link
    // and the user is in a state where they can update their password.
    const client = ensureSupabaseClient();
    const { data: authListenerData } = client.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === "PASSWORD_RECOVERY") {
          // Supabase has handled the recovery token, session should allow password update
          // No explicit token needed for updateUser if session is correctly set by Supabase here.
          setSessionFromRecovery(session);
          setMessage("Jesteś gotowy do zresetowania hasła. Wprowadź nowe hasło poniżej.");
        } else if (event === "USER_UPDATED") {
          // This event fires after a successful password update
          setIsLoading(false);
          setMessage("Hasło zostało pomyślnie zmienione. Możesz się teraz zalogować.");
        }
      }
    );

    // If access_token was in hash and no immediate PASSWORD_RECOVERY event,
    // it implies the user just landed. The event might fire shortly.
    // If Supabase requires the token explicitly for updateUser (which is not typical if PASSWORD_RECOVERY event works),
    // you might need to store `accessToken` and use it. But usually, the event is enough.

    return () => {
      authListenerData?.subscription?.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    // setMessage(null); // Keep success message if already shown from USER_UPDATED

    if (password.length < 7) {
      setError("Hasło musi mieć co najmniej 7 znaków.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Hasła nie są zgodne.");
      return;
    }

    setIsLoading(true);

    const client = ensureSupabaseClient();
    const { error: updateError } = await client.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message || "Nie udało się zaktualizować hasła. Spróbuj ponownie lub wygeneruj nowy link.");
      setIsLoading(false);
    } else {
      // Success is handled by USER_UPDATED event, message set there.
      // If USER_UPDATED doesn't fire reliably, set message here.
      // setMessage("Hasło zostało pomyślnie zmienione. Możesz się teraz zalogować.");
    }
    // setIsLoading(false); // Moved to USER_UPDATED or error block
  };

  if (message && !error && !isLoading && message.startsWith("Hasło zostało")) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Card className="w-full max-w-sm p-6 text-center">
          <p className="text-green-600">{message}</p>
          <Button asChild className="mt-4">
            <a href="/login">Przejdź do logowania</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Ustaw nowe hasło</CardTitle>
          <CardDescription>
            {sessionFromRecovery || window.location.hash.includes("access_token")
              ? "Wprowadź swoje nowe hasło poniżej. Musi ono zawierać co najmniej 7 znaków."
              : "Oczekuję na przetworzenie linku resetującego... Jeśli nic się nie dzieje, upewnij się, że link jest poprawny."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(sessionFromRecovery || window.location.hash.includes("access_token")) && (
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-password">Nowe hasło</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-new-password">Potwierdź nowe hasło</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              {message && !message.startsWith("Hasło zostało") && (
                <p className="text-sm text-blue-500 text-center">{message}</p>
              )}
              <Button
                type="submit"
                className="w-full mt-2"
                disabled={isLoading || (!sessionFromRecovery && !window.location.hash.includes("access_token"))}
              >
                {isLoading ? "Ustawianie..." : "Ustaw nowe hasło"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
