import { Router } from 'express';
import { ProjectsController } from './projects.controller';
import { RequestValidation } from '../../middleware/request.middleware';
import { AuthMiddleware } from '../auth/auth.middleware';
import { createProjectSchema, updateProjectSchema } from './projects.dtos';

const router = Router();

// Authentication required for all routes
router.use(AuthMiddleware.requireAuth);

// Project CRUD operations
router.post('/', 
  RequestValidation.validateBody(createProjectSchema),
  ProjectsController.createProject
);

router.get('/', 
  ProjectsController.getProjects
);

router.get('/:id', 
  ProjectsController.getProjectById
);

router.get('/subdomain/:subdomain', 
  ProjectsController.getProjectBySubdomain
);

router.put('/:id', 
  RequestValidation.validateBody(updateProjectSchema),
  ProjectsController.updateProject
);

router.delete('/:id', 
  ProjectsController.deleteProject
);

export default router;