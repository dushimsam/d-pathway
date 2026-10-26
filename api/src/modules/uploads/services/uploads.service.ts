import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { AppConfigService } from '../../../config/app-config.service.js';

export interface SignedUploadParams {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

@Injectable()
export class UploadsService {
  constructor(private readonly config: AppConfigService) {}

  /**
   * Produce signed parameters for a direct browser → Cloudinary upload. The API
   * never receives the file bytes; only the resulting URL and public id return
   * to us (on the deliverable).
   */
  sign(folder: string): SignedUploadParams {
    const { cloudName, apiKey, apiSecret } = this.config.cloudinary;
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      apiSecret,
    );
    return { timestamp, signature, apiKey, cloudName, folder };
  }
}
