import { isBefore, isAfter, addDays, startOfToday } from "date-fns"
import { z, ZodError } from "zod"

/*
{
  "name": "Armand",
  "lastname": "Sallé",
  "email": "armand.salle@gmail.com",
  "phone": "0606060606",
  "people": 3,
  "room": "LADY CHATTERLEY" | "HENRY DE MONFREID" | "NAPOLÉON",
  "message": "test",
  "price": 282.9,
  "dates": {
    "arrival": "2022-02-24T13:39:36.956Z", // date.toISOString()
    "departure": "2022-02-26T13:39:36.956Z" // date.toISOString()
  }
}
*/

const preprocessDate = z.preprocess((arg) => {
  if (typeof arg === "string" || arg instanceof Date) return new Date(arg)
}, z.date())

const DatesSchema = z
  .object({
    arrival: preprocessDate,
    departure: preprocessDate,
  })
  .refine(
    (data) => {
      return isBefore(startOfToday(), new Date(data.arrival))
    },
    {
      message: "Arrival date can not be before today",
      path: ["arrival"],
    }
  )
  .refine(
    (data) => {
      return isAfter(new Date(data.departure), addDays(new Date(), 1))
    },
    {
      message:
        "Departure date should be 2 days after the arrival date, minimum",
      path: ["departure"],
    }
  )

const PhoneSchema = z
  .string()
  .nonempty()
  .refine(
    (data) => data.match(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/gim),
    {
      message: "Invalid phone number",
      path: ["phone"],
    }
  )

const Schema = z.object({
  name: z.string().nonempty(),
  lastname: z.string().nonempty(),
  email: z.string().email().nonempty(),
  phone: PhoneSchema,
  people: z
    .number()
    .positive()
    .min(1)
    .or(
      z
        .string()
        .nonempty()
        .refine((data) => Number(data), {
          message: "People should be a number",
          path: ["people"],
        })
    ),
  message: z.string().nonempty(),
  price: z.number().positive(),
  room: z.enum(["LADY CHATTERLEY", "HENRY DE MONFREID", "NAPOLÉON"]),
  dates: DatesSchema,
})

export type DataSchema = z.infer<typeof Schema>

export function validateBookingRequest(rawData: string | object):
  | {
      errors: z.inferFlattenedErrors<typeof Schema>
      data: null
    }
  | {
      errors: null
      data: DataSchema
    } {
  try {
    const parsedData: unknown =
      typeof rawData === "string" ? JSON.parse(rawData) : rawData
    const data = Schema.parse(parsedData)

    return { data, errors: null }
  } catch (e) {
    if (e instanceof ZodError) {
      return { data: null, errors: e.flatten() }
    }

    throw e
  }
}
