import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Reads Google Calendar via Jarvis's existing gcal.js setup
export async function GET() {
  try {
    // Use the existing google-token.json and gcal setup from Jarvis workspace
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

const calendar = google.calendar({ version: 'v3', auth: oauth2 });

const now = new Date();
const tomorrow = new Date(now);
tomorrow.setDate(tomorrow.getDate() + 2);

calendar.events.list({
  calendarId: 'primary',
  timeMin: now.toISOString(),
  timeMax: tomorrow.toISOString(),
  singleEvents: true,
  orderBy: 'startTime',
  maxResults: 10,
}, (err, res) => {
  if (err) { console.log(JSON.stringify({ error: err.message })); return; }
  const events = (res.data.items || []).map(e => ({
    summary: e.summary,
    start: e.start?.dateTime || e.start?.date,
    end: e.end?.dateTime || e.end?.date,
    location: e.location || null,
  }));
  console.log(JSON.stringify({ events }));
});
`;
    const tmpFile = `${process.env.TEMP || 'C:\\Windows\\Temp'}\\synapse-gcal.js`;
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
    return NextResponse.json({ error: msg, events: [] }, { status: 500 });
  }
}
