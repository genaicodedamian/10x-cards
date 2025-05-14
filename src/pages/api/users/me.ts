import type { APIRoute } from 'astro';
import { deleteUserAccount } from '@/lib/services/user.service';

export const prerender = false;

/**
 * API endpoint to delete the authenticated user's account.
 * Method: DELETE
 * Path: /api/users/me
 */
export const DELETE: APIRoute = async ({ locals }) => {
  if (!locals.session?.user) {
    // Astro automatically throws a 401 if Astro.locals.session is not set by middleware for protected routes.
    // However, an explicit check is good for clarity and direct control over the response body/message.
    return new Response('Unauthorized: User session not found or user not authenticated.', {
      status: 401,
      statusText: 'Unauthorized'
    });
  }

  const userId = locals.session.user.id;

  try {
    await deleteUserAccount(userId);
    return new Response(null, { status: 204, statusText: 'No Content' });
  } catch (error) {
    console.error(`Failed to delete user account for user ID ${userId}:`, error);
    // Avoid sending detailed error messages like error.message to the client for security reasons.
    // The service layer already logs details if needed.
    return new Response('An error occurred while deleting your account. Please try again later.', {
      status: 500,
      statusText: 'Internal Server Error'
    });
  }
}; 