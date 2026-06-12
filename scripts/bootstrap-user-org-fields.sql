-- 用户组织字段扩展（Directus SQLite）
-- 用法: sqlite3 database/data.db < scripts/bootstrap-user-org-fields.sql
-- 依赖: bootstrap-departments.sql
-- 执行后请重启 Directus: docker compose restart directus

ALTER TABLE directus_users ADD COLUMN department_id INTEGER;
ALTER TABLE directus_users ADD COLUMN manager_id char(36);

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'directus_users', 'department_id', 'select-dropdown-m2o', 0, 0, 20, 0,
  '{"template":"{{name}}"}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='directus_users' AND field='department_id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'directus_users', 'manager_id', 'select-dropdown-m2o', 0, 0, 21, 0,
  '{"template":"{{first_name}} {{last_name}}"}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='directus_users' AND field='manager_id');

INSERT OR IGNORE INTO directus_relations (many_collection, many_field, one_collection, one_field)
SELECT 'directus_users', 'department_id', 'departments', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM directus_relations
  WHERE many_collection='directus_users' AND many_field='department_id'
);

INSERT OR IGNORE INTO directus_relations (many_collection, many_field, one_collection, one_field)
SELECT 'directus_users', 'manager_id', 'directus_users', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM directus_relations
  WHERE many_collection='directus_users' AND many_field='manager_id'
);
