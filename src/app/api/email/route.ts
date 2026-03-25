import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Reads Gmail via Jarvis's existing OAuth setup
export async function GET(req: NextRequest) {
  try {
    const count = req.nextUrl.searchParams.get('count') || '5';

    const script = `
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const credsPath = path.join('C:\\\\Users\\\\lovoa\\\\.openclaw\\\\workspace', 'google-credentials.json');
const tokenPath = path.join('C:\\\\Users\\\\lovoa\\\\.openclaw\\\\workspace', 'google-token.json');

const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

const { client_id, client_secret } = creds.installed || creds.web || creds;
const oauth2 = new google.auth.OAuth2(client_id, client_secret);
oauth2.setCredentials(token);

const gmail = google.gmail({ version: 'v1', auth: oauth2 });

gmail.users.messages.list({
  userId: 'me',
  maxResults: ${count},
  labelIds: ['INBOX'],
  q: 'is:unread',
}, async (err, res) => {
  if (err) { console.log(JSON.stringify({ error: err.message })); return; }
  
  const messages = res.data.messages || [];
  const emails = [];
  
  for (const msg of messages.slice(0, ${count})) {
    try {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      });
      const headers = detail.data.payload?.headers || [];
      emails.push({
        id: msg.id,
        from: headers.find(h => h.name === 'From')?.value || '',
        subject: headers.find(h => h.name === 'Subject')?.value || '',
        date: headers.find(h => h.name === 'Date')?.value || '',
        snippet: detail.data.snippet || '',
      });
    } catch (e) {}
  }
  
  console.log(JSON.stringify({ emails, unreadCount: messages.length }));
});
`;
    const tmpFile = `${process.env.TEMP || 'C:\\Windows\\Temp'}\\synapse-gmail.js`;
    const { writeFileSync } = require('fs');
    writeFileSync(tmpFile, script);

    const { stdout } = await execAsync(`node "${tmpFile}"`, {
      timeout: 15000,
      env: { ...process.env },
    });

    const data = JSON.parse(stdout.trim());
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg, emails: [] }, { status: 500 });
  }
}
