const { google } = require('googleapis');
const { oauth2Client } = require('../routes/auth');
const { parseEmailForTransaction } = require('./emailParser');

async function fetchTransactionEmails() {
  if (global.userTokens) {
    oauth2Client.setCredentials(global.userTokens);
  } else {
    throw new Error("No tokens found. Please connect to Gmail first.");
  }
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const res = await gmail.users.messages.list({
    userId: 'me',
    q: '(credit OR debit OR transaction OR payment OR debited OR credited OR "InstaAlerts") after:2026/03/01',
    maxResults: 20,
  });

  const messages = res.data.messages || [];
  const transactions = [];

  for (const msg of messages) {
    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'full',
    });
    const parsed = parseEmailForTransaction(detail.data);
    if (parsed) transactions.push(parsed);
  }
  return transactions;
}

module.exports = { fetchTransactionEmails };