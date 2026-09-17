import { EventService } from '../services/event.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class EventController {
  static list = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const groupId = typeof req.query.groupId === 'string' ? req.query.groupId : undefined;
    const events = await EventService.listUpcoming(groupId, req.user?.userId);
    res.json({ events });
  });

  static create = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { groupId, title, description, location, startTime, endTime, capacity } = req.body;
    const event = await EventService.create(groupId, req.user!.userId, {
      title,
      description,
      location,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      capacity,
    });
    res.status(201).json({ event });
  });

  static rsvp = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const event = await EventService.rsvp(req.params.eventId!, req.user!.userId);
    res.status(201).json({ event });
  });

  static cancelRsvp = asyncHandler(async (req: AuthenticatedRequest, res) => {
    await EventService.cancelRsvp(req.params.eventId!, req.user!.userId);
    res.status(204).send();
  });
}
