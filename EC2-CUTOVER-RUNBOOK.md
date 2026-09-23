# Moving Dashboard to a New EC2 Server (with phpMyAdmin & MySQL)

A step-by-step cutover: provision the new box, migrate the MySQL data, wire GitHub Actions to it, switch DNS, then retire the old server. Follow the stages in order — later ones assume earlier ones are verified.

- **Repos:** `Dashboard-Backend`, `Dashboard`
- **Images:** `ghcr.io/<owner>/dashboard-backend`, `ghcr.io/<owner>/dashboard-frontend`, `phpmyadmin/phpmyadmin`
- **Domains:** `crm.thebytebandits.com`, `abc-testig.duckdns.org`
- **Endpoints:**
  - App & API: `https://crm.thebytebandits.com/` and `/api/*`
  - phpMyAdmin: `https://crm.thebytebandits.com/phpmyadmin/`

Architecture recap:
- GitHub Actions builds and pushes frontend/backend images to GHCR.
- The host runs native MySQL/MariaDB on port 3306 (firewalled to host & docker network).
- Docker runs **3 services**: `backend`, `frontend` (Caddy reverse proxy + static SPA), and `phpmyadmin`.
- Caddy securely reverse-proxies `/phpmyadmin/*` to the `phpmyadmin` container on internal port 80.
- Both `backend` and `phpmyadmin` access MySQL via `host.docker.internal:3306`.

---

## Stage 00 — Gather what you need

*Do this first.*

- [ ] **New instance access** — its public/Elastic IP and the `.pem` SSH key.
- [ ] **AWS console access** to edit the new instance's Security Group.
- [ ] **DNS access** for `crm.thebytebandits.com` (registrar / Route 53) and `abc-testig.duckdns.org`.
- [ ] **SSH access to the OLD server** — needed for the data dump and final comparison.
- [ ] **A GitHub PAT with `read:packages`** scope, unless you'd rather make the GHCR packages public and skip login on pull.
- [ ] **The current secret values** from the old server's `/home/ec2-user/backend/.env` — `JWT_SECRET`, `JWT_REFRESH_SECRET`, SMTP settings.
- [ ] **A freshly rotated Google Drive service-account key** — the previous one was pasted in plaintext in an earlier session and should be treated as burned. Generate a new key in Cloud Console before using it here.
- [ ] **Admin access to both repos'** Settings → Secrets on GitHub.

---

## Stage 01 — Provision the new EC2 instance

*Run in the AWS console.*

Launch it the same way the old one was set up: Amazon Linux 2023, so every `dnf` command below matches. Leave the old instance completely alone — it keeps serving traffic through Stage 08.

| Inbound rule | Port | Source | Purpose |
|---|---|---|---|
| SSH | `22` | Your IP only | Admin terminal access |
| HTTP | `80` | `0.0.0.0/0` | Caddy ACME challenge & HTTP->HTTPS redirect |
| HTTPS | `443` | `0.0.0.0/0` | Live web app & phpMyAdmin traffic |
| MySQL | `3306` | **Do not open.** | Internal only. Containers reach it via `host.docker.internal`. |

> **Do this:** Allocate and associate an **Elastic IP** before continuing. Otherwise the IP you point DNS at in Stage 08 can change if the instance ever stops/starts.

---

## Stage 02 — Install Docker & the database engine

*Run on the new server.*

SSH in first:

```bash
# local $
ssh -i your-key.pem ec2-user@<NEW_EC2_IP>
```

Docker engine + the Compose plugin:

```bash
# new server $

# engine
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

# compose plugin (v2 CLI plugin, not in the AL2023 repo)
mkdir -p ~/.docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o ~/.docker/cli-plugins/docker-compose
chmod +x ~/.docker/cli-plugins/docker-compose

# log out and back in so the docker group membership takes effect
exit
```

> **Check first:** On the **old** server, run `mysql --version`. If it prints `MariaDB`, install MariaDB below instead of MySQL — matching engines makes the dump/restore in Stage 04 friction-free.

Real MySQL (from MySQL's own repo — Amazon Linux ships MariaDB by default):

```bash
# new server $
sudo dnf install -y https://dev.mysql.com/get/mysql80-community-release-el9-1.noarch.rpm
sudo dnf install -y mysql-community-server
sudo systemctl enable --now mysqld
# temporary root password is in the log:
sudo grep 'temporary password' /var/log/mysqld.log
```

— or MariaDB (standard Amazon Linux package):

```bash
# new server $
sudo dnf install -y mariadb105-server
sudo systemctl enable --now mariadb
sudo mysql_secure_installation
```

---

## Stage 03 — Configure the database

*Run on the new server.*

Create the database and users for both the backend application and phpMyAdmin administration:

```bash
# new server $
sudo mysql -u root -p
```

```sql
-- mysql >
CREATE DATABASE dashboard CHARACTER SET utf8mb4;

-- 1. App user (used by Backend container)
-- '172.%' covers Docker's default bridge network ranges
CREATE USER 'dashboard'@'172.%' IDENTIFIED BY 'a-strong-backend-password';
GRANT ALL PRIVILEGES ON dashboard.* TO 'dashboard'@'172.%';

-- 2. Admin user (used to log into phpMyAdmin via crm.thebytebandits.com/phpmyadmin)
CREATE USER 'pma_admin'@'172.%' IDENTIFIED BY 'a-strong-admin-password';
GRANT ALL PRIVILEGES ON *.* TO 'pma_admin'@'172.%' WITH GRANT OPTION;

FLUSH PRIVILEGES;
```

Let MySQL/MariaDB listen beyond localhost, so Docker bridge containers (`backend` and `phpmyadmin`) can reach it:

```bash
# new server $
# MySQL: /etc/my.cnf.d/mysql-server.cnf   ·   MariaDB: /etc/my.cnf.d/mariadb-server.cnf
sudo sed -i 's/^bind-address.*/bind-address = 0.0.0.0/' /etc/my.cnf.d/*server.cnf
sudo systemctl restart mysqld   # or: mariadb
```

> **Why this is safe:** Port 3306 is never opened in the AWS Security Group, so nothing on the public internet can reach it directly. Only containers on the host (via `host.docker.internal`) and local host processes can connect.

---

## Stage 04 — Migrate existing data

*Run on old + new server. Handle with care.*

Dump on the old server:

```bash
# old server $
mysqldump -u root -p --single-transaction --routines --triggers \
  dashboard > dashboard_dump.sql
```

Copy it to the new server (relayed through your local machine):

```bash
# local $
scp -i old-key.pem ec2-user@<OLD_EC2_IP>:~/dashboard_dump.sql .
scp -i new-key.pem dashboard_dump.sql ec2-user@<NEW_EC2_IP>:~/
```

Restore on the new server:

```bash
# new server $
mysql -u root -p dashboard < dashboard_dump.sql
```

Verify a couple of tables line up before trusting the migration:

```bash
# both servers
mysql -u root -p -e "SELECT COUNT(*) FROM dashboard.Account; SELECT COUNT(*) FROM dashboard.Invoice;"
```

---

## Stage 05 — App directory, Docker Compose & Secrets

*Run on the new server.*

```bash
# new server $
mkdir -p ~/dashboard && cd ~/dashboard
```

Ensure `docker-compose.yml` in `~/dashboard/` includes `backend`, `phpmyadmin`, and `frontend`:

```yaml
# ~/dashboard/docker-compose.yml
services:
  backend:
    image: ghcr.io/abraham-r-bytebandits/dashboard-backend:latest
    restart: unless-stopped
    env_file: .env.backend
    extra_hosts:
      - "host.docker.internal:host-gateway"
    volumes:
      - uploads_data:/app/uploads
    expose:
      - "4000"
    networks:
      - app

  phpmyadmin:
    image: phpmyadmin/phpmyadmin:latest
    restart: unless-stopped
    environment:
      PMA_HOST: host.docker.internal
      PMA_PORT: 3306
      PMA_ABSOLUTE_URI: "https://crm.thebytebandits.com/phpmyadmin/"
      UPLOAD_LIMIT: 64M
    extra_hosts:
      - "host.docker.internal:host-gateway"
    expose:
      - "80"
    networks:
      - app

  frontend:
    image: ghcr.io/abraham-r-bytebandits/dashboard-frontend:latest
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    environment:
      SITE_ADDRESS: "crm.thebytebandits.com abc-testig.duckdns.org"
    volumes:
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - backend
      - phpmyadmin
    networks:
      - app

networks:
  app:

volumes:
  uploads_data:
  caddy_data:
  caddy_config:
```

> **Note on Caddy configuration in Frontend image:**
> The `dashBoard/Caddyfile` routes `/phpmyadmin/*` directly to `phpmyadmin:80`:
> ```caddy
> redir /phpmyadmin /phpmyadmin/
> handle_path /phpmyadmin/* {
>     reverse_proxy phpmyadmin:80
> }
> ```

Copy the compose file and env template from your local machine:

```bash
# local $
scp -i new-key.pem Dashboard-Backend/deploy/docker-compose.yml Dashboard-Backend/deploy/.env.backend.example \
  ec2-user@<NEW_EC2_IP>:~/dashboard/
```

On the server, fill in `.env.backend`:

```bash
# new server $
cd ~/dashboard
cp .env.backend.example .env.backend
nano .env.backend
```

- `DATABASE_URL` → `mysql://dashboard:<a-strong-backend-password>@host.docker.internal:3306/dashboard`
- `JWT_SECRET` / `JWT_REFRESH_SECRET` → reuse the old server's values so existing logged-in sessions stay valid
- SMTP settings → carry over from the old server
- Google Drive vars → the **rotated** key from Stage 00, not the old one

If GHCR packages stay private, log in once so `docker compose pull` works:

```bash
# new server $
echo "<YOUR_GHCR_PAT>" | docker login ghcr.io -u <your-github-username> --password-stdin
```

---

## Stage 06 — First manual deploy (verify before automating)

*Run on the new server, once.*

Bring all containers up by hand to verify:

```bash
# new server $
cd ~/dashboard
docker compose pull
docker compose up -d
docker compose ps
docker compose logs backend -f
```


Look for `All migrations have been successfully applied` and no `P3009`/`P3018` errors.

Then confirm the schema status:

```bash
# new server $
docker compose exec backend npx prisma migrate status
```

Test both App and phpMyAdmin endpoint routing before DNS cutover:

```bash
# local $
# Test Frontend SPA
curl --resolve crm.thebytebandits.com:80:<NEW_EC2_IP> http://crm.thebytebandits.com/

# Test phpMyAdmin redirect & endpoint
curl -I --resolve crm.thebytebandits.com:80:<NEW_EC2_IP> http://crm.thebytebandits.com/phpmyadmin
curl -I --resolve crm.thebytebandits.com:80:<NEW_EC2_IP> http://crm.thebytebandits.com/phpmyadmin/
```

> **Expected noise:** Caddy will log TLS/ACME errors right now — it can't get a certificate until DNS actually resolves here. That's normal until Stage 08.

---

## Stage 07 — Wire up GitHub Actions

*Run on github.com, in both repos.*

In **both** repos — Settings → Secrets and variables → Actions — update:

| Secret | New value |
|---|---|
| `EC2_HOST` | New server's Elastic IP / hostname |
| `EC2_USER` | `ec2-user` |
| `EC2_SSH_KEY` | Full contents of the new `.pem` private key |
| `GHCR_TOKEN` | Your PAT with `read:packages` — skip only if packages are public |

Don't push yet if you're not ready for DNS to move — you can trigger the workflow manually later via *Actions → Run workflow* once Stage 08 is done, or just let the next real commit fire it.

---

## Stage 08 — DNS cutover

*Traffic-affecting.*

Point both domains at the new Elastic IP — in Route 53, your registrar, or DuckDNS:

- `crm.thebytebandits.com` → A record → new Elastic IP
- `abc-testig.duckdns.org` → update via DuckDNS's update URL/dashboard

```bash
# local $
watch -n 5 dig +short crm.thebytebandits.com
```

Once it resolves to the new IP, watch Caddy pick up the certificate automatically:

```bash
# new server $
docker compose logs frontend -f
```

> **Point of no return:** The instant this propagates, real users hit the new server. Everything through Stage 06 should already be verified before you change these records.

---

## Stage 09 — Post-cutover checks

*Checklist.*

- [ ] **HTTPS loads** on `https://crm.thebytebandits.com` with a valid, non-self-signed certificate.
- [ ] **phpMyAdmin loads** at `https://crm.thebytebandits.com/phpmyadmin/`.
- [ ] **phpMyAdmin login works** with `pma_admin` (or `dashboard`) and shows all tables in `dashboard`.
- [ ] **App login works** with a real user account.
- [ ] **Row counts match** the old server for key tables (from Stage 04).
- [ ] **File uploads** (work item attachments) save and load back correctly.
- [ ] **Google Drive integration** responds — `GET /api/drive/files` returns data.
- [ ] **Old server's access logs go quiet** — confirms nothing is still routing there.

---

## Stage 10 — Decommission the old server

*Irreversible — don't rush this.*

DNS can still be pointed back in minutes if something surfaces, so give it time.

- [ ] Leave the old instance **running but idle** for 7–14 days as a rollback safety net.
- [ ] After that window, **stop** the instance first — reversible, and much cheaper than running it.
- [ ] Only **terminate** once you're confident it's no longer needed — this deletes the instance and its EBS volume permanently.

