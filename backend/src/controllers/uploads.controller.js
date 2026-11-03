const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { HttpError, asyncHandler, sendSuccess } = require('../lib/http');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads');
const MAX_BYTES = 5 * 1024 * 1024;

/** File signatures of the image formats we accept; the declared MIME type is not trusted. */
const SIGNATURES = [
  { ext: 'png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'webp', test: (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' },
];

/** Stores an image sent as a base64 data URL and returns its public `/uploads/...` path. */
const uploadImage = asyncHandler(async (req, res) => {
  const { dataUrl } = req.body || {};
  const match = typeof dataUrl === 'string' && dataUrl.match(/^data:image\/[a-z+]+;base64,(.+)$/);
  if (!match) throw new HttpError(400, 'Expected an image data URL');

  const buffer = Buffer.from(match[1], 'base64');
  if (buffer.length === 0) throw new HttpError(400, 'Image is empty');
  if (buffer.length > MAX_BYTES) throw new HttpError(413, 'Image must be 5MB or smaller');

  const format = SIGNATURES.find((signature) => signature.test(buffer));
  if (!format) throw new HttpError(415, 'Only PNG, JPEG, and WebP images are supported');

  const fileName = `${crypto.randomUUID()}.${format.ext}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, fileName), buffer);

  sendSuccess(res, { status: 201, data: { url: `/uploads/${fileName}` } });
});

module.exports = { uploadImage, UPLOAD_DIR };
