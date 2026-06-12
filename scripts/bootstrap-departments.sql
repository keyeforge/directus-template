-- 部门管理集合（Directus SQLite）
-- 用法: sqlite3 database/data.db < scripts/bootstrap-departments.sql
-- 执行后请重启 Directus: docker compose restart directus

CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name varchar(255) NOT NULL,
  parent_id INTEGER,
  sort INTEGER DEFAULT 0
);

INSERT OR IGNORE INTO directus_collections
  (collection, icon, note, display_template, hidden, singleton, accountability, collapse, versioning)
VALUES
  ('departments', 'corporate_fare', '部门管理', '{{name}}', 0, 0, 'all', 'open', 0);

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'departments', 'id', 'numeric', 1, 1, 1, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='departments' AND field='id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'departments', 'name', 'input', 0, 0, 2, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='departments' AND field='name');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'departments', 'parent_id', 'select-dropdown-m2o', 0, 0, 3, 0,
  '{"template":"{{name}}"}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='departments' AND field='parent_id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'departments', 'sort', 'input', 0, 0, 4, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='departments' AND field='sort');

INSERT OR IGNORE INTO directus_relations (many_collection, many_field, one_collection, one_field)
SELECT 'departments', 'parent_id', 'departments', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM directus_relations
  WHERE many_collection='departments' AND many_field='parent_id'
);
