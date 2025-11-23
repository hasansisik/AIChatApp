import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

const CLOUD_NAME = 'da2qwsrbv';
const API_KEY = '712369776222516';
const API_SECRET = '3uw0opJfkdYDp-XQsXclVIcbbKQ';

async function generateSignature(timestamp: number): Promise<string> {
  const str = `timestamp=${timestamp}${API_SECRET}`;
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA1,
    str
  );
}

interface UploadResult {
  info: {
    public_id: string;
    secure_url: string;
  };
}

/**
 * Upload image to Cloudinary from React Native image URI
 * @param uri - Image URI from ImagePicker (e.g., file:// or content:// URI)
 * @param filename - Optional filename for the upload
 * @returns Promise that resolves to the secure URL of the uploaded image
 */
export const uploadImageToCloudinary = (uri: string, filename?: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const signature = await generateSignature(timestamp);

      // Create FormData for React Native
      const formData = new FormData();
      
      // For React Native, we need to append the file differently
      // The file should be an object with uri, type, and name
      const fileExtension = uri.split('.').pop() || 'jpg';
      const imageName = filename || `image-${timestamp}.${fileExtension}`;
      
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        type: `image/${fileExtension}`,
        name: imageName,
      } as any);
      
      formData.append('api_key', API_KEY);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.error) {
        reject(new Error(data.error.message));
      } else {
        resolve(data.secure_url);
      }
    } catch (error) {
      console.error('Upload error:', error);
      reject(error);
    }
  });
};