import { Router } from 'express';
import { SchemaController } from './schema.controller';
import { RequestValidation } from '../../../../middleware/request.middleware';
import { AuthMiddleware } from '../../../auth/auth.middleware';
import { createSchemaSchema, updateSchemaSchema, schemaQuerySchema } from './schema.dtos';

const router = Router();

// Apply authentication middleware to all routes
router.use(AuthMiddleware.requireAuth);

// Create a new schema for a collection
router.post(
  '/:projectId/:collectionId',
  AuthMiddleware.requireProjectAccess,
  RequestValidation.validateBody(createSchemaSchema),
  SchemaController.createSchema
);

// Get schema by collection ID
router.get(
  '/:projectId/collection/:collectionId',
  AuthMiddleware.requireProjectAccess,
  SchemaController.getSchemaByCollectionId
);

// Update a schema
router.put(
  '/:projectId/:schemaId',
  AuthMiddleware.requireProjectAccess,
  RequestValidation.validateBody(updateSchemaSchema),
  SchemaController.updateSchema
);

export default router;
