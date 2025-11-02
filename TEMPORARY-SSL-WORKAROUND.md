# 🔧 Temporary SSL Workaround - Update Environment Variables

## Update Vercel Backend Environment (.env.local)
```bash
# Change this temporarily to use working Netlify subdomain
FRONTEND_URL=https://incomparable-macaron-eb6786.netlify.app

# Keep other variables the same
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret  
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Update Netlify Frontend Environment
In Netlify Dashboard → Environment variables:
```bash
NEXT_PUBLIC_API_URL=https://banky-app-samaj.vercel.app
NEXT_PUBLIC_SITE_URL=https://incomparable-macaron-eb6786.netlify.app
```

## 🎯 This Fixes:
✅ Immediate HTTPS access via incomparable-macaron-eb6786.netlify.app
✅ Email verification links will work with HTTPS
✅ All security features enabled
✅ Can change back to lumartrust.com once SSL issue resolves

## 📞 Next Steps:
1. Deploy these changes
2. Test registration with HTTPS working
3. Contact Netlify support about lumartrust.com SSL issue
4. Once fixed, revert FRONTEND_URL back to https://lumartrust.com

## 🔍 Why This Works:
- Netlify automatically provides SSL for *.netlify.app subdomains
- Your custom domain SSL is just a configuration issue
- This gives you immediate HTTPS while troubleshooting continues