-- 产品管理集合（Directus SQLite）
-- 用法: sqlite3 database/data.db < scripts/bootstrap-products.sql
-- 执行后请重启 Directus: docker compose restart directus
-- 依赖: 无（建议在 bootstrap-quotes.sql 之前执行，报价明细关联 product_id）

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name varchar(255) NOT NULL,
  sku varchar(64),
  price REAL DEFAULT 0,
  description TEXT,
  status varchar(64) DEFAULT 'draft'
);

INSERT OR IGNORE INTO directus_collections
  (collection, icon, note, display_template, hidden, singleton, accountability, collapse, versioning)
VALUES
  ('products', 'inventory_2', '产品管理', '{{name}}', 0, 0, 'all', 'open', 0);

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'products', 'id', 'numeric', 1, 1, 1, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='products' AND field='id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'products', 'name', 'input', 0, 0, 2, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='products' AND field='name');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'products', 'sku', 'input', 0, 0, 3, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='products' AND field='sku');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'products', 'price', 'input', 0, 0, 4, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='products' AND field='price');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'products', 'status', 'select-dropdown', 0, 0, 5, 0,
  '{"choices":[{"text":"草稿","value":"draft"},{"text":"上架","value":"published"},{"text":"下架","value":"archived"}]}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='products' AND field='status');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'products', 'description', 'input-multiline', 0, 0, 6, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='products' AND field='description');
