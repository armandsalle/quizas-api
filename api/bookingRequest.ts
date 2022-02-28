import type { VercelRequest, VercelResponse } from "@vercel/node"
import * as dotenv from "dotenv"
import nc from "next-connect"

import { addBookingRequestToGoogleSheet } from "../lib/googleSheets"
import { getHTMLMail, sendMail } from "../lib/mail"
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

    if (GSerror) {
      throw GSerror
    }

    try {
      await sendMail(getHTMLMail(data))
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
