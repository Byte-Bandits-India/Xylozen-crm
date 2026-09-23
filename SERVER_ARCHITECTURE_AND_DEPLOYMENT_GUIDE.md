# 📚 EC2 Server Architecture, Configuration & Deployment Guide

---

## 1. 🖥️ Server Overview & Credentials

| Property | Value / Detail |
| :--- | :--- |
| **Public IP** | `3.106.210.64` |
| **Primary Domain** | `crm.thebytebandits.com` |
| **Operating System** | Amazon Linux 2023 (x86_64) |
| **Default User** | `ec2-user` |
| **SSH Key Path (Local)** | `~/Downloads/xylozen.pem` |
| **SSH Command** | `ssh -i ~/Downloads/xylozen.pem ec2-user@3.106.210.64` |
| **Database Engine** | MySQL 8.0 Community Server (Host native, Port `3306`) |
| **Container Engine** | Docker Engine 25.x & Docker Compose v2 |
| **Reverse Proxy / Web Server** | Caddy (built inside the frontend container with automated HTTPS/TLS) |

---

## 2. 📂 File System & Project Path Layout

### Server Directory Structure (`/home/ec2-user/`)

```text
/home/ec2-user/
├── dashboard/                              # Main CRM & Dashboard project root
│   ├── docker-compose.yml                  # Service orchestration (Backend, Frontend, phpMyAdmin)
│   ├── .env.backend                        # Backend environment variables & secrets
│   └── uploads/                            # Persistent media & attachment storage (synced via Docker volume)
│
├── /etc/my.cnf                             # Host MySQL configuration file
├── /var/lib/mysql/                         # Raw MySQL data directory
└── /var/log/mysqld.log                     # MySQL server logs
```

---

## 3. 🌐 Web Server & Reverse Proxy Architecture

The frontend container contains **Caddy**, which listens on standard web ports (`80` and `443`), automatically provisions SSL certificates via Let's Encrypt / ZeroSSL, and routes traffic across internal Docker services.

### Traffic Flow Diagram:

```
                          Internet (User Requests)
                                     │
                           [Port 80 / 443 (HTTPS)]
                                     │
                           ┌─────────▼─────────┐
                           │ Frontend (Caddy)  │
                           └─────────┬─────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
         [ /* ]                 [ /api/* ]             [ /phpmyadmin/* ]
       Static SPA         Backend Express / Node.js       phpMyAdmin
   (Vite React Build)           (Port 4000)                (Port 80)
```

### Docker Compose Configuration (`/home/ec2-user/dashboard/docker-compose.yml`):

```yaml
services:
  backend:
    image: ghcr.io/abraham-r-bytebandits/dashboard-backend:latest
    restart: unless-stopped
    env_file: .env.backend
    extra_hosts:
      - "host.docker.internal:host-gateway"   # Maps host MySQL (Port 3306) inside container
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
      SITE_ADDRESS: "crm.thebytebandits.com"
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

---

## 4. 🗄️ Database Architecture & Access

- **Service**: MySQL 8.0 Community Server running on the host OS.
- **Port**: `3306` (bound locally, protected by EC2 Security Groups).
- **Access from Docker**: `host.docker.internal:3306`.
- **Database Name**: `dashboard`
- **Root Password**: `Xylo@123`
- **Prisma Connection String (`.env.backend`)**:
  ```env
  DATABASE_URL="mysql://root:Xylo%40123@host.docker.internal:3306/dashboard"
  ```
- **Direct Terminal Access on EC2**:
  ```bash
  mysql -u root -pXylo@123 dashboard
  ```

---

## 5. 🚀 Continuous Deployment (CI/CD Workflows)

Deployment is 100% automated using GitHub Actions workflows in both repositories:

1. **Frontend Repo**: `Dashboard` (`.github/workflows/deploy.yml`)
2. **Backend Repo**: `Dashboard-Backend` (`.github/workflows/backend-deploy.yml`)

### Pipeline Workflow:

```text
git push origin main
       │
       ▼
GitHub Actions Runner
  ├── 1. Builds Docker Container Image
  ├── 2. Authenticates & Pushes to GitHub Container Registry (ghcr.io)
  └── 3. Connects via SSH to 3.106.210.64
             │
             ▼
       Executes on EC2:
       ├── docker compose pull <service>
       ├── docker compose up -d <service>
       └── Automatically executes Prisma migrations during entrypoint
```

---

## 6. ➕ How to Add and Host New Projects on the Same Server

You can host multiple applications, APIs, or static websites on this single EC2 instance without interfering with existing services.

### Step 1: Create a Project Directory
```bash
mkdir -p /home/ec2-user/my-new-project
cd /home/ec2-user/my-new-project
```

### Step 2: Create a Dedicated Database
```bash
mysql -u root -pXylo@123 -e "CREATE DATABASE new_project_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Step 3: Create Docker Compose for the New Project
Create `/home/ec2-user/my-new-project/docker-compose.yml`:
```yaml
services:
  app:
    image: your-repo/new-project:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:5001:5000"  # Expose internally on host port 5001
    environment:
      DATABASE_URL: "mysql://root:Xylo%40123@host.docker.internal:3306/new_project_db"
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

Start the new service:
```bash
docker compose up -d
```

### Step 4: Route a Subdomain to the New Service
To point a domain like `app2.thebytebandits.com` to the new project running on port `5001`:
1. Add a DNS `A` Record in your DNS provider pointing `app2.thebytebandits.com` -> `3.106.210.64`.
2. Add the route block to your reverse proxy configuration (or reverse proxy container) to proxy `app2.thebytebandits.com` -> `http://127.0.0.1:5001`.

---

## 7. 🛠️ Server Management Cheat Sheet

| Task | Command |
| :--- | :--- |
| **Check Docker Containers** | `cd ~/dashboard && docker compose ps` |
| **View Live Backend Logs** | `cd ~/dashboard && docker compose logs -f backend` |
| **View Live Frontend Logs** | `cd ~/dashboard && docker compose logs -f frontend` |
| **Restart Application** | `cd ~/dashboard && docker compose restart` |
| **Run Prisma Migrations Manually** | `cd ~/dashboard && docker compose exec backend npx prisma migrate deploy` |
| **Check RAM / Memory Usage** | `free -h` or `htop` |
| **Check Disk Storage** | `df -h` |
| **Check MySQL Service Status** | `sudo systemctl status mysqld` |
| **Restart MySQL Service** | `sudo systemctl restart mysqld` |
| **View MySQL Error Log** | `sudo tail -n 50 /var/log/mysqld.log` |
