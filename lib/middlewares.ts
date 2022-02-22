import { VercelRequest, VercelResponse } from "@vercel/node"
import { NextHandler } from "next-connect"

type Method = "GET" | "POST" | "UPDATE" | "PATCH" | "DELETE"
type Methods = Method[]

export const allowHeadersMiddleware = (
  req: VercelRequest,
  res: VercelResponse,
  next: NextHandler,
  allowMethods: Methods = []
) => {
  const { method } = req

  if (method && allowMethods.includes(method as Method)) {
    next()

    return
  }

  res.setHeader("Allow", allowMethods)
  res.status(405).json({
    status: 405,
    message: `Method ${method} Not Allowed`,
  })
}
