import { Router } from 'express';
import { SystemController } from './system.controller';

const router = Router();

router.get('/modules', SystemController.getModules);

export default router;
