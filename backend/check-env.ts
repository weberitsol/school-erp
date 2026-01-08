import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env file
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const config = dotenv.config({ path: envPath });
  console.log('Loaded .env from:', envPath);
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
} else {
  console.log('.env file not found at:', envPath);
}
