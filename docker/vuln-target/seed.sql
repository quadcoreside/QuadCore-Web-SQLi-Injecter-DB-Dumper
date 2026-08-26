-- Seed data for the intentionally-vulnerable `vuln-target` test fixture.
-- Loaded automatically by the mysql:8.0 image via /docker-entrypoint-initdb.d
-- against the database named by MYSQL_DATABASE (see docker-compose.yml).

CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL
);

INSERT INTO products (name, description) VALUES
    ('Widget', 'A basic widget'),
    ('Gadget', 'A fancier gadget'),
    ('Gizmo', 'The fanciest gizmo');

-- A second table with "sensitive"-looking columns, useful to exercise the
-- information_schema walk (engine/dump/schema.py) and row dump
-- (engine/dump/rows.py) end-to-end, not just the injectable endpoint itself.
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(64) NOT NULL,
    email VARCHAR(100) NOT NULL
);

INSERT INTO users (username, password, email) VALUES
    ('admin', 'not_a_real_hash_1', 'admin@example.test'),
    ('alice', 'not_a_real_hash_2', 'alice@example.test'),
    ('bob',   'not_a_real_hash_3', 'bob@example.test');
