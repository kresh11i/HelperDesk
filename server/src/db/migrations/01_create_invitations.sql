CREATE TABLE public.invitations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    email text NOT NULL,
    role int NOT NULL,
    token text NOT NULL UNIQUE,
    status text DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Note: Ensure to create this table in Supabase Dashboard SQL Editor
