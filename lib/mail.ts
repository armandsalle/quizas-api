import { google } from "googleapis"
import nodemailer from "nodemailer"

import { formatDateString } from "./utils/format"
import { DataSchema } from "./validateBookingRequest"

const ENV = {
  clientId: process.env.MAIL_CLIENT_ID,
  clientSecret: process.env.MAIL_CLIENT_SECRET,
  refreshToken: process.env.MAIL_REFRESH_TOKEN,
  userMail: process.env.MAIL_USER,
}

const auth = new google.auth.OAuth2(ENV.clientId, ENV.clientSecret)
auth.setCredentials({ refresh_token: ENV.refreshToken })

export async function sendMail(mailContent: string) {
  try {
    const accessToken = await auth.getAccessToken()
    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        type: "OAuth2",
        user: ENV.userMail,
        clientId: ENV.clientId,
        clientSecret: ENV.clientSecret,
        refreshToken: ENV.refreshToken,
        accessToken: accessToken.token || "",
      },
    })

    await transport.sendMail({
      to: "armand.salle@gmail.com",
      from: ENV.userMail,
      subject: "QUIZAS - Nouvelle demande de réservations",
      html: `
        <html>
            ${mailContent}
        </html>
      `,
    })

    transport.close()
  } catch (error) {
    throw error
  }
}

export function getHTMLMail(data: DataSchema): string {
  return `
    Nouvelle demande de réservation !
    <br />
    <br />
    ${data.name} aimerait venir du ${formatDateString(
    data.dates.arrival
  )} au ${formatDateString(data.dates.departure)}.<br />
    Il y aurait ${data.people} personne(s).
    <br />
    <br />
    Cambre(s) shouaitée(s):<br />
    ${data.rooms.map((r) => `- ${r}`).join("<br />")}
    <br />
    <br />
    Voici son message:<br />
    "${data.message}"
    <br />
    <br />
    Vous pouvez contacter ${data.name} par mail <a href="mailto:${
    data.email
  }">${data.email}</a> ou par téléphone <a href="tel:${data.phone
    .split(" ")
    .join("")}">${data.phone}</a>.
      <br />
      <br />
      La demande a été ajouté au Google Sheet des demandes de réservations.
      <br />
      Vous pouvez y accéder <a href="https://docs.google.com/spreadsheets/d/1vsS4lzw2_f0Npn565KGvk3SU_RyVWMuCk7JBiWtjUmc/edit#gid=0">ici</a>
    `
}
