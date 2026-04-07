# 🚀 IBS Action Tracker - Public Deployment Guide

## ✅ Current Configuration (Already Done)

### 1. Environment Variables Updated
**File: `.env`**
```
CLIENT_ORIGIN=http://localhost:5174,http://192.168.1.170:3010,http://47.247.154.26:3010
```
✅ Allows localhost, LAN, and public IP access

### 2. Server Configuration
- **Port**: 5010
- **CORS**: Configured to accept multiple origins
- **No 0.0.0.0 binding**: Server listens on default interface (IIS compatible)

### 3. Frontend Configuration
- **API Base URL**: `/api` (relative - works with IIS reverse proxy)
- **No hardcoded IPs**: Automatically adapts to domain name

---

## 🔧 Steps to Complete Public Access

### **Step 1: Build Frontend for Production**

```bash
cd client
npm run build
```

This creates optimized files in `client/dist/`

---

### **Step 2: IIS Setup (When You Get Domain Name)**

#### **2.1 Install Frontend Files**
1. Copy `client/dist/` contents to IIS folder:
   ```
   C:\inetpub\wwwroot\ibs-action-tracker\
   ```

2. Ensure `web.config` exists in that folder (already created ✅)

#### **2.2 Configure IIS Reverse Proxy**

**Option A: Single Domain (Recommended)**
```
Domain: ibs.yourcompany.com

IIS Rules:
/ → Frontend files
/api/* → Backend (http://localhost:5010/api/*)
```

**web.config** reverse proxy rules:
```xml
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- API requests → Backend -->
        <rule name="API Proxy" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:5010/api/{R:1}" />
        </rule>
        
        <!-- All other requests → Frontend -->
        <rule name="Frontend">
          <match url="(.*)" />
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

#### **2.3 IIS Application Pool Settings**
- **.NET CLR Version**: No Managed Code
- **Managed Pipeline Mode**: Integrated
- **Identity**: ApplicationPoolIdentity

---

### **Step 3: Windows Firewall**

Open PowerShell as Administrator:

```powershell
# Allow backend port
New-NetFirewallRule -DisplayName "IBS Backend 5010" -Direction Inbound -LocalPort 5010 -Protocol TCP -Action Allow

# Allow HTTP (if using port 80)
New-NetFirewallRule -DisplayName "HTTP Inbound" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow

# Allow HTTPS (if using port 443)
New-NetFirewallRule -DisplayName "HTTPS Inbound" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```

---

### **Step 4: Router Port Forwarding**

Login to your router (192.168.1.1) and add:

| Service | External Port | Internal IP | Internal Port | Protocol |
|---------|---------------|-------------|---------------|----------|
| IBS App | 80 (or 443) | 192.168.1.170 | 80 (or 443) | TCP |

**Note**: If your ISP blocks port 80, use alternative ports like 8080 or 8888.

---

### **Step 5: DNS Configuration (Company IT)**

Ask your company IT to create DNS record:

```
Type: A
Name: ibs (or your preferred subdomain)
Value: 47.247.154.26
TTL: 3600
```

After DNS propagation, your app will be accessible at:
```
http://ibs.yourcompany.com
```

---

## 🔒 SSL/HTTPS Setup (Optional but Recommended)

### Using Let's Encrypt (Free)
1. Install **win-acme**: https://github.com/win-acme/win-acme
2. Run: `wacs.exe --target manual --store pemfiles --pemfilespath C:\certs`
3. Configure IIS to use the SSL certificate

### Or Use Cloudflare (Easier)
1. Add your domain to Cloudflare
2. Enable **Flexible SSL** mode
3. Cloudflare handles HTTPS automatically

---

## 🧪 Testing Checklist

### Before Going Live:

- [ ] Backend running: `node server/index.js`
- [ ] Frontend built: `cd client && npm run build`
- [ ] IIS configured and serving frontend
- [ ] API proxy working: Access `/api/health` → returns `{"status":"ok"}`
- [ ] Windows firewall rules added
- [ ] Router port forwarding configured
- [ ] DNS record created and propagated
- [ ] Test from mobile (not WiFi): `http://47.247.154.26`
- [ ] Test with domain: `http://ibs.yourcompany.com`

---

## 🚀 Quick Start Commands

### Start Backend:
```bash
cd server
node index.js
```

### Build Frontend:
```bash
cd client
npm run build
```

### Test Locally:
```bash
cd client
npm run dev
```

---

## 📝 Architecture Flow

```
User Browser
    ↓
http://ibs.yourcompany.com (DNS)
    ↓
47.247.154.26:80 (Public IP)
    ↓
Router Port Forwarding
    ↓
192.168.1.170:80 (Your PC)
    ↓
IIS (Port 80)
    ├── / → Serves frontend files
    └── /api/* → Reverse proxy to Node.js (Port 5010)
         ↓
    Node.js Backend (localhost:5010)
         ↓
    SQL Server Database (216.48.191.98)
```

---

## 🆘 Troubleshooting

### Issue: CORS Error
**Solution**: Add your domain to `.env` → `CLIENT_ORIGIN`

### Issue: 404 on API routes
**Solution**: Check IIS rewrite rules in web.config

### Issue: Cannot access from outside
**Solution**: 
1. Verify port forwarding
2. Check firewall rules
3. Test: `curl http://47.247.154.26/api/health`

### Issue: Backend not starting
**Solution**: 
```bash
cd server
npm install
node index.js
```

---

## 📞 Need Help?

When you get your domain name from the company, I can help you:
1. ✅ Update web.config with proper reverse proxy rules
2. ✅ Configure IIS application
3. ✅ Test the full setup
4. ✅ Enable HTTPS/SSL

Just let me know the domain name! 🎯
