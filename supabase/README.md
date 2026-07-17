# Shared database migration authority

Pixelated Studio Edition is the sole migration authority for the shared Supabase
project. Do not run `supabase db push`, `supabase migration repair`, or create
new migration files from this User Edition repository.

The files retained here are a historical local snapshot only. New shared schema
changes belong in:

`../Pixelated-Studio-Edition/supabase/migrations`

User Edition may consume the shared API/database contract, but it does not own
or deploy that contract.
