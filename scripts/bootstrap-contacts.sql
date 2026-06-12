-- 联系人管理集合（Directus SQLite）
-- 用法: sqlite3 database/data.db < scripts/bootstrap-contacts.sql
-- 执行后请重启 Directus: docker compose restart directus
-- 依赖: 需先执行 bootstrap-customers.sql

CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  name varchar(255) NOT NULL,
  title varchar(128),
  department varchar(128),
  phone varchar(64),
  mobile varchar(64),
  email varchar(255),
  gender varchar(16),
  wechat varchar(128),
  is_primary INTEGER DEFAULT 0,
  notes TEXT
);

INSERT OR IGNORE INTO directus_collections
  (collection, icon, note, display_template, hidden, singleton, accountability, collapse, versioning)
VALUES
  ('contacts', 'contact_page', '联系人管理', '{{name}}', 0, 0, 'all', 'open', 0);

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'contacts', 'id', 'numeric', 1, 1, 1, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='contacts' AND field='id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'contacts', 'customer_id', 'select-dropdown-m2o', 0, 0, 2, 1,
  '{"template":"{{name}}"}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='contacts' AND field='customer_id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'contacts', 'name', 'input', 0, 0, 3, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='contacts' AND field='name');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'contacts', 'title', 'input', 0, 0, 4, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='contacts' AND field='title');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'contacts', 'department', 'input', 0, 0, 5, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='contacts' AND field='department');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'contacts', 'phone', 'input', 0, 0, 6, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='contacts' AND field='phone');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'contacts', 'mobile', 'input', 0, 0, 7, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='contacts' AND field='mobile');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'contacts', 'email', 'input', 0, 0, 8, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='contacts' AND field='email');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'contacts', 'gender', 'select-dropdown', 0, 0, 9, 0,
  '{"choices":[{"text":"男","value":"male"},{"text":"女","value":"female"},{"text":"其他","value":"other"}]}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='contacts' AND field='gender');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'contacts', 'wechat', 'input', 0, 0, 10, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='contacts' AND field='wechat');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'contacts', 'is_primary', 'boolean', 0, 0, 11, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='contacts' AND field='is_primary');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'contacts', 'notes', 'input-multiline', 0, 0, 12, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='contacts' AND field='notes');

INSERT OR IGNORE INTO directus_relations
  (many_collection, many_field, one_collection, one_field, one_collection_field, one_allowed_collections, junction_field, sort_field, one_deselect_action)
VALUES
  ('contacts', 'customer_id', 'customers', NULL, NULL, NULL, NULL, NULL, 'nullify');
