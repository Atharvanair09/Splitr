function parseEmailForTransaction(emailData) {
  const headers = emailData.payload.headers;
  const subject = headers.find(h => h.name === 'Subject')?.value || '';
  const from = headers.find(h => h.name === 'From')?.value || '';
  const snippet = emailData.snippet || '';

  const text = `${subject} ${snippet}`.toLowerCase();

  let type = null;
  if (/credited|credit|received|deposited/.test(text)) type = 'credit';
  else if (/debited|debit|payment|spent|charged|withdrawn/.test(text)) type = 'debit';

  if (!type) return null;

  const amountMatch = text.match(/(?:rs\.?|₹|\$|inr)\s?(\d+[\d,]*\.?\d*)/i);
  const amount = amountMatch ? amountMatch[1].replace(',', '') : 'Unknown';

  return {
    id: emailData.id,
    type,
    amount,
    subject,
    from,
    snippet,
    date: new Date(parseInt(emailData.internalDate)).toISOString(),
  };
}

module.exports = { parseEmailForTransaction };