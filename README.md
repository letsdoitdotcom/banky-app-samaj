# 🏦 BankyApp - Banking Simulation Platform

A comprehensive banking web application simulation featuring user registration, admin approval workflow, secure money transfers, and real-time transaction management. Built with modern web technologies and designed for educational and demonstration purposes.

## 🚀 Quick Start

Follow these steps to get BankyApp running on your local machine:

1. **Clone and install dependencies**
2. **Set up environment variables** 
3. **Configure MongoDB Atlas**
4. **Run development servers**
5. **Access the application**

**Demo Credentials**:
- **Admin**: `admin@bankyapp.com` / `Admin123!`

## ✨ Features

### 👤 Customer Portal
- **Registration**: Complete profile with personal details, address, and ID verification
- **Email Verification**: Secure email confirmation before account activation
- **Account Dashboard**: View balance, account number, and transaction history
- **Money Transfer**: Simulate internal and external bank transfers
- **Transaction History**: Real-time transaction tracking with status updates
- **Profile Management**: Update personal information and settings

### 👨‍💼 Admin Dashboard
- **User Management**: Approve/reject customer registrations
- **Account Creation**: Auto-generate unique 10-digit account numbers
- **Transaction Monitoring**: View and manage all system transactions
- **Status Management**: Update transaction statuses (pending → completed)
- **Analytics**: User statistics and transaction reports
- **Email Notifications**: Automated approval notifications

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Backend** | Next.js API Routes, Node.js |
| **Database** | MongoDB Atlas with Mongoose ODM |
| **Authentication** | JWT with bcrypt password hashing |
| **Styling** | Tailwind CSS with custom components |
| **Email Service** | Resend / Nodemailer |
| **Deployment** | Frontend: Netlify, Backend: Vercel |
| **Validation** | Joi schema validation |

## 📁 Project Structure

```
BankyApp/
├── frontend/                 # Next.js frontend (Netlify)
│   ├── pages/               # App pages and routing
│   ├── components/          # Reusable UI components
│   ├── lib/                # API utilities and helpers
│   ├── styles/             # Tailwind CSS and global styles
│   └── context/            # React context providers
├── backend/                 # Next.js API backend (Vercel)
│   ├── pages/api/          # API routes
│   ├── models/             # Mongoose database models
│   ├── lib/                # Database connection and utilities
│   └── middleware/         # Authentication middleware
├── database/               # Database schemas and documentation
└── docs/                   # Additional documentation
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account
- Resend account (optional, for emails)
- Vercel account (for backend deployment)
- Netlify account (for frontend deployment)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/bankyapp.git
cd bankyapp
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm run install:all

# Or install individually
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 3. Environment Configuration

#### Backend (.env.local)
```env
# MongoDB Atlas
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/bankyapp"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secure-jwt-secret-key-64-characters-long"

# Email Service (Resend recommended)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Frontend URL
FRONTEND_URL="http://localhost:3000"  # Development
# FRONTEND_URL="https://your-app.netlify.app"  # Production

# Default Admin
DEFAULT_ADMIN_EMAIL="admin@bankyapp.com"
DEFAULT_ADMIN_PASSWORD="admin123"
DEFAULT_ADMIN_NAME="System Administrator"
```

#### Frontend (.env.local)
```env
# Backend API URL
NEXT_PUBLIC_API_URL="http://localhost:3001/api"  # Development
# NEXT_PUBLIC_API_URL="https://your-api.vercel.app/api"  # Production
```

### 4. Database Setup

#### MongoDB Atlas Configuration
1. Create a MongoDB Atlas account at [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a new cluster (free tier available)
3. Create a database user with read/write permissions
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and add it to `MONGODB_URI`

The application will automatically:
- Create required collections and indexes
- Seed the default admin user
- Set up proper database structure

### 5. Email Service Setup (Optional)

#### Option 1: Resend (Recommended)
1. Sign up at [https://resend.com](https://resend.com)
2. Create an API key
3. Add to `RESEND_API_KEY` in backend environment

#### Option 2: Gmail with Nodemailer
1. Enable 2-Factor Authentication on Gmail
2. Generate an App Password
3. Configure `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`

## 🚀 Development

### Start Development Servers
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:frontend  # Frontend: http://localhost:3000
npm run dev:backend   # Backend: http://localhost:3001
```

### Build for Production
```bash
npm run build
```

## 🌐 Deployment

### Backend Deployment (Vercel)

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   cd backend
   vercel
   ```

2. **Configure Environment Variables** in Vercel dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `RESEND_API_KEY`
   - `FRONTEND_URL`
   - `DEFAULT_ADMIN_EMAIL`
   - `DEFAULT_ADMIN_PASSWORD`
   - `DEFAULT_ADMIN_NAME`

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Frontend Deployment (Netlify)

1. **Build Configuration**
   - Build command: `npm run build && npm run export`
   - Publish directory: `out`

2. **Environment Variables** in Netlify dashboard:
   - `NEXT_PUBLIC_API_URL`: Your Vercel backend URL

3. **Deploy**
   - Connect your Git repository to Netlify
   - Or drag and drop the `out` folder

### Domain Configuration
1. Update `FRONTEND_URL` in Vercel environment variables
2. Update API redirects in `netlify.toml`
3. Update CORS settings if needed

## 🔐 Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Authentication**: 7-day token expiration
- **Input Validation**: Joi schema validation on all endpoints
- **Email Verification**: Secure token-based verification
- **Rate Limiting**: Built-in Next.js API protection
- **CORS Configuration**: Proper cross-origin request handling
- **Environment Variables**: Sensitive data protection

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  idNumber: String (unique),
  verified: Boolean,
  approved: Boolean,
  accountNumber: String (unique, 10 digits),
  balance: Number,
  verificationToken: String,
  verificationTokenExpires: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Transactions Collection
```javascript
{
  _id: ObjectId,
  senderId: ObjectId (ref: User),
  senderAccount: String,
  receiverAccount: String,
  amount: Number,
  type: String (internal/external),
  status: String (pending/completed/failed),
  narration: String,
  completedAt: Date,
  completedBy: ObjectId (ref: Admin),
  createdAt: Date,
  updatedAt: Date
}
```

### Admins Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (superadmin/staff),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/login` - User login
- `POST /api/auth/admin-login` - Admin login

### User Management
- `GET /api/user/profile` - Get user profile
- `GET /api/user/transactions` - Get user transactions
- `POST /api/user/transfer` - Create transfer

### Admin Management
- `GET /api/admin/users` - Get all users
- `POST /api/admin/approve-user` - Approve user
- `GET /api/admin/transactions` - Get all transactions
- `PATCH /api/admin/update-transaction` - Update transaction status

## 🧪 Testing

### Test User Accounts
After deployment, you can create test accounts or use:

**Admin Account**:
- Email: `admin@bankyapp.com`
- Password: `admin123`

**Test User Flow**:
1. Register a new user account
2. Verify email (check console logs in development)
3. Admin approves the user
4. User receives account number and can login
5. User can make transfers (simulation)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- MongoDB Atlas for database hosting
- Vercel for backend deployment
- Netlify for frontend deployment
- Resend for email services
- Tailwind CSS for styling

## 📞 Support

For support, email admin@bankyapp.com or create an issue in the GitHub repository.

---

**⚠️ Disclaimer**: This is a simulation banking application for educational and demonstration purposes only. No real money transactions occur.