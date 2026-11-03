// Telegram notifications through the login bot. Users who signed in with Telegram allowed the bot
// to message them (the widget asks for `request_access=write`). Failures are logged, never thrown.

const env = require('../config/env');

function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sendTelegram(chatId, html, fetchImpl = fetch) {
  if (!env.telegram.botToken || !chatId) return false;
  try {
    const response = await fetchImpl(`https://api.telegram.org/bot${env.telegram.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    if (!response.ok) console.warn(`Telegram notify to ${chatId} failed: ${response.status}`);
    return response.ok;
  } catch (error) {
    console.warn('Telegram notify failed:', error.message);
    return false;
  }
}

function orderLink(orderId) {
  return `${env.frontendUrls[0]}/account?tab=orders#${orderId}`;
}

module.exports = { sendTelegram, escapeHtml, orderLink };
