import { addYears } from "date-fns"
import { google } from "googleapis"
import type { calendar_v3 } from "googleapis"

import { auth, GOOGLE_ENV } from "./googleConnect"
import { DateSchema } from "./validateDates"

const calendar = google.calendar({ version: "v3" })

export async function getGoogleCalendarEvents(dates?: DateSchema): Promise<{
  events: calendar_v3.Schema$Event[]
  error: Error | null
}> {
  try {
    // Get events from now to 1 year after
    const resp = await calendar.events.list({
      calendarId: GOOGLE_ENV.calendarId,
      auth,
      timeMin: dates?.from
        ? new Date(dates.from).toISOString()
        : new Date().toISOString(),
      timeMax: dates?.to
        ? new Date(dates.to).toISOString()
        : addYears(new Date(), 1).toISOString(),
    })

    if (resp.status === 200 && resp.statusText === "OK") {
      const events = resp.data.items

      if (!events && !Array.isArray(events)) {
        throw new Error("No events found")
      }

      return { events, error: null }
    }

    throw new Error("Cannot get events from Google Calendar")
  } catch (error) {
    if (error instanceof Error) {
      return { events: [], error }
    }

    return {
      events: [],
      error: new Error("Something went wrong while fetching events"),
    }
  }
}
