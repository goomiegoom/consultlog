-- Fix: logs.consultant_id had no ON DELETE action, blocking auth user deletion.
-- Drop and re-add the constraint with ON DELETE CASCADE so deleting a user
-- also removes their meeting logs.

ALTER TABLE logs DROP CONSTRAINT logs_consultant_id_fkey;
ALTER TABLE logs ADD CONSTRAINT logs_consultant_id_fkey
  FOREIGN KEY (consultant_id) REFERENCES profiles(id) ON DELETE CASCADE;
