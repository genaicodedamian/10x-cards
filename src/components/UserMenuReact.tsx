import React from "react";
import { Button } from "@/components/ui/button"; // Restore Button import
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase, ensureSupabaseClient } from "@/lib/supabaseClient";

export interface UserMenuReactProps {
  userEmail: string;
}

const UserMenuReact: React.FC<UserMenuReactProps> = ({ userEmail }) => {
  React.useEffect(() => {
    try {
      ensureSupabaseClient();
      // console.log("UserMenuReact: Supabase client ensured initial.", supabase); // Keep console logs minimal for production
    } catch (error) {
      console.error("UserMenuReact: Failed to initialize Supabase client:", error);
    }
  }, []);

  const handleLogout = async () => {
    // console.log("[CLIENT UserMenuReact] handleLogout called."); // Keep console logs minimal
    let clientSignOutError = null;

    if (supabase) {
      // console.log("[CLIENT UserMenuReact] Attempting supabase.auth.signOut().");
      try {
        const { error } = await supabase.auth.signOut();
        clientSignOutError = error;
        // console.log("[CLIENT UserMenuReact] supabase.auth.signOut() completed. Error:", clientSignOutError);
        if (clientSignOutError) {
          console.error(
            "[CLIENT UserMenuReact] Error during supabase.auth.signOut():",
            clientSignOutError.message
            // clientSignOutError // Avoid logging the full error object in production if too verbose
          );
        }
      } catch (e) {
        console.error("[CLIENT UserMenuReact] Exception during supabase.auth.signOut():", e);
      }
    } else {
      console.warn("[CLIENT UserMenuReact] Supabase client not available for client-side signOut.");
    }

    try {
      // console.log("[CLIENT UserMenuReact] Calling /api/auth/logout endpoint with credentials included.");
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const responseData = await response.json();
      // console.log("[CLIENT UserMenuReact] /api/auth/logout response status:", response.status, "Data:", responseData);
      if (!response.ok) {
        console.error(
          "[CLIENT UserMenuReact] Error from /api/auth/logout endpoint. Status:",
          response.status,
          "Data:",
          responseData
        );
        // Optionally, show a user-facing error message here using a toast or similar
      }
    } catch (e) {
      console.error("[CLIENT UserMenuReact] Exception during fetch to /api/auth/logout:", e);
      // Optionally, show a user-facing error message here
    }

    // console.log("[CLIENT UserMenuReact] Current document.cookie (before redirect attempt):", document.cookie);
    // console.log("[CLIENT UserMenuReact] Redirecting to / in 100ms.");
    // No need for setTimeout if navigation is robust
    window.location.assign("/");
  };

  const handleDeleteAccountClick = () => {
    console.log("Delete account clicked. Dialog to be implemented.");
    // Future: Implement logic to open confirmation dialog for account deletion
    // For now, this is a placeholder.
    alert("Funkcjonalność usuwania konta jest w trakcie implementacji.");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-auto px-2">
          {/* Ideally, an avatar or icon would go here too */}
          <span className="text-sm font-medium">{userEmail}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Zalogowano jako</p>
            <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout}>Wyloguj</DropdownMenuItem>
        <DropdownMenuItem
          onSelect={handleDeleteAccountClick}
          className="text-red-600 hover:!text-red-600 focus:!text-red-600"
        >
          Usuń konto
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenuReact;
