import { defineMiddleware } from 'astro:middleware';
import { supabaseClient } from '../db/supabase.client';
import type { User } from '@supabase/supabase-js';

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;

  const accessToken = context.cookies.get('sb-access-token')?.value;

  let user: User | null = null;

  if (accessToken) {
    const { data } = await context.locals.supabase.auth.getUser(accessToken);
    if (data.user) {
      user = data.user;
    }
  }

  context.locals.user = user;

  return next();
}); 