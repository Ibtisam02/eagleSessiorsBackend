
import { google } from 'googleapis';

const GOOGLE_CLIENT_ID ="86406764343-g6hbgcgne1f6u7nbna9fpctpq5hv9s1d.apps.googleusercontent.com" //process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = "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" //process.env.GOOGLE_CLIENT_SECRET; 

export const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'postmessage'
);
