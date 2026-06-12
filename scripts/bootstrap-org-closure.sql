-- 组织闭包表（部门树 + 汇报链）
-- 用法: sqlite3 database/data.db < scripts/bootstrap-org-closure.sql
-- 依赖: bootstrap-departments.sql、bootstrap-user-org-fields.sql
-- 执行后请重启 Directus: docker compose restart directus

CREATE TABLE IF NOT EXISTS department_closure (
  ancestor_id INTEGER NOT NULL,
  descendant_id INTEGER NOT NULL,
  PRIMARY KEY (ancestor_id, descendant_id)
);

CREATE TABLE IF NOT EXISTS user_reporting_closure (
  manager_id char(36) NOT NULL,
  subordinate_id char(36) NOT NULL,
  PRIMARY KEY (manager_id, subordinate_id)
);

INSERT OR IGNORE INTO directus_collections
  (collection, icon, note, display_template, hidden, singleton, accountability, collapse, versioning)
VALUES
  ('department_closure', 'account_tree', '部门闭包', NULL, 1, 0, 'all', 'closed', 0);

INSERT OR IGNORE INTO directus_collections
  (collection, icon, note, display_template, hidden, singleton, accountability, collapse, versioning)
VALUES
  ('user_reporting_closure', 'supervisor_account', '汇报链闭包', NULL, 1, 0, 'all', 'closed', 0);

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'department_closure', 'ancestor_id', 'numeric', 1, 0, 1, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='department_closure' AND field='ancestor_id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'department_closure', 'descendant_id', 'numeric', 1, 0, 2, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='department_closure' AND field='descendant_id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'user_reporting_closure', 'manager_id', 'input', 1, 0, 1, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='user_reporting_closure' AND field='manager_id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'user_reporting_closure', 'subordinate_id', 'input', 1, 0, 2, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='user_reporting_closure' AND field='subordinate_id');
