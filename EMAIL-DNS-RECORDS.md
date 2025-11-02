# 📧 Critical DNS Records to Add in Hostinger (Email Authentication)

## 🚨 These DNS Records Will Fix Email Going to Spam

### 1. SPF Record (Sender Policy Framework)
**Purpose**: Tells email providers which servers can send email from your domain

**Add in Hostinger DNS:**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com include:netlify.com ~all
TTL: 3600
```

### 2. DKIM Record (DomainKeys Identified Mail)  
**Purpose**: Cryptographically signs your emails

**Get DKIM Key from Resend:**
1. Go to: https://resend.com/domains
2. Click on `lumartrust.com`  
3. Find the DKIM record value
4. Copy the long string

**Add in Hostinger DNS:**
```
Type: TXT
Name: resend._domainkey
Value: [paste the DKIM value from Resend]
TTL: 3600
```

### 3. DMARC Record (Domain-based Message Authentication)
**Purpose**: Tells email providers what to do with unauthenticated emails

**Add in Hostinger DNS:**
```
Type: TXT  
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@lumartrust.com; pct=100
TTL: 3600
```

### 4. MX Record (Mail Exchange) - Optional but Recommended
**Purpose**: Defines mail servers for your domain

**Add in Hostinger DNS:**
```
Type: MX
Name: @  
Value: mx.resend.com
Priority: 10
TTL: 3600
```

## 🔍 How to Check if Records are Working

### Check SPF:
```bash
nslookup -type=TXT lumartrust.com
```
Should show: `v=spf1 include:_spf.resend.com include:netlify.com ~all`

### Check DKIM:
```bash  
nslookup -type=TXT resend._domainkey.lumartrust.com
```
Should show the DKIM key from Resend

### Check DMARC:
```bash
nslookup -type=TXT _dmarc.lumartrust.com  
```
Should show: `v=DMARC1; p=quarantine...`

## 🎯 Email Deliverability Test Tools

After adding DNS records, test with:
- **Mail Tester**: https://www.mail-tester.com/
- **MXToolbox**: https://mxtoolbox.com/spf.aspx
- **DMARC Analyzer**: https://www.dmarcanalyzer.com/

## ⏰ Timeline
- **DNS Propagation**: 1-24 hours
- **Email Providers Recognition**: 24-72 hours  
- **Full Deliverability**: 3-7 days (reputation building)

## 🚀 Quick Win: Use Cloudflare
If you want immediate results:
1. Transfer DNS to Cloudflare (free)
2. Add these same records in Cloudflare
3. Get instant SSL + better email deliverability
4. Cloudflare has better relationships with email providers

## 📞 Priority Actions:
1. **Add SPF record** (most important)
2. **Get DKIM from Resend dashboard** 
3. **Add DMARC record**
4. **Wait 24 hours for propagation**
5. **Test email delivery**

These DNS records are what's missing and causing spam folder delivery!