import {Router} from 'express'
import { gatherData } from '../controller/espServer.controller.js';

const router = Router();

router.post('/gather-data', gatherData);

export default router;

























