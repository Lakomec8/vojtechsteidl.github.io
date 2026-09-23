CREATE TABLE IF NOT EXISTS tutoring_outbound_contacts (
  id TEXT PRIMARY KEY,
  campaign TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('company', 'university')),
  organization TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'written' CHECK (status IN ('written', 'replied', 'interested', 'converted', 'rejected', 'followup')),
  sent_at TEXT,
  updated_at TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_tutoring_outbound_campaign_status
  ON tutoring_outbound_contacts(campaign, status, sent_at DESC);

INSERT OR IGNORE INTO tutoring_outbound_contacts
  (id, campaign, target_type, organization, status, sent_at, updated_at, note)
VALUES
  ('benefit-mann-hummel', 'Doučování jako benefit · firmy', 'company', 'MANN+HUMMEL', 'written', '2026-09-23', '2026-09-23', ''),
  ('benefit-swoboda', 'Doučování jako benefit · firmy', 'company', 'Swoboda CZ', 'written', '2026-09-23', '2026-09-23', ''),
  ('benefit-icom', 'Doučování jako benefit · firmy', 'company', 'ICOM transport', 'written', '2026-09-23', '2026-09-23', ''),
  ('benefit-hettich', 'Doučování jako benefit · firmy', 'company', 'Hettich ČR', 'written', '2026-09-23', '2026-09-23', ''),
  ('benefit-aco', 'Doučování jako benefit · firmy', 'company', 'ACO Industries', 'written', '2026-09-23', '2026-09-23', ''),
  ('benefit-valeo', 'Doučování jako benefit · firmy', 'company', 'Valeo Humpolec', 'written', '2026-09-23', '2026-09-23', ''),
  ('benefit-marelli', 'Doučování jako benefit · firmy', 'company', 'Marelli Automotive Lighting Jihlava', 'written', '2026-09-23', '2026-09-23', ''),
  ('benefit-futaba', 'Doučování jako benefit · firmy', 'company', 'Futaba Czech', 'written', '2026-09-23', '2026-09-23', ''),
  ('benefit-tedom', 'Doučování jako benefit · firmy', 'company', 'TEDOM', 'written', '2026-09-23', '2026-09-23', ''),
  ('benefit-gce', 'Doučování jako benefit · firmy', 'company', 'GCE', 'written', '2026-09-23', '2026-09-23', ''),
  ('benefit-pks', 'Doučování jako benefit · firmy', 'company', 'PKS holding / PKS stavby', 'written', '2026-09-23', '2026-09-23', ''),
  ('benefit-hartmann', 'Doučování jako benefit · firmy', 'company', 'HARTMANN-RICO', 'written', '2026-09-23', '2026-09-23', ''),
  ('benefit-zdar', 'Doučování jako benefit · firmy', 'company', 'ZDAR', 'written', '2026-09-23', '2026-09-23', ''),
  ('benefit-teleflex', 'Doučování jako benefit · firmy', 'company', 'Teleflex / ARROW International CR', 'written', '2026-09-23', '2026-09-23', ''),
  ('benefit-prysmian', 'Doučování jako benefit · firmy', 'company', 'Prysmian Group · Velké Meziříčí', 'written', '2026-09-23', '2026-09-23', ''),

  ('uni-vspj', 'Podpora prváků · vysoké školy', 'university', 'VŠPJ Jihlava', 'written', '2026-09-23', '2026-09-23', ''),
  ('uni-vut-fsi', 'Podpora prváků · vysoké školy', 'university', 'VUT · Fakulta strojního inženýrství', 'written', '2026-09-23', '2026-09-23', ''),
  ('uni-vut-fekt', 'Podpora prváků · vysoké školy', 'university', 'VUT · FEKT', 'written', '2026-09-23', '2026-09-23', ''),
  ('uni-vut-fast', 'Podpora prváků · vysoké školy', 'university', 'VUT · Fakulta stavební', 'written', '2026-09-23', '2026-09-23', ''),
  ('uni-vut-fp', 'Podpora prváků · vysoké školy', 'university', 'VUT · Fakulta podnikatelská', 'written', '2026-09-23', '2026-09-23', ''),
  ('uni-upce-fei', 'Podpora prváků · vysoké školy', 'university', 'UPCE · FEI', 'written', '2026-09-23', '2026-09-23', ''),
  ('uni-upce-dfjp', 'Podpora prváků · vysoké školy', 'university', 'UPCE · Dopravní fakulta Jana Pernera', 'written', '2026-09-23', '2026-09-23', ''),
  ('uni-upce-fcht', 'Podpora prváků · vysoké školy', 'university', 'UPCE · Fakulta chemicko-technologická', 'written', '2026-09-23', '2026-09-23', ''),
  ('uni-upce-fes', 'Podpora prváků · vysoké školy', 'university', 'UPCE · Fakulta ekonomicko-správní', 'written', '2026-09-23', '2026-09-23', ''),
  ('uni-vse', 'Podpora prváků · vysoké školy', 'university', 'VŠE Praha', 'written', '2026-09-23', '2026-09-23', ''),
  ('uni-cvut-fs', 'Podpora prváků · vysoké školy', 'university', 'ČVUT · Fakulta strojní', 'written', '2026-09-23', '2026-09-23', ''),
  ('uni-cvut-fel', 'Podpora prváků · vysoké školy', 'university', 'ČVUT · FEL', 'written', '2026-09-23', '2026-09-23', ''),
  ('uni-cvut-fsv', 'Podpora prváků · vysoké školy', 'university', 'ČVUT · Fakulta stavební', 'written', '2026-09-23', '2026-09-23', ''),
  ('uni-cvut-fbmi', 'Podpora prváků · vysoké školy', 'university', 'ČVUT · FBMI', 'written', '2026-09-23', '2026-09-23', ''),
  ('uni-vsb-fei', 'Podpora prváků · vysoké školy', 'university', 'VŠB-TUO · FEI', 'written', '2026-09-23', '2026-09-23', ''),
  ('uni-vsb-fs', 'Podpora prváků · vysoké školy', 'university', 'VŠB-TUO · Fakulta strojní', 'written', '2026-09-23', '2026-09-23', ''),
  ('uni-vsb-fast', 'Podpora prváků · vysoké školy', 'university', 'VŠB-TUO · Fakulta stavební', 'written', '2026-09-23', '2026-09-23', ''),
  ('uni-mendelu-af', 'Podpora prváků · vysoké školy', 'university', 'MENDELU · Agronomická fakulta', 'written', '2026-09-23', '2026-09-23', ''),
  ('uni-mendelu-ldf', 'Podpora prváků · vysoké školy', 'university', 'MENDELU · Lesnická a dřevařská fakulta', 'written', '2026-09-23', '2026-09-23', ''),
  ('uni-tul-fs', 'Podpora prváků · vysoké školy', 'university', 'TUL · Fakulta strojní', 'written', '2026-09-23', '2026-09-23', ''),
  ('uni-zcu-fav', 'Podpora prváků · vysoké školy', 'university', 'ZČU · Fakulta aplikovaných věd', 'written', '2026-09-23', '2026-09-23', '');
