-- 商机管理集合（Directus SQLite）
-- 用法: sqlite3 database/data.db < scripts/bootstrap-opportunities.sql
-- 执行后请重启 Directus: docker compose restart directus
-- 依赖: 需先执行 bootstrap-customers.sql

CREATE TABLE IF NOT EXISTS opportunities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  contact_id INTEGER,
  name varchar(255) NOT NULL,
  amount REAL,
  stage varchar(64) DEFAULT 'initial',
  probability INTEGER DEFAULT 10,
  owner_name varchar(255),
  expected_close_date datetime,
  source varchar(64),
  notes TEXT
);

INSERT OR IGNORE INTO directus_collections
  (collection, icon, note, display_template, hidden, singleton, accountability, collapse, versioning)
VALUES
  ('opportunities', 'trending_up', '商机管理', '{{name}}', 0, 0, 'all', 'open', 0);

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'opportunities', 'id', 'numeric', 1, 1, 1, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='opportunities' AND field='id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'opportunities', 'customer_id', 'select-dropdown-m2o', 0, 0, 2, 1,
  '{"template":"{{name}}"}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='opportunities' AND field='customer_id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'opportunities', 'contact_id', 'select-dropdown-m2o', 0, 0, 3, 0,
  '{"template":"{{name}}"}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='opportunities' AND field='contact_id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'opportunities', 'name', 'input', 0, 0, 4, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='opportunities' AND field='name');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'opportunities', 'amount', 'input', 0, 0, 5, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='opportunities' AND field='amount');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'opportunities', 'stage', 'select-dropdown', 0, 0, 6, 0,
  '{"choices":[{"text":"初步接洽","value":"initial"},{"text":"需求确认","value":"requirement"},{"text":"方案报价","value":"proposal"},{"text":"商务谈判","value":"negotiation"},{"text":"已赢单","value":"won"},{"text":"已输单","value":"lost"}]}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='opportunities' AND field='stage');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'opportunities', 'probability', 'input', 0, 0, 7, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='opportunities' AND field='probability');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'opportunities', 'owner_name', 'input', 0, 0, 8, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='opportunities' AND field='owner_name');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'opportunities', 'expected_close_date', 'datetime', 0, 0, 9, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='opportunities' AND field='expected_close_date');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'opportunities', 'source', 'select-dropdown', 0, 0, 10, 0,
  '{"choices":[{"text":"官网","value":"website"},{"text":"转介绍","value":"referral"},{"text":"展会","value":"exhibition"},{"text":"广告","value":"ads"},{"text":"电话营销","value":"telemarketing"},{"text":"其他","value":"other"}]}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='opportunities' AND field='source');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'opportunities', 'notes', 'input-multiline', 0, 0, 11, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='opportunities' AND field='notes');

INSERT OR IGNORE INTO directus_relations
  (many_collection, many_field, one_collection, one_field, one_collection_field, one_allowed_collections, junction_field, sort_field, one_deselect_action)
VALUES
  ('opportunities', 'customer_id', 'customers', NULL, NULL, NULL, NULL, NULL, 'nullify');

INSERT OR IGNORE INTO directus_relations
  (many_collection, many_field, one_collection, one_field, one_collection_field, one_allowed_collections, junction_field, sort_field, one_deselect_action)
VALUES
  ('opportunities', 'contact_id', 'contacts', NULL, NULL, NULL, NULL, NULL, 'nullify');
