# Gmail App Password Setup Instructions

## ⚠️ Authentication Error Detected

The current Gmail password is being rejected because Gmail requires **App Passwords** for third-party applications.

## How to Generate a Gmail App Password

### Step 1: Enable 2-Step Verification (Required)
1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** (left sidebar)
3. Under "How you sign in to Google", click **2-Step Verification**
4. Follow the prompts to turn it ON

### Step 2: Generate App Password
1. After enabling 2-Step Verification, go back to **Security**
2. Scroll down to "How you sign in to Google"
3. Click **App passwords** (you'll only see this after enabling 2-Step Verification)
4. Sign in again if prompted
5. In the "Select app" dropdown, choose **Mail**
6. In the "Select device" dropdown, choose **Other (Custom name)**
7. Type: **SafeTourX SOS Alerts**
8. Click **Generate**
9. **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

### Step 3: Update Backend Configuration
Replace the password in `server.js` line 14:
```javascript
pass: 'your-16-character-app-password-here'  // Replace 'alter@123'
```

## Alternative: Update .env File (More Secure)

Instead of hardcoding credentials, you can use environment variables:

1. Open `.env` file in the backend folder
2. Add these lines:
```
EMAIL_USER=alternos.act@gmail.com
EMAIL_PASS=your-app-password-here
```

3. Update `server.js`:
```javascript
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
```

## Testing
Once configured, click the SOS button and check `chinmaytidke630@gmail.com` for the emergency alert email!

---
**Need Help?** If 2-Step Verification isn't an option, consider using SendGrid (free tier) instead.
