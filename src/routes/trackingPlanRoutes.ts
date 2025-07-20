import { Router } from 'express';
import { TrackingPlanController } from '../controllers/TrackingPlanController';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { 
  CreateTrackingPlanSchema, 
  UpdateTrackingPlanSchema, 
  IdParamSchema,
  TrackingPlanFilterSchema,
  PaginationSchema 
} from '../validators';

const router = Router();
const trackingPlanController = new TrackingPlanController();

/**
 * @swagger
 * /api/v1/tracking-plans:
 *   post:
 *     summary: Create a new tracking plan
 *     tags: [Tracking Plans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               events:
 *                 type: array
 *                 items:
 *                   type: object
 *               create_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Tracking plan created successfully
 *       400:
 *         description: Bad request
 *       409:
 *         description: Tracking plan already exists
 */
router.post('/', validateBody(CreateTrackingPlanSchema), trackingPlanController.createTrackingPlan);

/**
 * @swagger
 * /api/v1/tracking-plans:
 *   get:
 *     summary: Get all tracking plans with optional filtering and pagination
 *     tags: [Tracking Plans]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by tracking plan name
 *       - in: query
 *         name: description
 *         schema:
 *           type: string
 *         description: Filter by tracking plan description
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
 *         description: List of tracking plans
 */
router.get('/', 
  validateQuery(TrackingPlanFilterSchema.merge(PaginationSchema)), 
  trackingPlanController.getAllTrackingPlans
);

/**
 * @swagger
 * /api/v1/tracking-plans/{id}:
 *   get:
 *     summary: Get tracking plan by ID
 *     tags: [Tracking Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tracking plan ID
 *     responses:
 *       200:
 *         description: Tracking plan details
 *       404:
 *         description: Tracking plan not found
 */
router.get('/:id', validateParams(IdParamSchema), trackingPlanController.getTrackingPlanById);

/**
 * @swagger
 * /api/v1/tracking-plans/{id}:
 *   put:
 *     summary: Update tracking plan by ID
 *     tags: [Tracking Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tracking plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               events:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Tracking plan updated successfully
 *       404:
 *         description: Tracking plan not found
 *       409:
 *         description: Tracking plan name already exists
 */
router.put('/:id', 
  validateParams(IdParamSchema), 
  validateBody(UpdateTrackingPlanSchema), 
  trackingPlanController.updateTrackingPlan
);

/**
 * @swagger
 * /api/v1/tracking-plans/{id}:
 *   delete:
 *     summary: Delete tracking plan by ID
 *     tags: [Tracking Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tracking plan ID
 *     responses:
 *       204:
 *         description: Tracking plan deleted successfully
 *       404:
 *         description: Tracking plan not found
 */
router.delete('/:id', validateParams(IdParamSchema), trackingPlanController.deleteTrackingPlan);

export default router; 