import { isBefore, isAfter, addDays, startOfToday } from "date-fns"
import { z, ZodError } from "zod"

/*
{
  "from": "2022-03-01T09:41:19.804Z", // date.toISOString()
  "to": "2022-03-01T09:41:19.804Z", // date.toISOString()
}
*/

const preprocessDate = z.preprocess((arg) => {
  if (typeof arg === "string" || arg instanceof Date) return new Date(arg)
}, z.date())

const Schema = z
  .object({
    from: preprocessDate,
    to: preprocessDate,
  })
  .refine(
    (data) => {
      return isBefore(startOfToday(), new Date(data.from))
    },
    {
      message: "Arrival date can not be before today",
      path: ["arrival"],
    }
  )
  .refine(
    (data) => {
      return isAfter(new Date(data.to), addDays(new Date(), 1))
    },
    {
      message:
        "Departure date should be 2 days after the arrival date, minimum",
      path: ["departure"],
    }
  )

export type DateSchema = z.infer<typeof Schema>

export function validateDates(rawData: string):
  | {
      errors: z.inferFlattenedErrors<typeof Schema>
      data: null
    }
  | {
      errors: null
      data: DateSchema
    } {
  try {
    const parsedData: unknown = JSON.parse(rawData)
    const data = Schema.parse(parsedData)

    return { data, errors: null }
  } catch (e) {
    if (e instanceof ZodError) {
      return { data: null, errors: e.flatten() }
    }

    throw e
  }
}
