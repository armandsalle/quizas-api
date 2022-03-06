import type { VercelRequest, VercelResponse } from "@vercel/node"
import * as dotenv from "dotenv"
import nc from "next-connect"

import { addGoogleCalendarEvent } from "../lib/googleCalendar"
import { addBookingRequestToGoogleSheet } from "../lib/googleSheets"
import { sendMail } from "../lib/mail"
import { validateBookingRequest } from "../lib/validateBookingRequest"
import { allowHeadersMiddleware } from "../middlewares/allowHeaders"

dotenv.config({ path: "../.env" })

const handler = nc<VercelRequest, VercelResponse>()

handler.use((req, res, next) =>
  allowHeadersMiddleware(req, res, next, ["POST"])
)

handler.post(async (req, res) => {
  const { body } = req

  try {
    const { data, errors } = validateBookingRequest(body)

    if (errors) {
      throw errors
    }

    const { error: GSerror } = await addBookingRequestToGoogleSheet(data)

    await addGoogleCalendarEvent(
      data,
      `Demande - ${data.room} - ${data.name} ${data.lastname}`
    )

    if (GSerror) {
      throw GSerror
    }

    try {
      await sendMail(data)
    } catch (e) {
      res.status(500).json({ success: false, error: e })

      return
    }

    res.status(200).json({ success: true, data, error: null })
  } catch (e) {
    res.status(500).json({ success: false, error: e })
  }
})

export default handler
