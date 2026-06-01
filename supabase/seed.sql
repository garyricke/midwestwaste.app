-- Midwest Waste .app — FAKE hauler seed data (Fox Valley, WI)
-- Placeholder data for testing the matching engine. Replace with real haulers
-- before go-live. Coordinates are real town centroids so distance math is sane.
--
-- Nationwide note: these only cover the Fox Valley. An order outside ~50mi of
-- these points will (correctly) land in `needs_manual_assignment` — exercising
-- the no-local-hauler fallback workflow.

insert into haulers (name, contact_email, contact_phone, address, city, state, zip, latitude, longitude, service_radius_miles) values
  ('Bear Claw Hauling',     'fake+bearclaw@midwestwaste.app',  '920-555-0101', '100 Roll-Off Rd',   'Appleton',    'WI', '54911', 44.2773, -88.3976, 40),
  ('Fox River Roll-Off',    'fake+foxriver@midwestwaste.app',  '920-555-0102', '22 Riverside Dr',   'Oshkosh',     'WI', '54901', 44.0247, -88.5426, 35),
  ('Tundra Disposal',       'fake+tundra@midwestwaste.app',    '920-555-0103', '7 Glacier Way',     'Neenah',      'WI', '54956', 44.1858, -88.4626, 30),
  ('Northwoods Container',  'fake+northwoods@midwestwaste.app','920-555-0104', '480 Pine St',       'Green Bay',   'WI', '54301', 44.5133, -88.0133, 45),
  ('Valley Junk Co',        'fake+valleyjunk@midwestwaste.app','920-555-0105', '15 Depot Ave',      'Kaukauna',    'WI', '54130', 44.2780, -88.2746, 25),
  ('Lakeside Waste',        'fake+lakeside@midwestwaste.app',  '920-555-0106', '900 Lakeshore Dr',  'Fond du Lac', 'WI', '54935', 43.7730, -88.4470, 40)
on conflict do nothing;
