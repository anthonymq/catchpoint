import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// Get photos directory path
function getPhotosDirectory(): string {
  try {
    // @ts-expect-error - documentDirectory may not be typed in older versions
    const docDir = FileSystem.documentDirectory;
    if (docDir) {
      return `${docDir}photos`;
    }
  } catch {
    // Ignore
  }
  try {
    // @ts-expect-error - cacheDirectory may not be typed in older versions
    const cacheDir = FileSystem.cacheDirectory;
    if (cacheDir) {
      return `${cacheDir}photos`;
    }
  } catch {
    // Ignore
  }
  return '';
}

const PHOTOS_DIR = getPhotosDirectory();

export interface PhotoResult {
  uri: string;
  width: number;
  height: number;
}

/**
 * Initialize the photos directory
 */
export async function initPhotosDir(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

/**
 * Get the photo directory path
 */
function getPhotosDir(): string {
  return PHOTOS_DIR;
}

/**
 * Pick an image from the device's media library
 */
export async function pickImage(): Promise<PhotoResult | null> {
  const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (!granted) {
    console.log('[PhotoService] Media library permission denied');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    width: asset.width || 0,
    height: asset.height || 0,
  };
}

/**
 * Take a photo using the device camera
 */
export async function takePhoto(): Promise<PhotoResult | null> {
  const { granted } = await ImagePicker.requestCameraPermissionsAsync();
  
  if (!granted) {
    console.log('[PhotoService] Camera permission denied');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    width: asset.width || 0,
    height: asset.height || 0,
  };
}

/**
 * Save a photo to the app's local storage
 * Returns the local file URI
 */
export async function savePhotoToLocal(uri: string, catchId: string): Promise<string | null> {
  try {
    await initPhotosDir();

    const extension = Platform.OS === 'ios' ? 'jpg' : 'jpeg';
    const fileName = `${catchId}_${Date.now()}.${extension}`;
    const destUri = `${PHOTOS_DIR}/${fileName}`;

    // Copy the file to the app's documents directory
    await FileSystem.copyAsync({
      from: uri,
      to: destUri,
    });

    console.log('[PhotoService] Photo saved to:', destUri);
    return destUri;
  } catch (error) {
    console.error('[PhotoService] Failed to save photo:', error);
    return null;
  }
}

/**
 * Delete a photo from local storage
 */
export async function deletePhoto(uri: string): Promise<boolean> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(uri);
      console.log('[PhotoService] Photo deleted:', uri);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[PhotoService] Failed to delete photo:', error);
    return false;
  }
}

/**
 * Check if a photo exists in local storage
 */
export async function photoExists(uri: string): Promise<boolean> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    return fileInfo.exists;
  } catch {
    return false;
  }
}

/**
 * Get the size of a photo file
 */
export async function getPhotoSize(uri: string): Promise<number | null> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists && !fileInfo.isDirectory) {
      return fileInfo.size;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generate a unique file name for a photo
 */
export async function generatePhotoFileName(): Promise<string> {
  const uuid = await Crypto.randomUUID();
  const extension = Platform.OS === 'ios' ? 'jpg' : 'jpeg';
  return `${uuid}.${extension}`;
}
