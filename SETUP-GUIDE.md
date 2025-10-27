# 🏦 BankyApp Setup Guide

## Complete Requirements for Banking Account Opening

Your enhanced registration form now includes **all comprehensive banking requirements** typically needed to open a real bank account:

### 📋 Form Requirements (6 Steps):

#### Step 1: Personal Information
- **Basic Details**: First name, last name, middle name
- **Contact**: Email, phone number, alternate phone
- **Demographics**: Date of birth, gender, marital status, nationality
- **Security**: Password with confirmation

#### Step 2: Address Information
- **Current Address**: Street, city, state, ZIP, country
- **Residence Details**: Ownership type, years at address
- **Previous Address**: Required if less than 2 years at current address

#### Step 3: Identity & Employment Verification
- **Identity Documents**: ID type, number, issue/expiry dates, SSN
- **Employment Status**: Employed, self-employed, unemployed, student, retired
- **Work Details**: Employer name, job title, monthly income, industry type

#### Step 4: Financial Information
- **Source of Funds**: Salary, business, investments, inheritance
- **Account Preferences**: Checking, savings, or business account
- **Transaction Expectations**: Monthly deposits/withdrawals estimates
- **Other Financial Relationships**: Other banks, credit cards, loans

#### Step 5: Legal & Compliance
- **Politically Exposed Person (PEP)** status
- **Tax Residency** information
- **Criminal History** declarations
- **Anti-Money Laundering (AML)** compliance

#### Step 6: Final Details & Agreements
- **Emergency Contact** information
- **Banking Preferences**: Language, communication methods
- **Legal Agreements**: Terms & conditions, privacy policy
- **Information Accuracy** confirmation

---

## 🛠 Complete Setup Instructions

### 1. MongoDB Atlas Setup (Required)

1. **Create MongoDB Atlas Account**:
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Sign up for a free account
   - Create a new cluster (M0 Sandbox - FREE)

2. **Configure Database Access**:
   - Go to "Database Access" → "Add New Database User"
   - Create username/password (remember these!)
   - Set permissions to "Read and write to any database"

3. **Configure Network Access**:
   - Go to "Network Access" → "Add IP Address"
   - For development: Add `0.0.0.0/0` (allows all IPs)
   - For production: Add your specific IP addresses

4. **Get Connection String**:
   - Go to "Clusters" → "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

### 2. Environment Configuration

Update your environment files with real values:

**Backend (.env.local)**:
```env
# Replace with your actual MongoDB connection string
MONGODB_URI=mongodb+srv://yourusername:yourpassword@yourcluster.mongodb.net/bankyapp?retryWrites=true&w=majority

# Generate a secure JWT secret (64+ characters)
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-64-characters-long-for-production-security

# Optional: Email service for verification emails
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Frontend URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

**Frontend (.env.local)**:
```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Frontend URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Optional: Email Service Setup

For email verification functionality:

#### Option A: Resend (Recommended)
1. Sign up at [Resend.com](https://resend.com)
2. Create an API key
3. Add to `RESEND_API_KEY` in backend/.env.local

#### Option B: Gmail SMTP
1. Enable 2-Factor Authentication on Gmail
2. Generate App Password
3. Update email configuration in backend/lib/email.ts

### 4. JWT Secret Generation

Generate a secure JWT secret:

```bash
# Option 1: Use Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Use OpenSSL
openssl rand -hex 64

# Option 3: Online generator
# Visit: https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
```

### 5. Database Initialization

The application will automatically:
- Create required collections (users, transactions, admins)
- Set up database indexes
- Create default admin user (admin@bankyapp.com / Admin123!)

---

## 🚀 Running the Application

### Start Both Servers:

```bash
# Terminal 1: Backend (API Server)
cd backend
npm install
npm run dev
# Runs on http://localhost:3001

# Terminal 2: Frontend (Web App)
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### Or use the root package.json:

```bash
# From project root
npm install
npm run dev
# Starts both frontend and backend
```

---

## 🧪 Testing the Application

### 1. Admin Access
- URL: http://localhost:3000/admin-login
- Email: `admin@bankyapp.com`
- Password: `Admin123!`

### 2. User Registration Flow
1. Go to http://localhost:3000/register
2. Complete all 6 steps of registration
3. Admin must approve the user (via admin dashboard)
4. User can then login and access banking features

### 3. Banking Features
- Account overview with balance
- Money transfers between accounts
- Transaction history
- Profile management

---

## 🔧 Additional Optional Configurations

### SSL/HTTPS (Production)
- Update URLs to use HTTPS
- Configure SSL certificates
- Update CORS settings

### Email Templates
- Customize email templates in backend/lib/email.ts
- Add your company branding
- Localization support

### Payment Integration
- Stripe or PayPal for real payments
- ACH transfer simulation
- Wire transfer features

### Advanced Security
- Two-factor authentication (2FA)
- Biometric login
- Device fingerprinting
- Fraud detection

### Compliance Features
- Know Your Customer (KYC) verification
- Document upload and verification
- Enhanced Due Diligence (EDD)
- Sanctions screening

---

## 📱 Mobile Responsiveness

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All major browsers

---

## 🛡 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Comprehensive form validation
- **SQL Injection Protection**: MongoDB ODM protection
- **XSS Protection**: React built-in protections
- **CSRF Protection**: Token-based protection

---

## 💡 Customization Options

You can easily modify:

### Remove Unwanted Fields
Edit `frontend/pages/register.tsx` and remove any fields you don't need from the `FormData` interface and form steps.

### Simplify Registration
Reduce from 6 steps to fewer by combining steps or removing entire sections.

### Add New Features
- Loan applications
- Investment accounts
- Credit card applications
- Business banking features

### Styling Customization
- Update colors in `tailwind.config.js`
- Modify components in `frontend/styles/globals.css`
- Add your brand logo and colors

---

## 🚨 Production Deployment

### Security Checklist
- [ ] Use environment-specific MongoDB clusters
- [ ] Enable MongoDB authentication
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS everywhere
- [ ] Implement rate limiting
- [ ] Add monitoring and logging
- [ ] Regular security audits

### Performance Optimization
- [ ] Enable MongoDB connection pooling
- [ ] Implement caching (Redis)
- [ ] Optimize images and assets
- [ ] Enable compression
- [ ] CDN for static assets

---

## 📞 Support

If you need help with setup:
1. Check the browser console for errors
2. Verify MongoDB connection string
3. Ensure all environment variables are set
4. Test API endpoints directly
5. Check terminal output for error messages

The application now includes **all standard banking requirements** and is ready for customization based on your specific needs!