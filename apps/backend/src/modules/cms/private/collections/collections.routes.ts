import { Router } from 'express';
import { CollectionsController } from './collections.controller';
import { RequestValidation } from '../../../../middleware/request.middleware';
import { AuthMiddleware } from '../../../auth/auth.middleware';
import { createCollectionSchema, updateCollectionSchema, collectionQuerySchema } from './collections.dtos';

const router = Router();

// Apply authentication middleware to all routes
router.use(AuthMiddleware.requireAuth);

// Create a new collection
router.post(
  '/:projectId',
  AuthMiddleware.requireProjectAccess,
  RequestValidation.validateBody(createCollectionSchema),
  CollectionsController.createCollection
);

// Get all collections for a project
router.get(
  '/:projectId',
  AuthMiddleware.requireProjectAccess,
  RequestValidation.validateQuery(collectionQuerySchema),
  CollectionsController.getProjectCollections
);

// Update a collection
router.put(
  '/:projectId/:collectionId',
  AuthMiddleware.requireProjectAccess,
  RequestValidation.validateBody(updateCollectionSchema),
  CollectionsController.updateCollection
);

export default router;
