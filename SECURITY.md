# Security Guidelines

- Environment variables are stored in .env (dev) and prod.env (prod). Never commit secrets.
- JWT secret length: 32+ characters. Rotate on compromise. Configure via env.
- Rate limiting enabled server-side; keep reverse proxy in front (nginx) and set `trust proxy`.
- CORS restricted in production to `FRONTEND_URL`.
- Helmet enabled with CSP, HSTS. Review CSP directives if adding external resources.
- Passwords hashed with bcrypt and never returned in API responses.
- MinIO buckets private in production; use presigned URLs via backend.
- Keep dependencies updated and monitor CVEs. Run linters and tests before deploy.
- Backups: schedule regular backups of PostgreSQL and MinIO data volumes.
- Logs: monitor access/error logs, audit logs, and alert on anomalies.
