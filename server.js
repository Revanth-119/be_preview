import logger from './utils/logger.js';
import http from 'http';
import App from './app.js';
import dotenv from 'dotenv';
import connectToDb from './config/db.js';
dotenv.config();

const startServer = () => {
  try {
    const port = process.env.PORT || 3000;
    const app = new App();
    const server = http.createServer(app.getApp());

    server.listen(port, () => {
      logger.info(`Worker ${process.pid} start and listening on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start the server:', error);
    process.exit(1);
  }
};

const DB_NAME = process.env.DB_NAME || 'Siddhi';
const DB_URI = process.env.DB_URI ?? `mongodb://127.0.0.1:27017/${DB_NAME}`;

if (process.env.NODE_ENV === 'production') {
  //start the cluster in production phase
} else {
  await connectToDb(DB_URI);
  startServer();
}
