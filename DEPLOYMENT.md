# 🚀 Production Deployment Guide
## Sirajul Huda College of Science and Integrated Studies, Nadapuram
### Affiliated to Jamiathul Hind Al Islamiya

This guide provides step-by-step instructions for deploying the **College Attendance Management System** to production.

---

## 📋 Initial System Credentials

| Component | Setting / Credential |
| :--- | :--- |
| **Admin Login Portal** | `http://<your-domain-or-ip>:3000/login` |
| **Public Student Portal** | `http://<your-domain-or-ip>:3000/portal` |
| **Super Admin Email** | `admin@college.edu` |
| **Super Admin Password** | `Admin@123456` |
| **Initial Classes Loaded** | `D-3`, `D-1`, `HS-1`, `HS-2` |

---

## ⚡ Option 1: Deploying on Cloud Server / VPS (Hostinger, DigitalOcean, AWS, Linode)

This is the recommended setup for running the complete website 24/7 on a custom domain (e.g. `attendance.sirajulhudacollege.com`).

### 1. Server Setup (Ubuntu / Debian Linux)
Connect to your VPS server via SSH:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm git nginx pm2
```

### 2. Clone & Setup Backend (`server/`)
```bash
cd /var/www
git clone <your-repository-url> attendance
cd attendance/server

# Install dependencies
npm install

# Push database schema & initialize clean database
npx prisma db push
npx prisma generate
npx ts-node src/seed.ts

# Build TypeScript to production JS
npm run build

# Start backend using PM2 Process Manager
pm2 start dist/index.js --name "attendance-backend"
pm2 save
```

### 3. Setup Frontend (`client/`)
```bash
cd /var/www/attendance/client

# Install dependencies
npm install

# Build static production bundle
npm run build
```

### 4. Configure Nginx Reverse Proxy
Create `/etc/nginx/sites-available/attendance`:
```nginx
server {
    listen 80;
    server_name attendance.sirajulhudacollege.com;

    # Frontend Static Files
    location / {
        root /var/www/attendance/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/attendance /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🌐 Option 2: Free Cloud Hosting (Render / Vercel / Railway)

### Deploy Backend to Render (render.com):
1. Connect Git repository.
2. Build Command: `cd server && npm install && npx prisma db push && npx prisma generate && npx ts-node src/seed.ts && npm run build`
3. Start Command: `cd server && npm start`
4. Environment Variable: `JWT_SECRET=YourProductionSecretKey`

### Deploy Frontend to Vercel (vercel.com):
1. Connect Git repository.
2. Root Directory: `client`
3. Build Command: `npm run build`
4. Output Directory: `dist`

---

## 🏢 Option 3: Local College Network (Intranet / Wi-Fi Access)

To run the attendance portal locally within your college campus network so teachers and students can access it over college Wi-Fi:

1. **Find College Server Local IP Address**:
   On the host machine, open Command Prompt / Terminal and run:
   ```cmd
   ipconfig
   ```
   Look for your IPv4 Address (e.g. `192.168.1.100`).

2. **Run Backend Server**:
   ```cmd
   cd server
   npm run dev
   ```

3. **Run Frontend Client with Network Host**:
   In `client/package.json`, update dev script to `vite --host 0.0.0.0` or run:
   ```cmd
   cd client
   npx vite --host 0.0.0.0 --port 3000
   ```

4. **Access Portal on College Devices**:
   - Staff Login: `http://192.168.1.100:3000/login`
   - Public Student Portal: `http://192.168.1.100:3000/portal`

---

## 🛡️ Post-Deployment Security Checklist

- [ ] Log in at `http://<your-domain>/login` with `admin@college.edu` / `Admin@123456`.
- [ ] Go to **User Accounts (`/users`)** -> Update Super Admin password.
- [ ] Add custom User accounts for Usthads / Teachers.
- [ ] Go to **Import / Export (`/import-export`)** -> Upload student roster Excel file.
