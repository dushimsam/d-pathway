import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiSignRequest } = vi.hoisted(() => ({
  apiSignRequest: vi.fn(() => 'signature-123'),
}));

vi.mock('cloudinary', () => ({
  v2: { utils: { api_sign_request: apiSignRequest } },
}));

import { UploadsService } from './uploads.service.js';

function make() {
  const config = {
    cloudinary: {
      cloudName: 'demo',
      apiKey: 'ak',
      apiSecret: 'secret',
      uploadFolder: 'capstone',
    },
  };
  const service = new UploadsService(config as never);
  return { service, config };
}

beforeEach(() => vi.clearAllMocks());

describe('UploadsService.sign', () => {
  it('produces signed params nested under the root folder', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    const ctx = make();
    const result = ctx.service.sign('deliverables');

    const expectedTs = Math.round(1_700_000_000_000 / 1000);
    expect(result).toEqual({
      timestamp: expectedTs,
      signature: 'signature-123',
      apiKey: 'ak',
      cloudName: 'demo',
      folder: 'capstone/deliverables',
    });
    expect(apiSignRequest).toHaveBeenCalledWith(
      { timestamp: expectedTs, folder: 'capstone/deliverables' },
      'secret',
    );
  });

  it('signs the exact folder the browser will send back', () => {
    const ctx = make();
    const result = ctx.service.sign('avatars');
    expect(result.folder).toBe('capstone/avatars');
    expect(apiSignRequest.mock.calls[0][0].folder).toBe('capstone/avatars');
  });
});
