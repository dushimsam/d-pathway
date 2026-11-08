import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadToCloudinary } from './cloudinary';
import type { SignedUpload } from './types';

const signed: SignedUpload = {
  cloudName: 'demo',
  apiKey: 'key',
  timestamp: 123,
  signature: 'sig',
  folder: 'capstone/covers',
};

// A controllable fake XHR so we can drive onload/onerror and progress.
class FakeXHR {
  static instances: FakeXHR[] = [];
  upload: { onprogress?: (e: ProgressEvent) => void } = {};
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  status = 200;
  responseText = '';
  method = '';
  url = '';
  sent: unknown = null;
  constructor() {
    FakeXHR.instances.push(this);
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  send(body: unknown) {
    this.sent = body;
  }
}

beforeEach(() => {
  FakeXHR.instances = [];
  vi.stubGlobal('XMLHttpRequest', FakeXHR as unknown as typeof XMLHttpRequest);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function file() {
  return new File(['data'], 'cover.png', { type: 'image/png' });
}

describe('uploadToCloudinary', () => {
  it('posts to the Cloudinary endpoint and resolves url + public id on success', async () => {
    const p = uploadToCloudinary(file(), signed);
    const xhr = FakeXHR.instances[0];
    expect(xhr.method).toBe('POST');
    expect(xhr.url).toBe('https://api.cloudinary.com/v1_1/demo/auto/upload');
    expect(xhr.sent).toBeInstanceOf(FormData);

    xhr.status = 200;
    xhr.responseText = JSON.stringify({ secure_url: 'https://cdn/x.png', public_id: 'x' });
    xhr.onload?.();

    await expect(p).resolves.toEqual({ secureUrl: 'https://cdn/x.png', publicId: 'x' });
  });

  it('reports progress percentages', async () => {
    const onProgress = vi.fn();
    const p = uploadToCloudinary(file(), signed, onProgress);
    const xhr = FakeXHR.instances[0];
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 200 } as ProgressEvent);
    expect(onProgress).toHaveBeenCalledWith(25);

    xhr.status = 200;
    xhr.responseText = JSON.stringify({ secure_url: 'u', public_id: 'i' });
    xhr.onload?.();
    await p;
  });

  it('ignores progress events that are not length-computable', async () => {
    const onProgress = vi.fn();
    const p = uploadToCloudinary(file(), signed, onProgress);
    const xhr = FakeXHR.instances[0];
    xhr.upload.onprogress?.({ lengthComputable: false, loaded: 1, total: 2 } as ProgressEvent);
    expect(onProgress).not.toHaveBeenCalled();
    xhr.status = 200;
    xhr.responseText = JSON.stringify({ secure_url: 'u', public_id: 'i' });
    xhr.onload?.();
    await p;
  });

  it('rejects on a non-2xx status', async () => {
    const p = uploadToCloudinary(file(), signed);
    const xhr = FakeXHR.instances[0];
    xhr.status = 400;
    xhr.onload?.();
    await expect(p).rejects.toThrow('Upload to Cloudinary failed.');
  });

  it('rejects on a network error', async () => {
    const p = uploadToCloudinary(file(), signed);
    const xhr = FakeXHR.instances[0];
    xhr.onerror?.();
    await expect(p).rejects.toThrow('Upload to Cloudinary failed.');
  });
});
