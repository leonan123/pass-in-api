import {
  BadRequest
} from "./chunk-JRO4E4TH.mjs";
import {
  prisma
} from "./chunk-JV6GRE7Y.mjs";

// src/routes/register-for-event.ts
import { z } from "zod";
async function registerForEvent(app) {
  app.withTypeProvider().post(
    "/events/:eventId/attendees",
    {
      schema: {
        summary: "Register an attendee",
        tags: ["attendees"],
        body: z.object({
          name: z.string().min(4),
          email: z.string().email()
        }),
        params: z.object({
          eventId: z.string().uuid()
        }),
        response: {
          201: z.object({
            attendeeId: z.number()
          })
        }
      }
    },
    async (request, reply) => {
      const { eventId } = request.params;
      const { name, email } = request.body;
      const attendeeFromEmail = await prisma.attendee.findUnique({
        where: {
          eventId_email: {
            eventId,
            email
          }
        }
      });
      if (attendeeFromEmail) {
        throw new BadRequest("This email is already registered for this event.");
      }
      const [amountOfAttendeesForEvent, event] = await Promise.all([
        prisma.attendee.count({
          where: {
            eventId
          }
        }),
        prisma.event.findUnique({
          where: {
            id: eventId
          }
        })
      ]);
      if (event?.maximumAttendees && amountOfAttendeesForEvent >= event?.maximumAttendees) {
        throw new BadRequest(
          "the maximum number of attendees for this event has been reached"
        );
      }
      const attendee = await prisma.attendee.create({
        data: {
          name,
          email,
          eventId
        }
      });
      return reply.status(201).send({ attendeeId: attendee.id });
    }
  );
}

export {
  registerForEvent
};
