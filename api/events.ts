import type { VercelRequest, VercelResponse } from "@vercel/node"
import * as dotenv from "dotenv"
import nc from "next-connect"

import getEvents from "../lib/events"
import { validateDates } from "../lib/validateDates"
import { allowHeadersMiddleware } from "../middlewares/allowHeaders"

dotenv.config({ path: "../.env" })

const handler = nc<VercelRequest, VercelResponse>()

handler.use((req, res, next) =>
  allowHeadersMiddleware(req, res, next, ["GET", "POST"])
)

handler.get(async (_, res) => {
  try {
    const { events, error } = await getEvents()

    if (error) {
      throw error
    }

    res.status(200).json({ success: true, events })
  } catch (error) {
    res.status(500).json({ success: false, error })
  }
})

handler.post(async (req, res) => {
  const { body } = req

  try {
    const { data, errors } = validateDates(body)

    if (errors) {
      throw errors
    }

    const { events, error } = await getEvents(data)

    if (error) {
      throw error
    }

    res.status(200).json({ success: true, events })
  } catch (error) {
    res.status(500).json({ success: false, error })
  }
})

export default handler
