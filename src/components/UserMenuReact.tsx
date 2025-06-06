import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  // AlertDialogTrigger, // We will control dialog via state
} from "@/components/ui/alert-dialog";
import { toast } from "sonner"; // Import toast
import { supabase, ensureSupabaseClient } from "@/lib/supabaseClient";

export interface UserMenuReactProps {
  userEmail: string;
}

const UserMenuReact: React.FC<UserMenuReactProps> = ({ userEmail }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  console.log("UserMenuReact rendered with email:", userEmail);
  
  // Add state for loading/submitting if needed for delete operation
  // const [isDeleting, setIsDeleting] = useState(false);

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
    // console.log("Delete account clicked. Opening confirmation dialog.");
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteAccount = async () => {
    // setIsDeleting(true); // Uncomment if you add a loading state
    try {
      const response = await fetch("/api/users/me", {
        method: "DELETE",
        credentials: "include", // Ensure cookies (session) are sent
      });

      if (response.ok) {
        // Status 204 No Content for successful DELETE
        toast.success("Konto zostało pomyślnie usunięte.");
        // Wait a bit for the toast to be visible before redirecting
        setTimeout(() => {
          window.location.assign("/register");
        }, 1500);
      } else {
        // Attempt to parse error response, fallback to generic message
        let errorMessage = "Nie udało się usunąć konta. Spróbuj ponownie.";
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Ignore parsing error, use default message
        }
        toast.error(errorMessage, {
          description: `Status: ${response.status}`,
        });
        console.error("[CLIENT UserMenuReact] Error deleting account. Status:", response.status);
      }
    } catch (e) {
      console.error("[CLIENT UserMenuReact] Exception during account deletion:", e);
      toast.error("Wystąpił błąd sieciowy podczas usuwania konta. Spróbuj ponownie.");
    } finally {
      setIsDeleteDialogOpen(false);
      // setIsDeleting(false); // Uncomment if you add a loading state
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger 
          className="justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 py-2 has-[>svg]:px-3 relative h-8 w-auto px-2 flex items-center"
          onClick={() => console.log("DropdownMenuTrigger clicked!")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-5 w-5 text-muted-foreground"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span className="text-sm font-medium">{userEmail}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        {/* AlertDialogTrigger is not needed here as we control via state */}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć swoje konto?</AlertDialogTitle>
            <AlertDialogDescription>
              Tej operacji nie można cofnąć. Spowoduje to trwałe usunięcie Twojego konta i wszystkich powiązanych z nim
              danych, w tym zestawów fiszek.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAccount}
              // Consider adding a disabled state while isDeleting is true
              // disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white" // Destructive action styling
            >
              {/* {isDeleting ? "Usuwanie..." : "Usuń konto"} */}
              Usuń konto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserMenuReact;
