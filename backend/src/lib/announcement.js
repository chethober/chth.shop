// The CHTH banner's text and link, checked.

/** The same rules as the CHTH kit's parseAnnouncement(): up to 200 characters, an https:// link. */
function parseAnnouncement(body) {
  const text = String(body?.text ?? '').trim();
  const url = String(body?.url ?? '').trim();
  if (!text) return { ok: true, announcement: null };
  if (text.length > 200) return { ok: false, error: 'The banner can be up to 200 characters.' };
  if (url && !/^https:\/\/[^\s"'<>]+$/.test(url)) return { ok: false, error: 'The link must start with https://' };
  return { ok: true, announcement: { text, url: url || null } };
}

module.exports = { parseAnnouncement };
