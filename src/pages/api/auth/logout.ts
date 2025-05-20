import type { APIRoute } from 'astro';

// Corrected cookie name based on browser inspection
const supabaseAuthCookieNames = [
  'sb-auth-token', 
  // If there were separate access and refresh HttpOnly cookies, list them here.
  // Based on the screenshot, only 'sb-auth-token' is visible as the primary HttpOnly auth cookie.
];

export const POST: APIRoute = async ({ cookies, request }) => {
  console.log("[API /api/auth/logout] Received POST request.");

  // Log all cookies present when the request hits the server
  const allCookiesPresent: { name: string; value: string }[] = [];
  for (const cookie of cookies.headers()) { // cookies.headers() gives raw Set-Cookie strings, not what we want here.
                                          // We need to iterate through known or expected cookies or all readable cookies.
    // A better way to list cookies is to iterate through expected names or check one by one.
    // AstroCookies doesn't have a simple .listAllReadable() method.
    // For debugging, let's check our target cookies and some common ones.
  }
  // Let's refine the logging for cookies present on arrival:
  console.log("[API /api/auth/logout] Checking for specific cookies on arrival:");
  const initialCookieStates: Record<string, string | undefined> = {};
  supabaseAuthCookieNames.forEach(name => {
    if (cookies.has(name)) {
      initialCookieStates[name] = cookies.get(name)?.value; // Log value if present
    }
  });
  // Add common non-auth cookies for context if needed
  // if (cookies.has('some-other-cookie')) { initialCookieStates['some-other-cookie'] = cookies.get('some-other-cookie')?.value; }
  
  if (Object.keys(initialCookieStates).length > 0) {
    console.log("[API /api/auth/logout] Target cookies present on arrival:", initialCookieStates);
  } else {
    console.log("[API /api/auth/logout] None of the target Supabase cookies (e.g., sb-auth-token) found on arrival.");
  }

  console.log("[API /api/auth/logout] Attempting to delete Supabase session cookies:", supabaseAuthCookieNames);
  supabaseAuthCookieNames.forEach(cookieName => {
    if (cookies.has(cookieName)) {
      console.log(`[API /api/auth/logout] Cookie "${cookieName}" found. Deleting...`);
      cookies.delete(cookieName, {
        path: '/', // Should match the cookie's path attribute
        // domain: 'localhost', // Optional: if domain was set, match it. Usually not needed for localhost.
        // secure: false, // Match how it was set (likely false for http://localhost)
        // httpOnly: true, // Match how it was set
      });
      console.log(`[API /api/auth/logout] Attempted deletion of cookie "${cookieName}".`);
    } else {
      console.log(`[API /api/auth/logout] Cookie "${cookieName}" not found, no action for this cookie.`);
    }
  });

  // It's hard to verify deletion effectively here on the server side in the same request 
  // as cookies.delete() modifies headers for the *response*.
  // The browser will process these Set-Cookie headers with Max-Age=0.
  console.log("[API /api/auth/logout] Deletion headers prepared for response.");

  console.log("[API /api/auth/logout] Sending 200 OK response.");
  return new Response(JSON.stringify({ message: 'Session cookie (sb-auth-token) deletion attempted by server' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

// Ensure this API route is not prerendered if it needs to execute on each request
export const prerender = false; 