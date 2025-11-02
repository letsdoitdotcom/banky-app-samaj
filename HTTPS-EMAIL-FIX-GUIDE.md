# 🔧 HTTPS & Email Delivery Fix Configuration Guide

## 1. Netlify HTTPS Setup

### Step 1: Enable HTTPS in Netlify Dashboard
1. Go to https://app.netlify.com/sites/[your-site]/settings/domain
2. Under "HTTPS", make sure:
   - ✅ "Force HTTPS" is enabled
   - ✅ SSL certificate shows "Active"

### Step 2: Update Domain Settings
1. In "Domain settings" → "Custom domains"
2. Make sure your domain is set to: `lumartrust.com`
3. Add redirect from `www.lumartrust.com` → `lumartrust.com`

### Step 3: Deploy Updated Config
The netlify.toml has been updated with:
- Automatic HTTPS redirects
- Security headers for HTTPS
- Content Security Policy

## 2. Update Environment Variables

### Vercel Backend (.env.local):
```bash
# Update this to HTTPS
FRONTEND_URL="https://lumartrust.com"

# Keep existing variables
MONGODB_URI="your-mongodb-uri"
JWT_SECRET="your-jwt-secret"
RESEND_API_KEY="re_Eusa3rgG_LggxwzzqmQpiJVRBjkghwCJu"
```

### Netlify Frontend Environment:
Go to Netlify Dashboard → Site settings → Environment variables
Add/Update:
```
NEXT_PUBLIC_API_URL = https://banky-app-samaj.vercel.app
```

## 3. DNS Records for Email Deliverability

Add these DNS records in Hostinger to improve email delivery:

### SPF Record (TXT):
```
Name: @
Type: TXT
Value: v=spf1 include:_spf.resend.com ~all
```

### DMARC Record (TXT):
```
Name: _dmarc
Type: TXT  
Value: v=DMARC1; p=quarantine; rua=mailto:noreply@lumartrust.com
```

### Additional MX Record (if not exists):
```
Name: @
Type: MX
Value: 10 mail.lumartrust.com
```

## 4. Resend Dashboard Settings

1. Go to https://resend.com/domains
2. Click on `lumartrust.com`
3. Verify all DNS records show ✅ Verified
4. Check "Deliverability" tab for any warnings

## 5. Test After Changes

1. Deploy the updated code
2. Wait 10-15 minutes for DNS propagation
3. Test registration with a real email
4. Check if email goes to inbox instead of spam

## 6. Manual HTTPS Check

Visit these URLs to verify HTTPS:
- http://lumartrust.com → should redirect to https://lumartrust.com
- https://lumartrust.com → should load with SSL lock icon
- Check SSL certificate: Valid and trusted

## Email Improvements Made:

✅ Removed excessive emojis from subject line
✅ Used professional "LumaTrust Security" sender name
✅ Added reply-to address
✅ Professional email template design
✅ Clear security messaging
✅ Proper text/HTML ratio for spam filters

The updated email content is more professional and less likely to trigger spam filters.