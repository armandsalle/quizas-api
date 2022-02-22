import { isBefore, addMinutes } from "date-fns"
import fs from "fs/promises"
import path from "path"

import type { Events } from "../types/event"

type CacheJSON = { events: Events; last_update: Date | null }

const cachePath = path.join(__dirname, "../cache/events.json")
const VALID_CACHE_MINUTES = 15

export async function getCachedEvents(): Promise<{
  cachedEvents: Events | null
  error: Error | null
}> {
  try {
    const rawCache = await fs.readFile(cachePath)
    const cacedEvents: CacheJSON = JSON.parse(rawCache.toString())

    if (!cacedEvents.last_update) {
      throw new Error("Empty cache")
    }

    // Check if the cached is less than 15 minutes
    const isValidCachedTime = isBefore(
      new Date(),
      addMinutes(new Date(cacedEvents.last_update), VALID_CACHE_MINUTES)
    )

    if (!isValidCachedTime) {
      throw new Error("Invalid cache")
    }

    return { cachedEvents: cacedEvents.events, error: null }
  } catch (error) {
    if (error instanceof Error) {
      return { cachedEvents: [], error }
    }

    return {
      cachedEvents: [],
      error: new Error(
        "Something went wrong while accessing the cached events"
      ),
    }
  }
}

export async function cacheEvents(events: Events): Promise<Error | null> {
  try {
    const cache: CacheJSON = {
      events,
      last_update: new Date(),
    }

    await fs.writeFile(cachePath, JSON.stringify(cache))

    return null
  } catch (error) {
    if (error instanceof Error) {
      return error
    }

    return new Error("Something went wrong while writing the cach")
  }
}
