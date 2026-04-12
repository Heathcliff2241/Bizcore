FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    pgbouncer \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy pgbouncer configuration
COPY pgbouncer.ini /etc/pgbouncer/pgbouncer.ini
COPY userlist.txt /etc/pgbouncer/userlist.txt

# Create pgbouncer user and group (if not exists)
RUN useradd -r -s /bin/bash pgbouncer 2>/dev/null || true

# Expose pgbouncer port
EXPOSE 6432

# Run pgbouncer in foreground
CMD ["pgbouncer", "-u", "pgbouncer", "/etc/pgbouncer/pgbouncer.ini"]
