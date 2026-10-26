import type { SignedUpload } from './types';

export interface UploadResult {
  secureUrl: string;
  publicId: string;
}

/**
 * Upload a file straight from the browser to Cloudinary using signed params
 * from POST /uploads/sign. The API never receives the bytes — only the
 * resulting URL and public id (sent later on the deliverable).
 */
export function uploadToCloudinary(
  file: File,
  signed: SignedUpload,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', signed.apiKey);
    form.append('timestamp', String(signed.timestamp));
    form.append('signature', signed.signature);
    form.append('folder', signed.folder);

    const xhr = new XMLHttpRequest();
    xhr.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${signed.cloudName}/auto/upload`,
    );
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const res = JSON.parse(xhr.responseText) as {
          secure_url: string;
          public_id: string;
        };
        resolve({ secureUrl: res.secure_url, publicId: res.public_id });
      } else {
        reject(new Error('Upload to Cloudinary failed.'));
      }
    };
    xhr.onerror = () => reject(new Error('Upload to Cloudinary failed.'));
    xhr.send(form);
  });
}
