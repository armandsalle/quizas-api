import type { VercelRequest, VercelResponse } from "@vercel/node"
import nc from "next-connect"

import getEvents from "../lib/events"
import { allowHeadersMiddleware } from "../lib/middlewares"

const handler = nc<VercelRequest, VercelResponse>()

handler.use((req, res, next) => allowHeadersMiddleware(req, res, next, ["GET"]))

handler.get(async (_, res) => {
  const { events, error, getFromCatch } = await getEvents()
  if (error) {
    res.status(500).json({ status: 500, error })
  }

  res.status(200).json({ events, getFromCatch })
})

export default handler
