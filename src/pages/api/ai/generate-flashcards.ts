import type { APIRoute } from 'astro';
import { z } from 'zod';
import type { AIGenerateFlashcardsCommand, AIGenerateFlashcardsResponseDto } from '../../../types';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // 2. Uwierzytelnianie
  const { session, supabase } = locals;
  const user = session?.user;

  if (!user) {
    return new Response(JSON.stringify({ message: 'Unauthorized: User not authenticated' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  const userId = user.id;

  // 3. Walidacja żądania
  const AiGenerateFlashcardsCommandSchema = z.object({
    text: z.string().min(1000, { message: "Text must be at least 1000 characters long." }).max(10000, { message: "Text must be at most 10000 characters long." }),
  });

  let command: AIGenerateFlashcardsCommand;
  try {
    const body = await request.json();
    command = AiGenerateFlashcardsCommandSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ message: 'Bad Request: Invalid input data.', errors: error.format() }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    return new Response(JSON.stringify({ message: 'Bad Request: Could not parse JSON body.' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Placeholder for further implementation
  return new Response(JSON.stringify({ message: 'Endpoint in progress', userId, receivedText: command.text.substring(0, 50) + "..." }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}; 