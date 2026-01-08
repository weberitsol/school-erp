import express from 'express';
import { authenticate } from './src/middleware/auth.middleware';
import { feeController } from './src/controllers/fee.controller';
import prisma from './src/config/database';

const app = express();

// Mock middleware
app.use((req, res, next) => {
  req.user = {
    id: '5a162e4d-0144-4af7-a5cc-3533fbac47cc',
    email: 'admin@weberacademy.edu',
    role: 'ADMIN' as any,
    schoolId: '8501d9f6-73b3-4197-95d7-73b4083822b4',
  };
  next();
});

// Test the endpoint
app.get('/api/v1/fees/structure', feeController.getFeeStructures);

// Start test
const server = app.listen(5001, async () => {
  try {
    const response = await fetch('http://localhost:5001/api/v1/fees/structure?page=0&limit=10');
    const text = await response.text();
    console.log('Response status:', response.status);
    console.log('Response size:', text.length, 'bytes');
    console.log('Response body:', text.substring(0, 500));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    server.close();
  }
});
