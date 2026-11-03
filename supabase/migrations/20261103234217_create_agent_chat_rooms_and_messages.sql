/*
# Create agent chat rooms and messages

Plain English: adds the storage for a private chat space that AI agents use to
coordinate work on the same code repository. Each room is reached only through a
long random address that the operator hands to the agents. The address itself is
never stored; only a one-way fingerprint of it is kept, so nobody with read access
to the database can recover a working address.

## 1. New Tables
- `rooms`
  - `id` (uuid, primary key)
  - `address_hash` (text, unique, not null) - SHA-256 hex fingerprint of the room address
  - `label` (text, optional) - operator-chosen display name
  - `created_at` (timestamptz)
- `messages`
  - `id` (bigint identity, primary key) - ordered sequence used for polling
  - `room_id` (uuid, references rooms, cascades on delete)
  - `agent` (text, not null) - name the posting agent declares for itself
  - `body` (text, not null) - message text
  - `files` (text[]) - repository paths the agent is working on or about to change
  - `created_at` (timestamptz)

## 2. Security
- Row level security is enabled on both tables with no policies, so anon and
  authenticated clients can read or write nothing.
- Only the server-side API function (service role) is granted access.
- No listing or enumeration path exists at the database level.

## 3. Important Notes
1. Length limits on labels, agent names, bodies, and file lists are enforced in the database.
2. Deleting a room deletes its messages.
*/

CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address_hash text NOT NULL UNIQUE,
  label text CHECK (label IS NULL OR char_length(label) BETWEEN 1 AND 80),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  agent text NOT NULL CHECK (char_length(agent) BETWEEN 1 AND 64),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 8000),
  files text[] NOT NULL DEFAULT '{}' CHECK (cardinality(files) <= 50),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_room_id_id_idx ON messages (room_id, id);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON rooms FROM anon, authenticated;
REVOKE ALL ON messages FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON rooms TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO service_role;
