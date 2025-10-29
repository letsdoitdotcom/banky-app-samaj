import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db';
import User from '../../../models/User';
import Transaction from '../../../models/Transaction';
import { authMiddleware, AuthenticatedRequest } from '../../../middleware/auth';
import { transferPerUserRateLimit } from '../../../middleware/rateLimit';
import { sanitizeAccountNumber, sanitizeBankyAppAccountNumber, sanitizeNarration } from '../../../utils/sanitize';
import { scheduleTransferCompletion } from '../../../lib/autoCompleteTransfers';
import Joi from 'joi';

// Validation schema
const transferSchema = Joi.object({
  receiverAccount: Joi.string().min(8).max(20).required().messages({
    'string.empty': 'Account number is required',
    'string.min': 'Account number must be at least 8 characters',
    'string.max': 'Account number cannot exceed 20 characters',
    'any.required': 'Please enter the recipient\'s account number'
  }),
  amount: Joi.number().positive().max(1000000).required().messages({
    'number.positive': 'Amount must be greater than 0',
    'number.max': 'Amount cannot exceed $1,000,000',
    'any.required': 'Please enter the transfer amount'
  }),
  type: Joi.string().valid('internal', 'external').required().messages({
    'any.only': 'Transfer type must be either internal or external',
    'any.required': 'Transfer type is required'
  }),
  narration: Joi.string().max(500).optional().messages({
    'string.max': 'Description cannot exceed 500 characters'
  }),
  beneficiaryName: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Beneficiary name is required',
    'string.min': 'Beneficiary name must be at least 2 characters',
    'string.max': 'Beneficiary name cannot exceed 100 characters',
    'any.required': 'Please enter the beneficiary name'
  }),
  transferReference: Joi.string().min(3).max(50).required().messages({
    'string.empty': 'Transfer reference is required',
    'string.min': 'Transfer reference must be at least 3 characters',
    'string.max': 'Transfer reference cannot exceed 50 characters',
    'any.required': 'Please enter a transfer reference'
  }),
  purposeOfTransfer: Joi.string().min(3).max(200).required().messages({
    'string.empty': 'Purpose of transfer is required',
    'string.min': 'Purpose must be at least 3 characters',
    'string.max': 'Purpose cannot exceed 200 characters',
    'any.required': 'Please specify the purpose of transfer'
  }),
});

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting for transfers
  return new Promise<void>((resolve, reject) => {
    transferPerUserRateLimit(req, res, async () => {
      try {
        await handleTransfer(req, res);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function handleTransfer(req: AuthenticatedRequest, res: NextApiResponse) {

  try {
    await connectDB();

    const userId = req.user?.userId;
    const userAccountNumber = req.user?.accountNumber;

    if (!userId || !userAccountNumber) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate request body
    const { error, value } = transferSchema.validate(req.body);
    if (error) {
      // Return the first validation error with user-friendly message
      const errorMessage = error.details[0]?.message || 'Please check your transfer details';
      return res.status(400).json({ 
        error: errorMessage
      });
    }

    const { receiverAccount, amount, type, narration, beneficiaryName, transferReference, purposeOfTransfer } = value;

    // Sanitize inputs based on transfer type
    let sanitizedReceiverAccount: string;
    
    if (type === 'internal') {
      // For internal transfers, use strict BankyApp validation (10 digits only)
      try {
        sanitizedReceiverAccount = sanitizeBankyAppAccountNumber(receiverAccount);
      } catch (error: any) {
        return res.status(400).json({ 
          error: 'Invalid BankyApp account number. Internal transfers require a 10-digit BankyApp account number.' 
        });
      }
    } else {
      // For external transfers, use flexible validation (8-20 characters)
      try {
        sanitizedReceiverAccount = sanitizeAccountNumber(receiverAccount);
      } catch (error: any) {
        return res.status(400).json({ 
          error: 'Invalid external account number. Please check the account number format.' 
        });
      }
    }
    
    const sanitizedNarration = sanitizeNarration(narration || '');
    const sanitizedBeneficiaryName = beneficiaryName.trim().replace(/\s+/g, ' ');
    const sanitizedTransferReference = transferReference.trim().replace(/\s+/g, ' ');
    const sanitizedPurposeOfTransfer = purposeOfTransfer.trim().replace(/\s+/g, ' ');

    // Check if trying to transfer to same account
    if (sanitizedReceiverAccount === userAccountNumber) {
      return res.status(400).json({ error: 'Cannot transfer to your own account' });
    }

    // For internal transfers, verify receiver account exists and is valid
    if (type === 'internal') {
      const receiverUser = await User.findOne({ 
        accountNumber: sanitizedReceiverAccount
      });

      if (!receiverUser) {
        return res.status(400).json({ 
          error: 'BankyApp account not found. Please check the account number and try again.' 
        });
      }

      if (!receiverUser.approved) {
        return res.status(400).json({ 
          error: 'The recipient account is not yet approved for transfers. Please try again later.' 
        });
      }

      if (!receiverUser.emailVerified) {
        return res.status(400).json({ 
          error: 'The recipient account is not verified. Transfers can only be made to verified accounts.' 
        });
      }
    }

    // Use MongoDB session for atomic transaction to prevent race conditions
    const session = await User.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Get current user and check balance (within transaction)
        const user = await User.findById(userId).session(session);
        if (!user) {
          throw new Error('User not found');
        }

        // Check if sufficient balance
        if (user.balance < amount) {
          const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          });
          throw new Error(`Insufficient balance. Available: ${formatter.format(user.balance)}, Required: ${formatter.format(amount)}`);
        }

        // For internal transfers, validate receiver but don't update balances (pending admin approval)
        if (type === 'internal') {
          const receiverUser = await User.findOne({ 
            accountNumber: sanitizedReceiverAccount, 
            approved: true,
            emailVerified: true
          }).session(session);

          if (!receiverUser) {
            throw new Error('Recipient account not found or not eligible for transfers');
          }

          // Create pending transaction record (no balance changes until admin approval)
          const transaction = new Transaction({
            senderId: userId,
            receiverId: receiverUser._id,
            senderAccount: userAccountNumber,
            receiverAccount: sanitizedReceiverAccount,
            senderName: user.name,
            receiverName: receiverUser.name,
            amount,
            type,
            status: 'pending', // Changed to pending - requires admin approval
            narration: sanitizedNarration,
            beneficiaryName: sanitizedBeneficiaryName,
            transferReference: sanitizedTransferReference,
            purposeOfTransfer: sanitizedPurposeOfTransfer,
            beneficiaryName: sanitizedBeneficiaryName,
            transferReference: sanitizedTransferReference,
            purposeOfTransfer: sanitizedPurposeOfTransfer,
            transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          });

          await transaction.save({ session });
          return transaction;
        } else {
          // External transfer - create pending transaction (no balance changes until admin approval)
          const transaction = new Transaction({
            senderId: userId,
            receiverId: null, // External transfers have no internal receiver
            senderAccount: userAccountNumber,
            receiverAccount: sanitizedReceiverAccount,
            senderName: user.name,
            receiverName: sanitizedBeneficiaryName,
            amount,
            type,
            status: 'pending', // Changed to pending - requires admin approval
            narration: sanitizedNarration,
            beneficiaryName: sanitizedBeneficiaryName,
            transferReference: sanitizedTransferReference,
            purposeOfTransfer: sanitizedPurposeOfTransfer,
            transactionId: `EXT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          });

          await transaction.save({ session });
          return transaction;
        }
      });
    } catch (error: any) {
      return res.status(400).json({ 
        error: error.message || 'Transaction failed'
      });
    } finally {
      await session.endSession();
    }

    // Get the updated transaction for response
    const latestTransaction = await Transaction.findOne({
      senderId: userId,
      senderAccount: userAccountNumber,
      receiverAccount: sanitizedReceiverAccount,
      amount,
    }).sort({ createdAt: -1 });

    if (!latestTransaction) {
      return res.status(500).json({ error: 'Transaction processing error' });
    }

    const statusMessage = 'Transfer request submitted successfully. Awaiting admin approval.';

    res.status(201).json({
      message: statusMessage,
      transaction: {
        id: latestTransaction._id,
        senderAccount: userAccountNumber,
        receiverAccount: sanitizedReceiverAccount,
        amount,
        type,
        status: latestTransaction.status,
        narration: sanitizedNarration,
        createdAt: latestTransaction.createdAt,
        completedAt: latestTransaction.completedAt,
      },
    });

  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default authMiddleware('user')(handler);