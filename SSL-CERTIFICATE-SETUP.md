# 🔒 Create Free SSL Certificate with win-acme (No Port 443 Needed)

## ✅ Why This Works:
- **No Port 443 Needed**: We'll use DNS verification instead of HTTP.
- **Free Certificate**: Let's Encrypt is 100% free.
- **Auto-Renewal**: Can be set up to renew automatically every 90 days.
- **Valid for Any Port**: Once you have the `.pem` files, you can use them on port 3010, 8443, or anywhere else.

---

## 📋 Prerequisites:
1. **Domain Access**: You need access to your domain's DNS settings (Cloudflare, GoDaddy, etc.).
2. **Admin Rights**: On your Windows PC.

---

## 🔧 Step-by-Step Instructions:

### **Step 1: Download win-acme**

1. Go to: https://www.win-acme.com/
2. Click **Download** (get the `.zip` file).
3. Extract the zip file to: `C:\win-acme\`

---

### **Step 2: Run win-acme**

1. Open **PowerShell** as Administrator.
2. Navigate to the folder:
   ```powershell
   cd C:\win-acme
   ```
3. Run the program:
   ```powershell
   .\wacs.exe
   ```

---

### **Step 3: Create Certificate (Manual DNS Mode)**

When the menu appears:

1. **Select**: `M` (Manual input)
2. **Host**: Enter your subdomain, e.g., `ibs.idolizesolutions.com`
3. **Store**: Select `1` (PEM files)
4. **Validation**: Select **Manual DNS** (usually option `D` or `DNS-01`)

**What happens next:**
- win-acme will give you a **TXT record** value.
- **Do not close the window!**

---

### **Step 4: Add DNS Record**

1. Login to your domain provider (Cloudflare, GoDaddy, Namecheap, etc.).
2. Go to **DNS Settings**.
3. Add a new **TXT record**:
   - **Name/Host**: `_acme-challenge.ibs` (or just `_acme-challenge` if using root domain)
   - **Value**: Paste the long string win-acme gave you.
   - **TTL**: Auto or 3600.

4. Save the record and wait 1-2 minutes.

---

### **Step 5: Complete Validation**

Go back to the win-acme window and press **Enter** to verify the DNS record.

**If successful:**
- You'll see: **"Certificate request successful"**
- Files are saved to: `C:\ProgramData\win-acme\httpsacme-v02.api.letsencrypt.org\`

**Files created:**
- `ibs.idolizesolutions.com-crt.pem` (Certificate)
- `ibs.idolizesolutions.com-key.pem` (Private Key)
- `ibs.idolizesolutions.com-chain.pem` (Intermediate Chain)
- `ibs.idolizesolutions.com-all.pfx` (Combined for Windows/IIS)

---

## 🚀 Step 6: Install in IIS

### **Option A: Use the .pfx file (Easiest)**

1. Open **IIS Manager**.
2. Select your server name (root).
3. Double-click **Server Certificates**.
4. Click **Import...** in the right panel.
5. Browse to the `.pfx` file created above.
6. Enter password (win-acme will show it in the console).
7. Click **OK**.

### **Option B: Bind to your site**

1. In IIS, expand **Sites** and select your site.
2. Click **Bindings...** on the right.
3. Click **Add**.
   - **Type**: `https`
   - **Port**: `3010` (or `443` if available)
   - **SSL Certificate**: Select the one you just imported.
4. Click **OK**.

---

## 🔄 Auto-Renewal

win-acme creates a **Scheduled Task** in Windows automatically:
1. Press `Win + R`, type `taskschd.msc`.
2. Look for **win-acme** tasks.
3. They run daily and renew certificates 30 days before expiry.

---

## 🧪 Test Your HTTPS Site

Open browser:
```
https://ibs.idolizesolutions.com:3010
```

- Should show a valid padlock 🔒.
- Microphone permission will now work! 🎤

---

## ⚠️ Troubleshooting

### **DNS Validation Failed:**
- Wait a few more minutes for DNS propagation.
- Check the TXT record spelling (must start with `_acme-challenge`).
- Use `nslookup -type=txt _acme-challenge.ibs.idolizesolutions.com` to verify.

### **IIS Binding Error:**
- Make sure no other site is using port 3010 with HTTPS.
- Run `netstat -ano | findstr :3010` to check.

---

## 📞 Need Help?
If you get stuck, send me:
1. The error message from win-acme.
2. A screenshot of your DNS settings.

**Let's get that certificate created!** 🚀🔒
