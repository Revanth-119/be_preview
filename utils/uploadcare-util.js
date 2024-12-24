import { UploadClient } from '@uploadcare/upload-client';
import dotenv from 'dotenv';

dotenv.config();

const uploadFileToCloud = async (fileBuffer) => {
  try {
    const client = new UploadClient({
      publicKey: process.env.UPLOADCARE_PUBLIC_KEY,
    });

    // Upload the file using the buffer
    const result = await client.uploadFile(fileBuffer);
    console.log('File uploaded successfully:', result.cdnUrl);

    // Return the CDN URL of the uploaded file
    return result.cdnUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('File upload failed');
  }
};

export default uploadFileToCloud;




