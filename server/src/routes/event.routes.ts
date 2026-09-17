import { Router } from 'express';
import { EventController } from '../controllers/event.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { createEventSchema } from '../utils/validators/common.validators.js';

export const eventRouter = Router();

eventRouter.get('/', EventController.list);
eventRouter.post('/', requireAuth, validate(createEventSchema), EventController.create);
eventRouter.post('/:eventId/rsvp', requireAuth, EventController.rsvp);
eventRouter.delete('/:eventId/rsvp', requireAuth, EventController.cancelRsvp);
