import { z } from 'zod';

export const GetFlashcardSetsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10).transform(val => Math.min(val, 100)), // Max limit 100
  sort_by: z.enum(['name', 'created_at', 'updated_at', 'last_studied_at']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const UpdateFlashcardSetParamsSchema = z.object({
  setId: z.string().uuid({ message: "Nieprawidłowy format UUID dla setId." })
});

export const UpdateFlashcardSetBodySchema = z.object({
  name: z.string().min(1, { message: "Nazwa jest wymagana i nie może być pusta." }).max(255, { message: "Nazwa nie może przekraczać 255 znaków." })
}); 