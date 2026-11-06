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
   * to us (on the deliverable). Every upload is nested under the configured root
   * folder (e.g. "capstone"), so the signed folder is `capstone/deliverables`.
   */
  sign(folder: string): SignedUploadParams {
    const { cloudName, apiKey, apiSecret, uploadFolder } =
      this.config.cloudinary;
    const fullFolder = `${uploadFolder}/${folder}`;
    const timestamp = Math.round(Date.now() / 1000);
    // The signature must cover the exact folder the browser will send back.
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: fullFolder },
      apiSecret,
    );
    return { timestamp, signature, apiKey, cloudName, folder: fullFolder };
  }
}
