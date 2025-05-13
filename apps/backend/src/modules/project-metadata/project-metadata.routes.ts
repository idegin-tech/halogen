import { Router } from 'express';
import { ProjectMetadataController } from './project-metadata.controller';
import { RequestValidation } from '../../middleware/request.middleware';
import { AuthMiddleware } from '../auth/auth.middleware';
import { 
  createProjectMetadataSchema, 
  updateProjectMetadataSchema
} from './project-metadata.dtos';

const router = Router();

router.use(AuthMiddleware.requireAuth);

router.post('/', 
  RequestValidation.validateBody(createProjectMetadataSchema),
  ProjectMetadataController.createProjectMetadata
);

router.get('/:id', 
  ProjectMetadataController.getProjectMetadataById
);

router.get('/project/:projectId', 
  ProjectMetadataController.getProjectMetadataByProjectId
);

router.put('/:id', 
  RequestValidation.validateBody(updateProjectMetadataSchema),
  ProjectMetadataController.updateProjectMetadata
);

router.put('/project/:projectId', 
  RequestValidation.validateBody(updateProjectMetadataSchema),
  ProjectMetadataController.updateProjectMetadataByProjectId
);

router.delete('/:id', 
  ProjectMetadataController.deleteProjectMetadata
);

router.delete('/project/:projectId', 
  ProjectMetadataController.deleteProjectMetadataByProjectId
);

export default router;
