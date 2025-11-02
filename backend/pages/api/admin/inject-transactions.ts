import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db';
import User from '../../../models/User';
import Admin from '../../../models/Admin';
import Transaction from '../../../models/Transaction';
import jwt from 'jsonwebtoken';

// Realistic transaction data for variety
const TRANSACTION_TYPES = {
  incoming: [
    { type: 'salary', description: 'Monthly Salary Payment', amountRange: [3000, 8000] },
    { type: 'freelance', description: 'Freelance Project Payment', amountRange: [500, 2500] },
    { type: 'refund', description: 'Purchase Refund', amountRange: [25, 300] },
    { type: 'gift', description: 'Gift from Family', amountRange: [100, 1000] },
    { type: 'investment', description: 'Investment Return', amountRange: [200, 1500] },
    { type: 'bonus', description: 'Performance Bonus', amountRange: [500, 3000] },
    { type: 'cashback', description: 'Credit Card Cashback', amountRange: [10, 150] },
    { type: 'dividend', description: 'Stock Dividend', amountRange: [50, 800] }
  ],
  outgoing: [
    { type: 'rent', description: 'Monthly Rent Payment', amountRange: [800, 2500] },
    { type: 'grocery', description: 'Grocery Shopping', amountRange: [50, 200] },
    { type: 'utilities', description: 'Utility Bill Payment', amountRange: [80, 300] },
    { type: 'gas', description: 'Gas Station Payment', amountRange: [30, 100] },
    { type: 'restaurant', description: 'Restaurant Payment', amountRange: [25, 150] },
    { type: 'shopping', description: 'Online Shopping', amountRange: [40, 400] },
    { type: 'insurance', description: 'Insurance Premium', amountRange: [200, 600] },
    { type: 'subscription', description: 'Monthly Subscription', amountRange: [10, 50] },
    { type: 'medical', description: 'Medical Payment', amountRange: [100, 800] },
    { type: 'transport', description: 'Transportation', amountRange: [20, 80] },
    { type: 'education', description: 'Educational Payment', amountRange: [100, 1000] },
    { type: 'loan', description: 'Loan Payment', amountRange: [300, 1500] }
  ]
};

const SENDER_NAMES = [
  'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson',
  'Lisa Anderson', 'Robert Taylor', 'Jennifer Miller', 'William Jones', 'Mary Williams',
  'James Garcia', 'Patricia Martinez', 'Christopher Rodriguez', 'Linda Lewis', 'Matthew Lee',
  'Amazon Inc', 'PayPal Inc', 'Walmart', 'Target Corporation', 'Starbucks Coffee',
  'Netflix Inc', 'Spotify AB', 'Apple Inc', 'Google LLC', 'Microsoft Corp'
];

function generateRandomAccountNumber(): string {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function generateRandomDate(startDate: Date, endDate: Date): Date {
  const start = startDate.getTime();
  const end = endDate.getTime();
  return new Date(start + Math.random() * (end - start));
}

function distributeTransactionsOverTime(totalTransactions: number, startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  
  // Generate random dates
  for (let i = 0; i < totalTransactions; i++) {
    dates.push(generateRandomDate(startDate, endDate));
  }
  
  // Sort dates chronologically
  dates.sort((a, b) => a.getTime() - b.getTime());
  
  return dates;
}

function generateRealisticTransaction(userAccount: string, date: Date, isIncoming: boolean) {
  const transactionTypes = isIncoming ? TRANSACTION_TYPES.incoming : TRANSACTION_TYPES.outgoing;
  const selectedType = getRandomElement(transactionTypes);
  const amount = generateRandomAmount(selectedType.amountRange[0], selectedType.amountRange[1]);
  
  let senderAccount: string;
  let receiverAccount: string;
  let senderName: string | undefined;
  
  if (isIncoming) {
    senderAccount = generateRandomAccountNumber();
    receiverAccount = userAccount;
    senderName = getRandomElement(SENDER_NAMES);
  } else {
    senderAccount = userAccount;
    receiverAccount = generateRandomAccountNumber();
    senderName = undefined;
  }
  
  return {
    senderAccount,
    receiverAccount,
    amount,
    type: Math.random() > 0.8 ? 'external' : 'internal', // 80% internal, 20% external
    status: Math.random() > 0.05 ? 'completed' : 'pending', // 95% completed, 5% pending
    narration: selectedType.description,
    senderName,
    createdAt: date,
    updatedAt: date
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    // Verify admin authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('🔍 Auth Debug - Token present:', !!token);
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      console.log('✅ Token decoded successfully, userId:', decoded.userId);
    } catch (jwtError) {
      console.log('❌ JWT verification failed:', jwtError);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const adminUser = await Admin.findById(decoded.userId);
    console.log('👤 Admin found:', !!adminUser);
    
    if (!adminUser) {
      console.log('❌ Admin not found in database');
      return res.status(403).json({ error: 'Admin not found' });
    }

    console.log('✅ Admin authentication successful');

    const { 
      targetUserId, 
      startDate, 
      endDate, 
      totalTransactions,
      incomingPercentage = 60 // Default 60% incoming, 40% outgoing
    } = req.body;

    // Validation
    if (!targetUserId || !startDate || !endDate || !totalTransactions) {
      return res.status(400).json({ 
        error: 'Missing required fields: targetUserId, startDate, endDate, totalTransactions' 
      });
    }

    if (totalTransactions < 1 || totalTransactions > 10000) {
      return res.status(400).json({ 
        error: 'Total transactions must be between 1 and 10,000' 
      });
    }

    // Find target user
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }

    console.log(`🎯 Admin ${adminUser.name} injecting ${totalTransactions} transactions for user ${targetUser.name}`);
    console.log(`📅 Date range: ${start.toDateString()} to ${end.toDateString()}`);

    // Calculate transaction split
    const incomingCount = Math.round(totalTransactions * (incomingPercentage / 100));
    const outgoingCount = totalTransactions - incomingCount;

    // Generate random dates for all transactions
    const incomingDates = distributeTransactionsOverTime(incomingCount, start, end);
    const outgoingDates = distributeTransactionsOverTime(outgoingCount, start, end);

    const transactions = [];

    // Generate incoming transactions
    for (const date of incomingDates) {
      const transaction = generateRealisticTransaction(targetUser.accountNumber, date, true);
      transactions.push(transaction);
    }

    // Generate outgoing transactions
    for (const date of outgoingDates) {
      const transaction = generateRealisticTransaction(targetUser.accountNumber, date, false);
      transactions.push(transaction);
    }

    // Sort all transactions by date
    transactions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Batch insert transactions
    const insertedTransactions = await Transaction.insertMany(transactions);

    // Calculate balance impact (incoming - outgoing)
    const totalIncoming = transactions
      .filter(t => t.receiverAccount === targetUser.accountNumber)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalOutgoing = transactions
      .filter(t => t.senderAccount === targetUser.accountNumber)
      .reduce((sum, t) => sum + t.amount, 0);

    const balanceChange = totalIncoming - totalOutgoing;

    // Update user balance
    await User.findByIdAndUpdate(targetUserId, {
      $inc: { balance: balanceChange }
    });

    console.log(`✅ Injected ${insertedTransactions.length} transactions`);
    console.log(`💰 Balance change: ${balanceChange > 0 ? '+' : ''}$${balanceChange.toFixed(2)}`);

    res.status(200).json({
      success: true,
      message: `Successfully injected ${insertedTransactions.length} transactions`,
      summary: {
        totalTransactions: insertedTransactions.length,
        incomingTransactions: incomingCount,
        outgoingTransactions: outgoingCount,
        dateRange: {
          start: start.toDateString(),
          end: end.toDateString()
        },
        balanceChange: Math.round(balanceChange * 100) / 100,
        targetUser: {
          name: targetUser.name,
          accountNumber: targetUser.accountNumber
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Transaction injection failed:', error);
    res.status(500).json({ 
      error: 'Failed to inject transactions',
      details: error.message 
    });
  }
}