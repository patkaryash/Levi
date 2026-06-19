ALTER SYSTEM SET password_encryption = 'trust';
SELECT pg_reload_conf();
