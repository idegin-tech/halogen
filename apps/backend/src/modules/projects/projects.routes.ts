import { Router } from 'express';
import { ProjectsController } from './projects.controller';
import { RequestValidation } from '../../middleware/request.middleware';
import { AuthMiddleware } from '../auth/auth.middleware';
import { createProjectSchema, updateProjectSchema, projectsQuerySchema, syncProjectSchema } from './projects.dtos';

const router = Router();

// Make the subdomain route public (before auth middleware)
router.get('/subdomain/:subdomain', 
  ProjectsController.getProjectBySubdomain
);

// Apply auth middleware to all other routes
router.use(AuthMiddleware.requireAuth);

router.post('/', 
  RequestValidation.validateBody(createProjectSchema),
  ProjectsController.createProject
);

router.get('/', 
  RequestValidation.validateQuery(projectsQuerySchema),
  ProjectsController.getProjects
);

router.get('/:id', 
  ProjectsController.getProjectById
);

router.put('/:id', 
  RequestValidation.validateBody(updateProjectSchema),
  ProjectsController.updateProject
);

router.delete('/:id', 
  ProjectsController.deleteProject
);

router.post('/:id/sync', 
  RequestValidation.validateBody(syncProjectSchema),
  ProjectsController.syncProject
);

export default router;