// Force Vercel deployment
export default function handler(req: any, res: any) {
  res.json({ 
    status: 'API is working',
    timestamp: new Date().toISOString(),
    method: req.method
  });
}