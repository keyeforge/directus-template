-- 报价管理集合（Directus SQLite）
-- 用法: sqlite3 database/data.db < scripts/bootstrap-quotes.sql
-- 执行后请重启 Directus: docker compose restart directus
-- 依赖: 需先执行 bootstrap-products.sql、bootstrap-customers.sql、bootstrap-opportunities.sql

CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_no varchar(64) NOT NULL,
  opportunity_id INTEGER,
  customer_id INTEGER NOT NULL,
  contact_id INTEGER,
  title varchar(255) NOT NULL,
  total_amount REAL DEFAULT 0,
  status varchar(64) DEFAULT 'draft',
  valid_until datetime,
  owner_name varchar(255),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS quote_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  product_id INTEGER,
  item_name varchar(255) NOT NULL,
  quantity REAL DEFAULT 1,
  unit_price REAL DEFAULT 0,
  amount REAL DEFAULT 0,
  notes TEXT
);

INSERT OR IGNORE INTO directus_collections
  (collection, icon, note, display_template, hidden, singleton, accountability, collapse, versioning)
VALUES
  ('quotes', 'request_quote', '报价管理', '{{quote_no}}', 0, 0, 'all', 'open', 0);

INSERT OR IGNORE INTO directus_collections
  (collection, icon, note, display_template, hidden, singleton, accountability, collapse, versioning)
VALUES
  ('quote_items', 'list_alt', '报价明细', '{{item_name}}', 0, 0, 'all', 'open', 0);

-- quotes fields
INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'quotes', 'id', 'numeric', 1, 1, 1, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='quotes' AND field='id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'quotes', 'quote_no', 'input', 0, 0, 2, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='quotes' AND field='quote_no');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'quotes', 'opportunity_id', 'select-dropdown-m2o', 0, 0, 3, 0,
  '{"template":"{{name}}"}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='quotes' AND field='opportunity_id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'quotes', 'customer_id', 'select-dropdown-m2o', 0, 0, 4, 1,
  '{"template":"{{name}}"}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='quotes' AND field='customer_id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'quotes', 'contact_id', 'select-dropdown-m2o', 0, 0, 5, 0,
  '{"template":"{{name}}"}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='quotes' AND field='contact_id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'quotes', 'title', 'input', 0, 0, 6, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='quotes' AND field='title');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'quotes', 'total_amount', 'input', 0, 0, 7, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='quotes' AND field='total_amount');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'quotes', 'status', 'select-dropdown', 0, 0, 8, 0,
  '{"choices":[{"text":"草稿","value":"draft"},{"text":"已发送","value":"sent"},{"text":"已接受","value":"accepted"},{"text":"已拒绝","value":"rejected"},{"text":"已过期","value":"expired"}]}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='quotes' AND field='status');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'quotes', 'valid_until', 'datetime', 0, 0, 9, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='quotes' AND field='valid_until');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'quotes', 'owner_name', 'input', 0, 0, 10, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='quotes' AND field='owner_name');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'quotes', 'notes', 'input-multiline', 0, 0, 11, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='quotes' AND field='notes');

-- quote_items fields
INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'quote_items', 'id', 'numeric', 1, 1, 1, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='quote_items' AND field='id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'quote_items', 'quote_id', 'input', 0, 0, 2, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='quote_items' AND field='quote_id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'quote_items', 'product_id', 'select-dropdown-m2o', 0, 0, 3, 0,
  '{"template":"{{name}}"}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='quote_items' AND field='product_id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'quote_items', 'item_name', 'input', 0, 0, 4, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='quote_items' AND field='item_name');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'quote_items', 'quantity', 'input', 0, 0, 5, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='quote_items' AND field='quantity');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'quote_items', 'unit_price', 'input', 0, 0, 6, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='quote_items' AND field='unit_price');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'quote_items', 'amount', 'input', 0, 0, 7, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='quote_items' AND field='amount');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'quote_items', 'notes', 'input-multiline', 0, 0, 8, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='quote_items' AND field='notes');

INSERT OR IGNORE INTO directus_relations
  (many_collection, many_field, one_collection, one_field, one_collection_field, one_allowed_collections, junction_field, sort_field, one_deselect_action)
VALUES
  ('quotes', 'opportunity_id', 'opportunities', NULL, NULL, NULL, NULL, NULL, 'nullify');

INSERT OR IGNORE INTO directus_relations
  (many_collection, many_field, one_collection, one_field, one_collection_field, one_allowed_collections, junction_field, sort_field, one_deselect_action)
VALUES
  ('quotes', 'customer_id', 'customers', NULL, NULL, NULL, NULL, NULL, 'nullify');

INSERT OR IGNORE INTO directus_relations
  (many_collection, many_field, one_collection, one_field, one_collection_field, one_allowed_collections, junction_field, sort_field, one_deselect_action)
VALUES
  ('quotes', 'contact_id', 'contacts', NULL, NULL, NULL, NULL, NULL, 'nullify');

INSERT OR IGNORE INTO directus_relations
  (many_collection, many_field, one_collection, one_field, one_collection_field, one_allowed_collections, junction_field, sort_field, one_deselect_action)
VALUES
  ('quote_items', 'product_id', 'products', NULL, NULL, NULL, NULL, NULL, 'nullify');
