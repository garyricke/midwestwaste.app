-- Midwest Waste .app — placeholder hauler seed (Fox Valley, ILLINOIS)
--
-- These are REAL locally-owned dumpster/roll-off companies operating in the
-- Illinois Fox Valley (Aurora / Sugar Grove / Batavia / St. Charles / Yorkville
-- corridor, west of Chicago) — the area Midwest Waste serves. Company names and
-- cities are real; CONTACT INFO IS FAKE on purpose (fake+slug@midwestwaste.app,
-- 630-555-01xx) so testing never emails a real business. Replace with onboarded
-- haulers + real contacts before go-live (or manage via /admin/haulers).
--
-- Coordinates are ZIP centroids so distance matching is realistic.

insert into haulers (name, contact_email, contact_phone, address, city, state, zip, latitude, longitude, service_radius_miles) values
  ('Dan''s Hauling Company',          'fake+danshauling@midwestwaste.app',  '630-555-0101', null, 'Batavia',       'IL', '60510', 41.8482, -88.3098, 30),
  ('DDT Dumpster Rentals',            'fake+ddt@midwestwaste.app',          '630-555-0102', null, 'St. Charles',   'IL', '60174', 41.9194, -88.3070, 30),
  ('Roadrunner Roll-Offs',            'fake+roadrunner@midwestwaste.app',   '630-555-0103', null, 'St. Charles',   'IL', '60174', 41.9194, -88.3070, 30),
  ('Fox Valley Dumpster Rentals LLC', 'fake+foxvalley@midwestwaste.app',    '630-555-0104', null, 'Yorkville',     'IL', '60560', 41.6387, -88.4438, 25),
  ('Dumpster Rental Pros of Aurora',  'fake+aurorapros@midwestwaste.app',   '630-555-0105', null, 'Aurora',        'IL', '60505', 41.7582, -88.2971, 25),
  ('Junk Nurse',                      'fake+junknurse@midwestwaste.app',    '630-555-0106', null, 'Aurora',        'IL', '60506', 41.7664, -88.3446, 25)
on conflict do nothing;
