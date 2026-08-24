# HelpDeskr V1.0.0 Release Notes

Welcome to the HelpDeskr V1 stable release. This document outlines key technical decisions, known configuration notes, and pending enhancements for V1.

## 1. Supabase Migration & Schema Cache
When running SQL migrations manually in Supabase (e.g., `01_create_invitations.sql`), Supabase's PostgREST API may cache the older database schema. This can result in `PGRST205` errors ("Could not find the function... / relations...") when the application attempts to query the newly created tables via standard JWT authentication.

**Workaround / Fix:**
- If you encounter a `PGRST205` error immediately after creating tables, you must reload the Supabase schema cache.
- You can do this by executing the following SQL command in the Supabase SQL Editor:
  ```sql
  NOTIFY pgrst, 'reload schema';
  ```
- Alternatively, testing scripts that require immediate access before cache propagation can bypass RLS by using the `SERVICE_ROLE_KEY` (as seen in `server/test_matrix.js`).

## 2. Invitation Flow (Email Pending)
In V1, the organization invitation flow is fully functional at the data and authentication layer, but **does not dispatch a real email** via SMTP/email providers (e.g., SendGrid, Nodemailer). 

**Current Flow (V1):**
1. Admin clicks "Invite Member" in the Team Directory and enters the recipient's email.
2. The system generates a secure invitation token and stores it.
3. The UI surfaces the generated `localhost:5173/invite/:token` link directly to the Admin.
4. The Admin must manually copy and send this link to the invitee.

*Note: Integrating a real email dispatch service is marked as pending/optional for future V1.x iterations based on deployment environment capabilities.*

## 3. Role Management
Role management has been fully connected. Administrators can click "Manage" on any team member within the Team Directory to upgrade or downgrade their access (`Admin`, `Agent`, `User`). Changes are immediate, and the backend securely prevents unauthorized modifications.
