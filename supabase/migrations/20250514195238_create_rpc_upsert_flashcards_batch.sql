CREATE OR REPLACE FUNCTION public.upsert_flashcards_batch_and_update_set_stats(
    p_requesting_user_id UUID,
    p_target_set_id UUID,
    p_flashcards_data JSONB
)
RETURNS JSONB -- Zwraca obiekt JSON z created_flashcards i errors
AS $$
DECLARE
    v_flashcard_input JSONB;
    v_new_flashcard RECORD; -- Do przechowywania wyniku z INSERT ... RETURNING *
    v_created_flashcards JSONB[] := ARRAY[]::JSONB[];
    v_errors JSONB[] := ARRAY[]::JSONB[];
    v_successful_inserts_count INTEGER := 0;
    v_ai_generated_unedited_inserts_count INTEGER := 0;
    v_set_exists BOOLEAN;
BEGIN
    -- Weryfikacja, czy zestaw należy do użytkownika (dodatkowe zabezpieczenie)
    SELECT EXISTS (
        SELECT 1 FROM public.flashcard_sets
        WHERE id = p_target_set_id AND user_id = p_requesting_user_id
    ) INTO v_set_exists;

    IF NOT v_set_exists THEN
        RAISE EXCEPTION 'Flashcard set % not found for user %', p_target_set_id, p_requesting_user_id USING ERRCODE = 'P0002'; -- Custom error for "Set not found"
    END IF;

    -- Pętla po danych wejściowych fiszek
    FOR v_flashcard_input IN SELECT * FROM jsonb_array_elements(p_flashcards_data)
    LOOP
        BEGIN -- Wewnętrzny blok BEGIN/EXCEPTION tylko dla unique_violation
            INSERT INTO public.flashcards (set_id, user_id, front, back, source, created_at, updated_at)
            VALUES (
                p_target_set_id,
                p_requesting_user_id,
                v_flashcard_input->>'front',
                v_flashcard_input->>'back',
                v_flashcard_input->>'source',
                NOW(),
                NOW()
            )
            RETURNING * INTO v_new_flashcard;

            v_successful_inserts_count := v_successful_inserts_count + 1;
            IF (v_flashcard_input->>'source') = 'ai_generated' THEN
                v_ai_generated_unedited_inserts_count := v_ai_generated_unedited_inserts_count + 1;
            END IF;
            v_created_flashcards := array_append(v_created_flashcards, row_to_json(v_new_flashcard)::JSONB);

        EXCEPTION
            WHEN unique_violation THEN -- Kod błędu SQLSTATE '23505'
                v_errors := array_append(v_errors, jsonb_build_object(
                    'input_flashcard', v_flashcard_input,
                    'error_message', 'Flashcard with these front and back values already exists in this set.'
                ));
            -- Inne błędy (nie unique_violation) nie są tutaj łapane; przerwą ten wewnętrzny blok
            -- i zostaną złapane przez zewnętrzny blok EXCEPTION (poniżej), powodując rollback całej transakcji RPC.
        END; -- Koniec wewnętrznego bloku
    END LOOP;

    -- Aktualizacja liczników w tabeli flashcard_sets, jeśli były udane inserty
    IF v_successful_inserts_count > 0 THEN
        UPDATE public.flashcard_sets
        SET
            total_flashcards_count = total_flashcards_count + v_successful_inserts_count,
            accepted_unedited_count = accepted_unedited_count + v_ai_generated_unedited_inserts_count,
            updated_at = NOW()
        WHERE id = p_target_set_id AND user_id = p_requesting_user_id; -- Ponownie, upewnij się, że user_id jest sprawdzany
    END IF;

    -- Zwrócenie wyniku
    RETURN jsonb_build_object(
        'created_flashcards', COALESCE(array_to_json(v_created_flashcards)::JSONB, '[]'::JSONB),
        'errors', COALESCE(array_to_json(v_errors)::JSONB, '[]'::JSONB)
    );

EXCEPTION
    WHEN OTHERS THEN -- Łapie wszystkie inne błędy (np. błędy z INSERT inne niż unique_violation, błędy z UPDATE liczników)
        RAISE WARNING 'RPC upsert_flashcards_batch_and_update_set_stats failed. UserID: %, SetID: %. Error: % - %',
            p_requesting_user_id, p_target_set_id, SQLSTATE, SQLERRM;
        -- Rzucenie wyjątku dalej spowoduje, że Supabase .rpc() w TypeScript zwróci błąd
        RAISE; -- Rzuca ponownie ostatni błąd, co zapewni rollback transakcji RPC
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER; 