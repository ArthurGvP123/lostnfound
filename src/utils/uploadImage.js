// src/utils/uploadImage.js
import axios from 'axios';

export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET); 
  
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData
    );
    return response.data.secure_url; 
  } catch (error) {
    console.error("Gagal upload gambar:", error);
    throw error;
  }
};