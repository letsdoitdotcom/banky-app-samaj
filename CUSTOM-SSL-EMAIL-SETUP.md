# 🔒 Custom SSL + Email Authentication Setup for lumartrust.com

## Method 1: Generate Custom SSL Certificate (Recommended)

### Step 1: Get SSL Certificate Using Certbot
```bash
# Install Certbot (if not already installed)
# On Windows, download from: https://certbot.eff.org/

# Generate certificate for your domain
certbot certonly --manual --preferred-challenges dns -d lumartrust.com -d www.lumartrust.com
```

### Step 2: DNS Challenge Verification
Certbot will ask you to add TXT records to your Hostinger DNS:
```
Name: _acme-challenge.lumartrust.com
Type: TXT
Value: [certbot-provided-value]

Name: _acme-challenge.www.lumartrust.com  
Type: TXT
Value: [certbot-provided-value]
```

### Step 3: Upload Certificate to Netlify
1. Go to Netlify → Domain settings → HTTPS → **Custom certificate**
2. Upload the generated files:
   - **Certificate**: fullchain.pem
   - **Private Key**: privkey.pem
   - **Intermediate**: chain.pem

## Method 2: Use ZeroSSL (Free Alternative)

### Step 1: Get Free Certificate from ZeroSSL
1. Visit: https://zerossl.com/
2. Create free account
3. Generate certificate for `lumartrust.com` and `www.lumartrust.com`
4. Choose **DNS verification**

### Step 2: Add DNS Verification Records
Add the TXT records ZeroSSL provides to Hostinger DNS

### Step 3: Download and Upload to Netlify
1. Download certificate files from ZeroSSL
2. Upload to Netlify custom certificate section

## Method 3: Quick Fix - Cloudflare (Easiest)

### Step 1: Add Domain to Cloudflare
1. Sign up at: https://cloudflare.com/
2. Add `lumartrust.com` as a site
3. Copy the nameservers Cloudflare provides

### Step 2: Update Nameservers in Hostinger
1. Go to Hostinger → Domain management
2. Change nameservers to Cloudflare's nameservers
3. Wait 24-48 hours for propagation

### Step 3: Configure Cloudflare
1. **DNS**: Point A record to `75.2.60.5`
2. **SSL/TLS**: Set to "Full (strict)"
3. **Page Rules**: Create rule to redirect www to non-www

## 📧 Fix Email Authentication (Critical for Spam Prevention)

### Step 1: Add Email Authentication DNS Records in Hostinger

**SPF Record (Sender Policy Framework):**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com include:netlify.com ~all
```

**DKIM Record (DomainKeys Identified Mail):**
```
Type: TXT  
Name: resend._domainkey
Value: [Get this from Resend dashboard]
```

**DMARC Record (Domain-based Message Authentication):**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@lumartrust.com; ruf=mailto:dmarc@lumartrust.com; fo=1
```

### Step 2: Get DKIM Key from Resend
1. Visit: https://resend.com/domains
2. Click on `lumartrust.com`
3. Copy the DKIM record value
4. Add it to Hostinger DNS

### Step 3: Add MX Records (if needed)
```
Type: MX
Name: @
Value: 10 mx.resend.com
Priority: 10
```

## 🚀 Recommended Quick Solution: Cloudflare Method

**Why Cloudflare is best:**
✅ Free SSL certificate (automatic)
✅ Better email deliverability 
✅ CDN performance boost
✅ DDoS protection
✅ Easy DNS management

**Steps:**
1. Add `lumartrust.com` to Cloudflare (free)
2. Update nameservers in Hostinger  
3. Configure DNS in Cloudflare dashboard
4. Enable SSL (automatic)
5. Add email authentication records

This will give you:
- **Instant HTTPS** for lumartrust.com
- **Better email deliverability**
- **Professional setup**

## 📞 Need Help?
I can guide you through any of these methods. The Cloudflare method is easiest and most reliable for immediate results.