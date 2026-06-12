-- 策略数据范围配置（Directus SQLite）
-- 用法: sqlite3 database/data.db < scripts/bootstrap-policy-data-scopes.sql
-- 执行后请重启 Directus: docker compose restart directus

CREATE TABLE IF NOT EXISTS policy_data_scopes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_id char(36) NOT NULL,
  collection varchar(64) NOT NULL,
  scope varchar(32) NOT NULL DEFAULT 'self',
  UNIQUE (policy_id, collection)
);

INSERT OR IGNORE INTO directus_collections
  (collection, icon, note, display_template, hidden, singleton, accountability, collapse, versioning)
VALUES
  ('policy_data_scopes', 'policy', '策略数据范围', '{{collection}}', 0, 0, 'all', 'open', 0);

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'policy_data_scopes', 'id', 'numeric', 1, 1, 1, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='policy_data_scopes' AND field='id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'policy_data_scopes', 'policy_id', 'select-dropdown-m2o', 0, 0, 2, 1,
  '{"template":"{{name}}"}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='policy_data_scopes' AND field='policy_id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'policy_data_scopes', 'collection', 'input', 0, 0, 3, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='policy_data_scopes' AND field='collection');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'policy_data_scopes', 'scope', 'select-dropdown', 0, 0, 4, 1,
  '{"choices":[{"text":"仅本人","value":"self"},{"text":"本人及下属","value":"subordinates"},{"text":"本部门及子部门","value":"department"},{"text":"全部","value":"all"}]}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='policy_data_scopes' AND field='scope');

INSERT OR IGNORE INTO directus_relations (many_collection, many_field, one_collection, one_field)
SELECT 'policy_data_scopes', 'policy_id', 'directus_policies', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM directus_relations
  WHERE many_collection='policy_data_scopes' AND many_field='policy_id'
);
