# Production Troubleshooting Guide

## Admin Login Issues - Diagnostic Steps

### 1. Environment Variables Check
Make sure ALL these environment variables are set in your Vercel dashboard:

**Critical Variables:**
- `MONGODB_URI`: `mongodb+srv://username:password@cluster.mongodb.net/bankyapp?retryWrites=true&w=majority`
- `JWT_SECRET`: `your-256-bit-secret-key-here`
- `NODE_ENV`: `production`

**Admin Configuration:**
- `DEFAULT_ADMIN_EMAIL`: `admin@bankyapp.com`
- `DEFAULT_ADMIN_PASSWORD`: `admin123`
- `DEFAULT_ADMIN_NAME`: `System Administrator`

**Optional but Recommended:**
- `NEXT_PUBLIC_APP_URL`: `https://incomparable-macaron-eb6786.netlify.app`
- `RESEND_API_KEY`: (if using email features)

### 2. Admin User Creation Status
✅ **VERIFIED**: Admin user has been created in MongoDB database
- Email: admin@bankyapp.com
- Password: admin123 (hashed in database)
- Role: superadmin

### 3. Common Issues and Solutions

#### Issue 1: Missing JWT_SECRET in Vercel
**Symptom**: Token generation fails
**Solution**: Add JWT_SECRET environment variable in Vercel dashboard

#### Issue 2: MongoDB Connection Issues
**Symptom**: Database connection errors
**Solution**: Verify MONGODB_URI is correctly set in Vercel

#### Issue 3: CORS Issues
**Symptom**: Cross-origin errors in browser console
**Solution**: ✅ Already fixed - CORS middleware includes Netlify domain

#### Issue 4: Case Sensitivity
**Symptom**: Email not matching
**Solution**: ✅ Code converts email to lowercase automatically

### 4. Testing Steps

1. **Test Backend API Directly**:
   ```bash
   curl -X POST https://banky-app-samaj.vercel.app/api/auth/admin-login \
   -H "Content-Type: application/json" \
   -d '{"email":"admin@bankyapp.com","password":"admin123"}'
   ```

2. **Check Browser Network Tab**:
   - Look for 400/500 errors
   - Check if request is reaching the server
   - Verify CORS headers are present

3. **Admin Login URL**:
   - Frontend: https://incomparable-macaron-eb6786.netlify.app/admin-login
   - Backend API: https://banky-app-samaj.vercel.app/api/auth/admin-login

### 5. Environment Variable Setup in Vercel

Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

Add each variable from the list above. **IMPORTANT**: After adding environment variables, you must redeploy the project for them to take effect.

### 6. Quick Verification

After setting up environment variables and redeploying:

1. Try admin login at: https://incomparable-macaron-eb6786.netlify.app/admin-login
2. Use credentials:
   - Email: admin@bankyapp.com
   - Password: admin123

### 7. Debug Information

If still having issues, check browser console and network tab for:
- Console errors
- Network request status codes
- Response bodies from failed requests
- CORS error messages

### 8. Force Redeploy

Sometimes environment variables don't take effect immediately. Force a redeploy by:
1. Making a small commit to trigger redeployment
2. Or manually triggering redeploy in Vercel dashboard

## Contact Points

- Admin Login: https://incomparable-macaron-eb6786.netlify.app/admin-login
- Backend API: https://banky-app-samaj.vercel.app
- GitHub Repo: https://github.com/letsdoitdotcom/banky-app-samaj