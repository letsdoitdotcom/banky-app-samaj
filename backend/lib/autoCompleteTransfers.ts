import connectDB from './db';
import Transaction from '../models/Transaction';

export const scheduleTransferCompletion = (transactionId: string) => {
  // Random delay between 1 second and 1 hour (3600 seconds)
  const randomDelaySeconds = Math.floor(Math.random() * 3600) + 1;
  
  console.log(`🕐 Scheduling external transfer ${transactionId} to complete in ${randomDelaySeconds} seconds`);
  
  setTimeout(async () => {
    try {
      await connectDB();
      
      const transaction = await Transaction.findById(transactionId);
      if (transaction && transaction.status === 'pending' && transaction.type === 'external') {
        transaction.status = 'completed';
        transaction.completedAt = new Date();
        await transaction.save();
        
        console.log(`✅ External transfer ${transactionId} auto-completed after ${randomDelaySeconds} seconds`);
      }
    } catch (error) {
      console.error('❌ Failed to auto-complete external transfer:', error);
    }
  }, randomDelaySeconds * 1000);
};