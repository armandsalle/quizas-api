import { google } from "googleapis"

export const GOOGLE_ENV = {
  clientEmail: process.env.CLIENT_EMAIL,
  privateKey: process.env.PRIVATE_KEY,
  calendarId: process.env.CALENDAR_ID,
  spreadsheetId: process.env.SPREADSHIT_ID,
  sheetName: process.env.SHEET_NAME,
}

const SCOPE = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/spreadsheets",
]

export const auth = new google.auth.JWT(
  GOOGLE_ENV.clientEmail,
  undefined,
  GOOGLE_ENV.privateKey,
  SCOPE
)
