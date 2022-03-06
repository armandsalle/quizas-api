import axios from "axios"

import { formatDateString } from "./utils/format"
import { DataSchema } from "./validateBookingRequest"

const EMAILJS_ENV = {
  user_id: process.env.USER_ID,
  service_id: process.env.SERVICE_ID,
  template_id: process.env.TEMPLATE_ID,
  accessToken: process.env.ACCESS_TOKEN,
}

export async function sendMail(data: DataSchema) {
  try {
    await axios.post(
      "https://api.emailjs.com/api/v1.0/email/send",
      JSON.stringify({
        user_id: EMAILJS_ENV.user_id,
        service_id: EMAILJS_ENV.service_id,
        template_id: EMAILJS_ENV.template_id,
        accessToken: EMAILJS_ENV.accessToken,
        template_params: {
          name: data.name,
          lastname: data.lastname,
          room: data.room,
          arrival: formatDateString(data.dates.arrival),
          departure: formatDateString(data.dates.departure),
          mail: data.email,
          phone: data.phone,
          people: data.people,
          message: data.message,
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    )
  } catch (error) {
    throw error
  }
}
