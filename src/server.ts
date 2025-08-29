import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { initDb } from './config/db';

const PORT = Number(process.env.PORT ?? 4000);

async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`URL shortener running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
