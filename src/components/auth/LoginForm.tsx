import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // TODO: Implement full validation and Supabase call as per auth-spec.md
  const validateForm = () => {
    if (!email || !password) {
      setValidationError("Adres e-mail i hasło są wymagane.");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError("Nieprawidłowy format adresu e-mail.");
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    // Placeholder for Supabase signInWithPassword()
    console.log("Submitting login with", { email, password });
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // TODO: Replace with actual Supabase call and error/success handling
    // Example from spec: setLoginError("Nieprawidłowy adres e-mail lub hasło.");
    // Example success: window.location.href = "/dashboard"; // toast.success("Zalogowano pomyślnie!")
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl">Logowanie</CardTitle>
          <CardDescription>Wprowadź swój adres e-mail i hasło, aby się zalogować.</CardDescription>
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
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {(loginError || validationError) && (
              <p className="text-sm text-red-500 text-center">{validationError || loginError}</p>
            )}
            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? "Logowanie..." : "Zaloguj się"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-sm">
          <div className="text-center">
            Nie masz konta?{" "}
            <a href="/register" className="underline">
              Zarejestruj się
            </a>
          </div>
          <div className="text-center">
            <a href="/forgot-password" className="underline">
              Zapomniałeś hasła?
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
