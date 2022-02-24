import type { calendar_v3 } from "googleapis"

import type { Events, _Bedroom, _Event, _EventType } from "../types/types"
import { getGoogleCalendarEvents } from "./googleCalendar"
import { connect, getCachedEvents, setCachedEvents } from "./redis"

// [RESA] for a booked room, [OFF] for everything else
function getEventType(eventTitle: string): _EventType | null {
  return eventTitle.includes("[RESA]")
    ? "RESA"
    : eventTitle.includes("[OFF]")
    ? "OFF"
    : null
}

function getBedroom(type: _EventType, title: string): _Bedroom | null {
  let bedroom: _Bedroom | null = null

  if (type === "RESA") {
    // Get the rest of the event title
    const eventBedroom = title.split("[RESA] - ")[1]

    switch (eventBedroom) {
      case "LC":
        bedroom = "LADY CHATTERLEY"
        break
      case "HM":
        bedroom = "HENRY DE MONFREID"
        break
      case "NP":
        bedroom = "NAPOLÉON"
        break
      default:
        bedroom = null
        break
    }
  }

  return bedroom
}

function getFilteredEvents(events: calendar_v3.Schema$Event[]): Events {
  return events.reduce((prev, curr) => {
    // Check if events from GCal have a title and dates, and check if the title contains
    // a reference to a specific "code" to know what it is
    if (!curr.summary || !curr.start?.date || !curr.end?.date) return prev

    const type = getEventType(curr.summary)

    if (!type) return prev

    const newEvent: _Event = {
      start: curr.start.date,
      end: curr.end.date,
      description: curr.description,
      summary: curr.summary,
      type,
      bedroom: getBedroom(type, curr.summary),
    }

    return [...prev, newEvent]
  }, [] as Events)
}

export default async function getEvents(): Promise<{
  events: Events
  error: Error | null
  getFromCatch: boolean
}> {
  // Defer close connection to try{}catch{}finaly{}
  const redisClient = await connect()

  try {
    const cachedEvents = await getCachedEvents(redisClient)

    // No cache or error with the cache -> refetch and filter
    if (!cachedEvents) {
      const { events, error } = await getGoogleCalendarEvents()

      if (error) {
        return { events: [], error, getFromCatch: false }
      }

      const eventCollection = getFilteredEvents(events)
      await setCachedEvents(redisClient, eventCollection)

      return { events: eventCollection, error: null, getFromCatch: false }
    }

    return { events: cachedEvents, error: null, getFromCatch: true }
  } catch (error) {
    if (error instanceof Error) {
      return { events: [], error, getFromCatch: false }
    }

    return {
      events: [],
      error: new Error("Something went wrong while filtering events"),
      getFromCatch: false,
    }
  } finally {
    redisClient?.quit()
  }
}
