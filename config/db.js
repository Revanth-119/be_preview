import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectToDb = async (url) => {
  try {
    const connectionInstance = await mongoose.connect(url);
    logger.info(`Mongodb connected successfully to ${connectionInstance.connection.host}`);
  } catch (error) {
    logger.error(`Mongodb connection failed ${error}`);
    process.exit(1);
  }
};
export default connectToDb;
