<?php
/**
 * INTENTIONALLY VULNERABLE — local integration-test fixture for QuadCore SQLi.
 *
 * Classic UNION/error-based SQL injection: `id` is concatenated straight into
 * the query with no prepared statement and no sanitisation. This exists so the
 * engine (engine/detection, engine/exploit, engine/dump) has a real, disposable
 * target to exercise during local testing.
 *
 * DO NOT reuse this pattern anywhere else. DO NOT expose this container outside
 * an isolated docker-compose network on your own machine.
 */

$mysqli = new mysqli(
    getenv('DB_HOST') ?: 'vuln-target-db',
    getenv('DB_USER') ?: 'vulnapp',
    getenv('DB_PASSWORD') ?: 'vulnapp',
    getenv('DB_NAME') ?: 'vulnapp'
);

if ($mysqli->connect_errno) {
    http_response_code(500);
    die('DB connection failed: ' . $mysqli->connect_error);
}

$id = $_GET['id'] ?? '1';

// VULNERABLE ON PURPOSE: raw string concatenation, no prepared statement.
$sql = "SELECT id, name, description FROM products WHERE id = $id";
$result = $mysqli->query($sql);

header('Content-Type: text/html; charset=utf-8');
echo "<h1>QuadCore vuln-target (test fixture only)</h1>\n";

if ($result === false) {
    // Reflects the raw MySQL error, which is what makes error-based
    // detection (engine/detection/error.py) observable against this fixture.
    echo '<p>Query error: ' . htmlspecialchars($mysqli->error) . "</p>\n";
} else {
    echo "<table border=\"1\">\n";
    while ($row = $result->fetch_assoc()) {
        echo '<tr><td>' . htmlspecialchars((string) $row['id']) . '</td>';
        echo '<td>' . htmlspecialchars((string) $row['name']) . '</td>';
        echo '<td>' . htmlspecialchars((string) $row['description']) . "</td></tr>\n";
    }
    echo "</table>\n";
}

$mysqli->close();
