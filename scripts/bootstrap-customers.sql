-- 客户管理 & 跟进记录集合（Directus SQLite）
-- 用法: sqlite3 database/data.db < scripts/bootstrap-customers.sql
-- 执行后请重启 Directus: docker compose restart directus

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name varchar(255) NOT NULL,
  company varchar(255),
  contact_name varchar(255),
  phone varchar(64),
  email varchar(255),
  industry varchar(64),
  source varchar(64),
  level varchar(64) DEFAULT 'normal',
  status varchar(64) DEFAULT 'potential',
  owner_name varchar(255),
  address TEXT,
  notes TEXT,
  last_contact_at datetime,
  next_follow_up_at datetime
);

CREATE TABLE IF NOT EXISTS customer_follow_ups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  follow_up_type varchar(64) DEFAULT 'call',
  content TEXT,
  follow_up_at datetime,
  next_action TEXT
);

INSERT OR IGNORE INTO directus_collections
  (collection, icon, note, display_template, hidden, singleton, accountability, collapse, versioning)
VALUES
  ('customers', 'contacts', '客户管理', '{{name}}', 0, 0, 'all', 'open', 0);

INSERT OR IGNORE INTO directus_collections
  (collection, icon, note, display_template, hidden, singleton, accountability, collapse, versioning)
VALUES
  ('customer_follow_ups', 'forum', '客户跟进记录', '{{content}}', 0, 0, 'all', 'open', 0);

-- customers fields
INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'customers', 'id', 'numeric', 1, 1, 1, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='customers' AND field='id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'customers', 'name', 'input', 0, 0, 2, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='customers' AND field='name');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'customers', 'company', 'input', 0, 0, 3, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='customers' AND field='company');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'customers', 'contact_name', 'input', 0, 0, 4, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='customers' AND field='contact_name');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'customers', 'phone', 'input', 0, 0, 5, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='customers' AND field='phone');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'customers', 'email', 'input', 0, 0, 6, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='customers' AND field='email');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'customers', 'industry', 'select-dropdown', 0, 0, 7, 0,
  '{"choices":[{"text":"IT/互联网","value":"it"},{"text":"制造业","value":"manufacturing"},{"text":"金融","value":"finance"},{"text":"教育","value":"education"},{"text":"零售","value":"retail"},{"text":"医疗","value":"healthcare"},{"text":"其他","value":"other"}]}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='customers' AND field='industry');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'customers', 'source', 'select-dropdown', 0, 0, 8, 0,
  '{"choices":[{"text":"官网","value":"website"},{"text":"转介绍","value":"referral"},{"text":"展会","value":"exhibition"},{"text":"广告","value":"ads"},{"text":"电话营销","value":"telemarketing"},{"text":"其他","value":"other"}]}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='customers' AND field='source');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'customers', 'level', 'select-dropdown', 0, 0, 9, 0,
  '{"choices":[{"text":"普通","value":"normal"},{"text":"重要","value":"important"},{"text":"VIP","value":"vip"}]}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='customers' AND field='level');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'customers', 'status', 'select-dropdown', 0, 0, 10, 0,
  '{"choices":[{"text":"潜在","value":"potential"},{"text":"跟进中","value":"following"},{"text":"已成交","value":"deal"},{"text":"已流失","value":"lost"}]}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='customers' AND field='status');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'customers', 'owner_name', 'input', 0, 0, 11, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='customers' AND field='owner_name');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'customers', 'address', 'input-multiline', 0, 0, 12, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='customers' AND field='address');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'customers', 'notes', 'input-multiline', 0, 0, 13, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='customers' AND field='notes');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'customers', 'last_contact_at', 'datetime', 0, 0, 14, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='customers' AND field='last_contact_at');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'customers', 'next_follow_up_at', 'datetime', 0, 0, 15, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='customers' AND field='next_follow_up_at');

-- customer_follow_ups fields
INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'customer_follow_ups', 'id', 'numeric', 1, 1, 1, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='customer_follow_ups' AND field='id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'customer_follow_ups', 'customer_id', 'input', 0, 0, 2, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='customer_follow_ups' AND field='customer_id');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'customer_follow_ups', 'follow_up_type', 'select-dropdown', 0, 0, 3, 0,
  '{"choices":[{"text":"电话","value":"call"},{"text":"拜访","value":"visit"},{"text":"邮件","value":"email"},{"text":"会议","value":"meeting"},{"text":"其他","value":"other"}]}'
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='customer_follow_ups' AND field='follow_up_type');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'customer_follow_ups', 'content', 'input-multiline', 0, 0, 4, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='customer_follow_ups' AND field='content');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'customer_follow_ups', 'follow_up_at', 'datetime', 0, 0, 5, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='customer_follow_ups' AND field='follow_up_at');

INSERT OR IGNORE INTO directus_fields (collection, field, interface, readonly, hidden, sort, required, options)
SELECT 'customer_follow_ups', 'next_action', 'input', 0, 0, 6, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM directus_fields WHERE collection='customer_follow_ups' AND field='next_action');
