import { addYears, format } from "date-fns"
import { google } from "googleapis"
import type { calendar_v3 } from "googleapis"

import { auth, GOOGLE_ENV } from "./googleConnect"
import { formatDateString } from "./utils/format"
import { DataSchema } from "./validateBookingRequest"
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

export async function addGoogleCalendarEvent(data: DataSchema, title: string) {
  try {
    const resp = await calendar.events.insert({
      calendarId: GOOGLE_ENV.calendarId,
      auth,
      requestBody: {
        summary: title,
        start: {
          date: format(new Date(data.dates.arrival), "yyyy-MM-dd"),
          timeZone: "Europe/Paris",
        },
        end: {
          date: format(new Date(data.dates.departure), "yyyy-MM-dd"),
          timeZone: "Europe/Paris",
        },
        description: getHTMLDescription(data),
      },
    })

    if (resp.status === 200 && resp.statusText === "OK") {
      return
    }

    throw new Error("Cannot get events from Google Calendar")
  } catch (error) {
    throw error
  }
}

export function getHTMLDescription(data: DataSchema): string {
  return `
Nouvelle demande de réservation !

${data.name} aimerait venir du ${formatDateString(
    data.dates.arrival
  )} au ${formatDateString(data.dates.departure)}.

Il y aurait ${data.people} personne(s).

Cambre shouaitée: ${data.room}

Voici son message:
"${data.message}"

Vous pouvez contacter ${data.name} par mail <a href="mailto:${data.email}">${
    data.email
  }</a> ou par téléphone <a href="tel:${data.phone.split(" ").join("")}">${
    data.phone
  }</a>.

La demande a été ajouté au Google Sheet des demandes de réservations.
Vous pouvez y accéder <a href="https://docs.google.com/spreadsheets/d/1vsS4lzw2_f0Npn565KGvk3SU_RyVWMuCk7JBiWtjUmc/edit#gid=0">ici</a>`
}
