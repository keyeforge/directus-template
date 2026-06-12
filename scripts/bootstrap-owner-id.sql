-- 业务表负责人 owner_id 字段（Directus SQLite）
-- 用法: sqlite3 database/data.db < scripts/bootstrap-owner-id.sql
-- 依赖: bootstrap-customers.sql、bootstrap-opportunities.sql、bootstrap-quotes.sql
-- 执行后请重启 Directus: docker compose restart directus

ALTER TABLE customers ADD COLUMN owner_id char(36);
ALTER TABLE opportunities ADD COLUMN owner_id char(36);
ALTER TABLE quotes ADD COLUMN owner_id char(36);

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'customers', 'owner_id', 'select-dropdown-m2o', 0, 0, 16, 0,
  '{"template":"{{first_name}} {{last_name}}"}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='customers' AND field='owner_id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'opportunities', 'owner_id', 'select-dropdown-m2o', 0, 0, 20, 0,
  '{"template":"{{first_name}} {{last_name}}"}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='opportunities' AND field='owner_id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'quotes', 'owner_id', 'select-dropdown-m2o', 0, 0, 20, 0,
  '{"template":"{{first_name}} {{last_name}}"}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='quotes' AND field='owner_id');

INSERT OR IGNORE INTO directus_relations (many_collection, many_field, one_collection, one_field)
SELECT 'customers', 'owner_id', 'directus_users', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM directus_relations
  WHERE many_collection='customers' AND many_field='owner_id'
);

INSERT OR IGNORE INTO directus_relations (many_collection, many_field, one_collection, one_field)
SELECT 'opportunities', 'owner_id', 'directus_users', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM directus_relations
  WHERE many_collection='opportunities' AND many_field='owner_id'
);

INSERT OR IGNORE INTO directus_relations (many_collection, many_field, one_collection, one_field)
SELECT 'quotes', 'owner_id', 'directus_users', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM directus_relations
  WHERE many_collection='quotes' AND many_field='owner_id'
);
