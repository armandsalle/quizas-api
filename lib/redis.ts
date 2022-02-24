import { createClient } from "redis"

import { Events } from "../types/types"

const client = createClient({
  url: process.env.REDIS_URL,
})

export async function connect() {
  try {
    await client.connect()

    return client
  } catch (error) {
    return null
  }
}

type RedisClient = typeof client | null

export async function getCachedEvents(
  redisClient: RedisClient
): Promise<Events | null> {
  if (redisClient === null) return null

  const events = await redisClient.get("events")

  if (!events) return null

  return JSON.parse(events) as Events
}

// time to leave in seconds
const TTL = 15 * 60

export async function setCachedEvents(
  redisClient: RedisClient,
  events: Events
) {
  if (redisClient === null) return null

  await redisClient.set("events", JSON.stringify(events), {
    EX: TTL,
  })
}

// export async function clearCache(redisClient: RedisClient) {
//   if (redisClient === null) return null

//   try {
//     await redisClient.del("events")
//   } catch (error) {
//     console.log(error)
//   }
// }
