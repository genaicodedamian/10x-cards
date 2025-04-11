# Schemat Bazy Danych - Fiszki AI

## Tabele

### `users`

- `id` [SERIAL] PRIMARY KEY
- `email` [VARCHAR(255)] NOT NULL UNIQUE
- `encrypted_password` [VARCHAR(255)] NOT NULL
- `created_at` [TIMESTAMP] NOT NULL DEFAULT NOW()
- `confirmed_at` [TIMESTAMP]
- `user_id` [UUID] NOT NULL UNIQUE

### `stacks`

- `id` [SERIAL] PRIMARY KEY
- `topic` [VARCHAR(255)] NOT NULL
- `user_id` [INTEGER] NOT NULL
- `model` [VARCHAR(255)]
- `generated_count` [INTEGER]
- `accepted_unedited_count` [INTEGER]
- `source_text_hash` [VARCHAR(255)]
- `source_text_length` [INTEGER]
- `generation_time` [INTEGER]
- `created_at` [TIMESTAMP] NOT NULL DEFAULT NOW()
- `updated_at` [TIMESTAMP] NOT NULL DEFAULT NOW()

### `flashcards`

- `id` [SERIAL] PRIMARY KEY
- `front` [VARCHAR(255)] NOT NULL
- `back` [VARCHAR(255)] NOT NULL
- `stack_id` [INTEGER] NOT NULL
- `user_id` [INTEGER] NOT NULL
- `created_at` [TIMESTAMP] NOT NULL DEFAULT NOW()
- `updated_at` [TIMESTAMP] NOT NULL DEFAULT NOW()

### `generation_error_logs`

- `id` [SERIAL] PRIMARY KEY
- `stack_id` [INTEGER] NOT NULL
- `user_id` [INTEGER] NOT NULL
- `created_at` [TIMESTAMP] NOT NULL DEFAULT NOW()
- `error_message` [TEXT] NOT NULL
- `error_code` [VARCHAR(255)]
- `model` [VARCHAR(255)]
- `request_payload` [TEXT]
- `response_payload` [TEXT]
- `stack_trace` [TEXT]

## Relacje

- `flashcards.stack_id` REFERENCES `stacks(id)`
- `flashcards.user_id` REFERENCES `users(id)`
- `stacks.user_id` REFERENCES `users(id)`
- `generation_error_logs.stack_id` REFERENCES `stacks(id)`
- `generation_error_logs.user_id` REFERENCES `users(id)`

## Indeksy

- CREATE INDEX `idx_flashcards_stack_id_user_id` ON `flashcards` (`stack_id`, `user_id`);
- CREATE INDEX `idx_stacks_user_id` ON `stacks` (`user_id`);
- CREATE INDEX `idx_generation_error_logs_stack_id_user_id` ON `generation_error_logs` (`stack_id`, `user_id`);

## Zasady Bezpieczeństwa na Poziomie Wiersza (RLS)

### `flashcards`

- ALTER TABLE `flashcards` ENABLE ROW LEVEL SECURITY;
- CREATE POLICY "Użytkownicy mogą zobaczyć tylko swoje fiszki" ON `flashcards` FOR SELECT USING (`user_id` = auth.uid());
- CREATE POLICY "Użytkownicy mogą dodać tylko swoje fiszki" ON `flashcards` FOR INSERT WITH CHECK (`user_id` = auth.uid());
- CREATE POLICY "Użytkownicy mogą edytować tylko swoje fiszki" ON `flashcards` FOR UPDATE USING (`user_id` = auth.uid()) WITH CHECK (`user_id` = auth.uid());
- CREATE POLICY "Użytkownicy mogą usunąć tylko swoje fiszki" ON `flashcards` FOR DELETE USING (`user_id` = auth.uid());

### `stacks`

- ALTER TABLE `stacks` ENABLE ROW LEVEL SECURITY;
- CREATE POLICY "Użytkownicy mogą zobaczyć tylko swoje zestawy" ON `stacks` FOR SELECT USING (`user_id` = auth.uid());
- CREATE POLICY "Użytkownicy mogą dodać tylko swoje zestawy" ON `stacks` FOR INSERT WITH CHECK (`user_id` = auth.uid());
- CREATE POLICY "Użytkownicy mogą edytować tylko swoje zestawy" ON `stacks` FOR UPDATE USING (`user_id` = auth.uid()) WITH CHECK (`user_id` = auth.uid());
- CREATE POLICY "Użytkownicy mogą usunąć tylko swoje zestawy" ON `stacks` FOR DELETE USING (`user_id` = auth.uid());

### `users`

- ALTER TABLE `users` ENABLE ROW LEVEL SECURITY;
- CREATE POLICY "Użytkownicy mogą zobaczyć tylko swój profil" ON `users` FOR SELECT USING (`user_id` = auth.uid());
- CREATE POLICY "Użytkownicy mogą edytować tylko swój profil" ON `users` FOR UPDATE USING (`user_id` = auth.uid()) WITH CHECK (`user_id` = auth.uid());

### `generation_error_logs`

- ALTER TABLE `generation_error_logs` ENABLE ROW LEVEL SECURITY;
- CREATE POLICY "Użytkownicy mogą zobaczyć tylko logi błędów dotyczące ich zestawów" ON `generation_error_logs` FOR SELECT USING (`user_id` = auth.uid());

## Dodatkowe Ustawienia

- Ustaw email na lowercase:

```sql
ALTER TABLE users ALTER COLUMN email SET DATA TYPE VARCHAR(255) COLLATE "default";
CREATE OR REPLACE FUNCTION set_user_email_lowercase()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email := lower(NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_email_lowercase_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_user_email_lowercase();
