// Validation for the buyer-chosen options on a cart line and the 3D designs stored on products.

const crypto = require('crypto');
const { HttpError } = require('./http');

const MAX_DESIGN_BYTES = 64 * 1024;
const MAX_LAYERS = 20;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** Images inside designs must be uploaded first; inline data URLs would bloat every row. */
function isAllowedImageUrl(value) {
  return typeof value === 'string' && (value.startsWith('/uploads/') || /^https:\/\//.test(value));
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function vec3(value) {
  if (!Array.isArray(value) || value.length !== 3 || !value.every((n) => Number.isFinite(Number(n)))) {
    throw new HttpError(400, 'Invalid design layer transform');
  }
  return value.map(Number);
}

/**
 * Normalizes a 3D studio design: `{ color, logoUrl?, layers: [...] }`.
 * Returns null when no design was given.
 */
function normalizeDesign(design) {
  if (design === undefined || design === null) return null;
  if (typeof design !== 'object' || Array.isArray(design)) throw new HttpError(400, 'Invalid design');

  const layers = Array.isArray(design.layers) ? design.layers : [];
  if (layers.length > MAX_LAYERS) throw new HttpError(400, `A design can have at most ${MAX_LAYERS} layers`);

  const normalized = {
    color: HEX_COLOR.test(design.color) ? design.color : null,
    logoUrl: null,
    layers: layers.map((layer) => {
      if (!layer || (layer.type !== 'image' && layer.type !== 'text')) {
        throw new HttpError(400, 'Invalid design layer');
      }
      if (layer.type === 'image' && !isAllowedImageUrl(layer.imageUrl)) {
        throw new HttpError(400, 'Design images must be uploaded before saving');
      }
      return {
        id: String(layer.id || crypto.randomUUID()).slice(0, 64),
        type: layer.type,
        content: String(layer.content || '').slice(0, 120),
        ...(layer.type === 'image' && { imageUrl: layer.imageUrl }),
        position: vec3(layer.position),
        rotation: Number(layer.rotation) || 0,
        scale: vec3(layer.scale),
        ...(HEX_COLOR.test(layer.color) && { color: layer.color }),
        ...(Number.isFinite(Number(layer.fontSize)) && { fontSize: Number(layer.fontSize) }),
      };
    }),
  };

  if (design.logoUrl) {
    if (!isAllowedImageUrl(design.logoUrl)) throw new HttpError(400, 'Design images must be uploaded before saving');
    normalized.logoUrl = design.logoUrl;
  }

  if (Buffer.byteLength(JSON.stringify(normalized)) > MAX_DESIGN_BYTES) {
    throw new HttpError(400, 'Design is too large');
  }
  return normalized;
}

/**
 * Validates the options a buyer picked for a cart line.
 * `allowed` holds the sizes and colors on offer and whether personalization is allowed.
 */
function normalizeOptions(options, { sizes, colors, customizable }) {
  const input = options && typeof options === 'object' ? options : {};
  const result = {};

  if (sizes.length > 0) {
    const size = input.size ?? (sizes.length === 1 ? sizes[0] : undefined);
    if (!sizes.includes(size)) throw new HttpError(400, `Please choose a size: ${sizes.join(', ')}`);
    result.size = size;
  }

  if (input.color !== undefined && input.color !== null) {
    const color = String(input.color).toUpperCase();
    if (colors.length > 0 && !colors.map((c) => c.toUpperCase()).includes(color)) {
      throw new HttpError(400, 'That color is not available for this product');
    }
    if (!HEX_COLOR.test(color)) throw new HttpError(400, 'Invalid color');
    result.color = color;
  }

  if (input.design) {
    if (!customizable) throw new HttpError(400, 'This product cannot be personalized');
    result.design = normalizeDesign(input.design);
  }

  if (input.previewUrl) {
    if (!isAllowedImageUrl(input.previewUrl)) throw new HttpError(400, 'Invalid preview image');
    result.previewUrl = input.previewUrl;
  }

  return result;
}

/** Key that makes identical configurations of the same product stack in the cart. */
function optionsKey(options) {
  return crypto.createHash('sha1').update(stableStringify(options)).digest('hex');
}

module.exports = { normalizeDesign, normalizeOptions, optionsKey, stableStringify, isAllowedImageUrl };
