import type { VercelRequest, VercelResponse } from "@vercel/node"
import * as dotenv from "dotenv"
import nc from "next-connect"

import getEvents from "../lib/events"
import { allowHeadersMiddleware } from "../middlewares/allowHeaders"

dotenv.config({ path: "../.env" })

const handler = nc<VercelRequest, VercelResponse>()

handler.use((req, res, next) => allowHeadersMiddleware(req, res, next, ["GET"]))

handler.get(async (_, res) => {
  try {
    const { events, error, getFromCatch } = await getEvents()

    if (error) {
      throw error
    }

    res.status(200).json({ success: true, events, getFromCatch })
  } catch (error) {
    res.status(500).json({ success: false, error })
  }
})

export default handler
