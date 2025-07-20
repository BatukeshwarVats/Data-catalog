import { Router } from 'express';
import { EventController } from '../controllers/EventController';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { 
  CreateEventSchema, 
  UpdateEventSchema, 
  IdParamSchema,
  EventFilterSchema,
  PaginationSchema 
} from '../validators';

const router = Router();
const eventController = new EventController();

/**
 * @swagger
 * /api/v1/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [track, identify, alias, screen, page]
 *               description:
 *                 type: string
 *               create_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Bad request
 *       409:
 *         description: Event already exists
 */
router.post('/', validateBody(CreateEventSchema), eventController.createEvent);

/**
 * @swagger
 * /api/v1/events:
 *   get:
 *     summary: Get all events with optional filtering and pagination
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by event name
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [track, identify, alias, screen, page]
 *         description: Filter by event type
 *       - in: query
 *         name: description
 *         schema:
 *           type: string
 *         description: Filter by event description
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of events
 */
router.get('/', 
  validateQuery(EventFilterSchema.merge(PaginationSchema)), 
  eventController.getAllEvents
);

/**
 * @swagger
 * /api/v1/events/search:
 *   get:
 *     summary: Search events by name
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Search query required
 */
router.get('/search', eventController.searchEvents);

/**
 * @swagger
 * /api/v1/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 */
router.get('/:id', validateParams(IdParamSchema), eventController.getEventById);

/**
 * @swagger
 * /api/v1/events/{id}:
 *   put:
 *     summary: Update event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [track, identify, alias, screen, page]
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       404:
 *         description: Event not found
 *       409:
 *         description: Event name/type combination already exists
 */
router.put('/:id', 
  validateParams(IdParamSchema), 
  validateBody(UpdateEventSchema), 
  eventController.updateEvent
);

/**
 * @swagger
 * /api/v1/events/{id}:
 *   delete:
 *     summary: Delete event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *     responses:
 *       204:
 *         description: Event deleted successfully
 *       404:
 *         description: Event not found
 */
router.delete('/:id', validateParams(IdParamSchema), eventController.deleteEvent);

export default router; 