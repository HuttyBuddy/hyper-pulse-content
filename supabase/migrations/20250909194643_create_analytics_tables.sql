-- This is the content for your new .sql file

CREATE TABLE predictive_results (
    id bigserial PRIMARY KEY,
    user_id uuid REFERENCES auth.users,
    input_data jsonb,
    prediction float,
    created_at timestamptz DEFAULT now()
);

-- You can add more ALTER TABLE or CREATE TABLE statements here