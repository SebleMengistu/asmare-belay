'use strict'

const config = require('../config')

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function clip(value, max = 3000) {
  const text = String(value ?? '')
  return text.length > max ? `${text.slice(0, max - 3)}...` : text
}

function contactMessageText(message) {
  return [
    '<b>New portfolio message</b>',
    '',
    `<b>${escapeHtml(message.name || 'Anonymous')}</b>${message.email ? ` (${escapeHtml(message.email)})` : ''}`,
    `<b>Subject:</b> ${escapeHtml(message.subject || 'General inquiry')}`,
    '',
    escapeHtml(clip(message.message)),
  ].join('\n')
}

function feedbackText(feedback) {
  return [
    '<b>New portfolio feedback</b>',
    '',
    feedback.name ? `<b>${escapeHtml(feedback.name)}</b>` : '<b>Anonymous</b>',
    feedback.email ? `<b>Email:</b> ${escapeHtml(feedback.email)}` : '',
    feedback.category ? `<b>Category:</b> ${escapeHtml(feedback.category)}` : '',
    feedback.rating ? `<b>Rating:</b> ${escapeHtml(feedback.rating)}/5` : '',
    '',
    escapeHtml(clip(feedback.message)),
  ].filter(Boolean).join('\n')
}

async function sendTelegramMessage(text) {
  if (!config.telegramEnabled || !config.telegramBotToken || !config.telegramChatId) {
    console.warn('[telegram] notification skipped: Telegram is not fully configured')
    return { sent: false, reason: 'not_configured' }
  }

  const response = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: config.telegramChatId,
      text,
      parse_mode: 'HTML',
    }),
    signal: AbortSignal.timeout(10000),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.ok) {
    throw new Error(`Telegram returned ${response.status}: ${payload?.description || 'Unknown error'}`)
  }
  return { sent: true }
}

module.exports = { contactMessageText, feedbackText, sendTelegramMessage }
