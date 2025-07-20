import { Router } from 'express';

import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { 
  CreatePropertySchema, 
  UpdatePropertySchema, 
  IdParamSchema,
  PropertyFilterSchema,
  PaginationSchema 
} from '../validators';
import { PropertyController } from '../controllers/PropertyController';

const router = Router();
const propertyController = new PropertyController();

/**
 * @swagger
 * /api/v1/properties:
 *   post:
 *     summary: Create a new property
 *     tags: [Properties]
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
 *                 enum: [string, number, boolean]
 *               description:
 *                 type: string
 *               validation_rules:
 *                 type: object
 *               create_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Property created successfully
 *       400:
 *         description: Bad request
 *       409:
 *         description: Property already exists
 */
router.post('/', validateBody(CreatePropertySchema), propertyController.createProperty);

/**
 * @swagger
 * /api/v1/properties:
 *   get:
 *     summary: Get all properties with optional filtering and pagination
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by property name
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [string, number, boolean]
 *         description: Filter by property type
 *       - in: query
 *         name: description
 *         schema:
 *           type: string
 *         description: Filter by property description
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
 *         description: List of properties
 */
router.get('/', 
  validateQuery(PropertyFilterSchema.merge(PaginationSchema)), 
  propertyController.getAllProperties
);

/**
 * @swagger
 * /api/v1/properties/search:
 *   get:
 *     summary: Search properties by name
 *     tags: [Properties]
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
router.get('/search', propertyController.searchProperties);

/**
 * @swagger
 * /api/v1/properties/{id}:
 *   get:
 *     summary: Get property by ID
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property details
 *       404:
 *         description: Property not found
 */
router.get('/:id', validateParams(IdParamSchema), propertyController.getPropertyById);

/**
 * @swagger
 * /api/v1/properties/{id}:
 *   put:
 *     summary: Update property by ID
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Property ID
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
 *                 enum: [string, number, boolean]
 *               description:
 *                 type: string
 *               validation_rules:
 *                 type: object
 *     responses:
 *       200:
 *         description: Property updated successfully
 *       404:
 *         description: Property not found
 *       409:
 *         description: Property name/type combination already exists
 */
router.put('/:id', 
  validateParams(IdParamSchema), 
  validateBody(UpdatePropertySchema), 
  propertyController.updateProperty
);

/**
 * @swagger
 * /api/v1/properties/{id}:
 *   delete:
 *     summary: Delete property by ID
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Property ID
 *     responses:
 *       204:
 *         description: Property deleted successfully
 *       404:
 *         description: Property not found
 */
router.delete('/:id', validateParams(IdParamSchema), propertyController.deleteProperty);

export default router; 