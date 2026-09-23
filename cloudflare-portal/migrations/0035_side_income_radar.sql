CREATE TABLE IF NOT EXISTS side_income_opportunities (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  source_label TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL UNIQUE,
  location TEXT,
  is_remote INTEGER NOT NULL DEFAULT 0 CHECK (is_remote IN (0, 1)),
  pay_min REAL,
  pay_max REAL,
  pay_currency TEXT,
  pay_unit TEXT,
  fit_reason TEXT NOT NULL DEFAULT '',
  score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','reviewed','applied','won','lost','ignored')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_side_income_score
  ON side_income_opportunities(is_active, score DESC, first_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_side_income_status
  ON side_income_opportunities(status, is_active, first_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_side_income_source
  ON side_income_opportunities(source, is_active, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS side_income_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  run_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ok','partial','error')),
  fetched_count INTEGER NOT NULL DEFAULT 0,
  relevant_count INTEGER NOT NULL DEFAULT 0,
  new_count INTEGER NOT NULL DEFAULT 0,
  message TEXT
);

CREATE INDEX IF NOT EXISTS idx_side_income_runs_source_time
  ON side_income_runs(source, run_at DESC);

CREATE TABLE IF NOT EXISTS side_income_platform_profiles (
  source TEXT PRIMARY KEY,
  source_label TEXT NOT NULL,
  category TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('auto','profile','search')),
  source_url TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high','medium','experiment')),
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started','registered','active','skipped')),
  note TEXT,
  last_action_at TEXT
);

INSERT OR IGNORE INTO side_income_platform_profiles
(source, source_label, category, mode, source_url, priority, note)
VALUES
('alignerr','Alignerr','AI training','auto','https://www.alignerr.com/jobs','medium','AI training/evaluation; některé STEM role mají přísnější degree requirements.'),
('mercor','Mercor','AI / expert work','auto','https://work.mercor.com/explore','high','Project-based a talent-network work; často transparentní hodinová sazba.'),
('maven','Maven Research','Expert / advisory','auto','https://www.maven.co/open-projects','high','Veřejné open projects + profilový matching pro industry research a advisory.'),
('outlier','Outlier AI','AI training','profile','https://outlier.ai/','high','Flexibilní AI training; dostupnost projektů se mění podle profilu a země.'),
('prolific','Prolific Expert Network','Research / AI','profile','https://www.prolific.com/expert-network','high','Expert tasks, AI evaluation a placený research; projektový matching po registraci.'),
('braintrust','Braintrust','Contract / AI gig','profile','https://www.usebraintrust.com/for-talent','high','Remote contract roles + AI gig income; profil a skills interview zvyšují matching.'),
('guidepoint','Guidepoint','Expert network','profile','https://www.guidepoint.com/experts/','high','Placené expert calls; vhodné pro automotive/manufacturing/PM zkušenost.'),
('atheneum','Atheneum','Expert network','profile','https://www.atheneum.ai/network','high','Expert consultations; vlastní sazba a projektový matching.'),
('thirdbridge','Third Bridge','Expert network','profile','https://www.thirdbridge.com/en-us/experts','medium','Typicky hodinové expert calls, surveys a advisory engagements.'),
('newtonx','NewtonX','B2B research','profile','https://www.newtonx.com/for-professionals','medium','Placené B2B research interviews a surveys podle profesního profilu.'),
('glg','GLG','Expert network','profile','https://glginsights.com/network-members/','medium','Industry expert calls a research engagements; compliance-sensitive.'),
('alphasights','AlphaSights','Expert network','profile','https://www.alphasights.com/experts/','medium','Expert consultations podle předchozí praxe a tématu klienta.'),
('upwork','Upwork','Freelance / consulting','search','https://www.upwork.com/freelance-jobs/','medium','Vyhledávat technical PM, manufacturing, engineering consulting a analytics.'),
('contra','Contra','Freelance / contract','search','https://contra.com/featured-jobs/freelance-tech-jobs','experiment','Commission-free freelance marketplace; vhodné spíš pro PM/ops/automation experimenty.');
