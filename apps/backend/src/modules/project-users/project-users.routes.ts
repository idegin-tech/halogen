import { Router } from 'express';
import { ProjectUserController } from './project-users.controller';
import { RequestValidation } from '../../middleware/request.middleware';
import { AuthMiddleware } from '../auth/auth.middleware';
import { 
  createProjectUserSchema, 
  updateProjectUserSchema, 
  projectUsersQuerySchema 
} from './project-users.dtos';

const router = Router();

router.use(AuthMiddleware.requireAuth);

router.post('/', 
  RequestValidation.validateBody(createProjectUserSchema),
  ProjectUserController.createProjectUser
);

router.get('/project/:projectId', 
  RequestValidation.validateQuery(projectUsersQuerySchema),
  ProjectUserController.getProjectUsers
);

router.get('/:id', 
  ProjectUserController.getProjectUserById
);

router.put('/:id', 
  RequestValidation.validateBody(updateProjectUserSchema),
  ProjectUserController.updateProjectUser
);

router.delete('/:id', 
  ProjectUserController.deleteProjectUser
);

export default router;