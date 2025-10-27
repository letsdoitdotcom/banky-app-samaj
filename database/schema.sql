# BankyApp MongoDB Collections Schema

This document describes the MongoDB collections and their schemas for the BankyApp banking simulation.

## Collections Overview

### 1. users
Stores all user information including personal details and account status.

```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  phone: String (required),
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  idNumber: String (required), // National ID or SSN
  verified: Boolean (default: false),
  approved: Boolean (default: false),
  accountNumber: String (unique, 10 digits),
  balance: Number (default: 0.00),
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now),
  verificationToken: String,
  verificationTokenExpires: Date
}
```

### 2. transactions
Stores all transaction records with detailed information.

```javascript
{
  _id: ObjectId,
  senderId: ObjectId (ref: 'User'),
  senderAccount: String (required),
  receiverAccount: String (required),
  amount: Number (required),
  type: String (enum: ['internal', 'external']),
  status: String (enum: ['pending', 'completed', 'failed'], default: 'pending'),
  narration: String,
  createdAt: Date (default: Date.now),
  completedAt: Date,
  completedBy: ObjectId (ref: 'Admin') // Admin who completed the transaction
}
```

### 3. admins
Stores admin user credentials and roles.

```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['superadmin', 'staff'], default: 'staff'),
  createdAt: Date (default: Date.now),
  lastLogin: Date
}
```

## Indexes for Performance

### users collection:
- email (unique)
- accountNumber (unique, sparse)
- verified, approved (compound)
- createdAt

### transactions collection:
- senderId
- senderAccount
- receiverAccount
- status
- createdAt

### admins collection:
- email (unique)

## Sample Data

### Default Admin User
```javascript
{
  name: "System Administrator",
  email: "admin@bankyapp.com",
  password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // admin123
  role: "superadmin"
}
```

### Sample User
```javascript
{
  name: "John Doe",
  email: "john@example.com",
  password: "$2a$10$...", // hashed password
  phone: "+1234567890",
  address: {
    street: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "USA"
  },
  idNumber: "123-45-6789",
  verified: true,
  approved: true,
  accountNumber: "1234567890",
  balance: 5000.00
}
```