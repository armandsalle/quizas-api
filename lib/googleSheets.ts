import { google } from "googleapis"

import { auth, GOOGLE_ENV } from "./googleConnect"
import { formatDateString, formatPrice } from "./utils/format"
import { DataSchema } from "./validateBookingRequest"

const sheets = google.sheets({ version: "v4" })

export async function addBookingRequestToGoogleSheet(
  data: DataSchema
): Promise<{
  error: Error | null
}> {
  try {
    const resp = await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId: GOOGLE_ENV.spreadsheetId,
      insertDataOption: "INSERT_ROWS",
      range: GOOGLE_ENV.sheetName,
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [
            "NON",
            data.name,
            data.lastname,
            data.email,
            data.phone,
            data.people,
            data.message,
            formatPrice(data.price),
            formatDateString(data.dates.arrival),
            formatDateString(data.dates.departure),
            data.room,
          ],
        ],
      },
    })

    if (resp.status === 200 && resp.statusText === "OK") {
      return { error: null }
    }

    throw new Error("Cannot adding the booking request")
  } catch (error) {
    if (error instanceof Error) {
      return { error }
    }

    return {
      error: new Error("Something went wrong while adding the booking request"),
    }
  }
}
