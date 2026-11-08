// The CHTH banner across the top of the shop, set from the hub's 📢 Banners.
//   POST /api/internal/announcement  { text, url? }  signed by the hub; empty text clears it
//   GET  /api/announcement           { announcement: { text, url } | null }  for the site
const prisma = require('../lib/prisma');
const { parseAnnouncement } = require('../lib/announcement');

const KEY = 'banner';

async function set(req, res, next) {
  try {
    const parsed = parseAnnouncement(req.hubBody);
    if (!parsed.ok) return res.status(400).json({ ok: false, error: parsed.error });
    if (parsed.announcement) {
      const value = JSON.stringify(parsed.announcement);
      await prisma.siteSetting.upsert({ where: { key: KEY }, create: { key: KEY, value }, update: { value } });
    } else {
      await prisma.siteSetting.deleteMany({ where: { key: KEY } });
    }
    res.json({ ok: true, announcement: parsed.announcement });
  } catch (error) {
    next(error);
  }
}

async function get(req, res) {
  let announcement = null;
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: KEY } });
    announcement = row ? JSON.parse(row.value) : null;
  } catch {
    // No banner is better than a broken page.
  }
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ announcement });
}

module.exports = { set, get };
