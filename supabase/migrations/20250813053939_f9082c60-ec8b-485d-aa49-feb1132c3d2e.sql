
-- Seed initial market data for user 8d7501f7-bfd9-441f-b322-6140ea961518
-- Neighborhood: Carmichael (slug: carmichael)
-- County: Sacramento County, CA
-- Report date: 2025-08-10

INSERT INTO public.market_reports (
  user_id,
  location_type,
  neighborhood,
  neighborhood_slug,
  county,
  state,
  report_date,
  median_sale_price,
  avg_price_per_sqft,
  days_on_market,
  active_listings,
  new_listings,
  closed_sales,
  months_of_inventory,
  mom_change,
  yoy_change,
  sources,
  retrieved_at
) VALUES
(
  '8d7501f7-bfd9-441f-b322-6140ea961518',
  'neighborhood',
  'Carmichael',
  'carmichael',
  'Sacramento County',
  'CA',
  '2025-08-10',
  850000,
  425,
  18,
  47,
  23,
  31,
  1.8,
  '{"price": 0.032, "dom": -0.15, "inventory": -0.12}'::jsonb,
  '{"price": 0.087, "dom": -0.28, "inventory": -0.31}'::jsonb,
  '["MLS", "County Assessor"]'::jsonb,
  now()
),
(
  '8d7501f7-bfd9-441f-b322-6140ea961518',
  'county',
  NULL,
  NULL,
  'Sacramento County',
  'CA',
  '2025-08-10',
  NULL,
  398,
  22,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '["MLS"]'::jsonb,
  now()
);
