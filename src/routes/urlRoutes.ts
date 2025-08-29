import { Router } from 'express';
import * as ctrl from '../controllers/urlController';
import { shortenLimiter } from '../middleware/rateLimiter';

const router = Router();

// static routes first
router.get('/urls', ctrl.list);
router.get('/stats/:code', ctrl.stats);
router.post('/shorten', shortenLimiter, ctrl.shorten);

// dynamic routes after
router.put('/:code', ctrl.update);
router.delete('/:code', ctrl.remove);
router.get('/:code', ctrl.redirectToOriginal);

export default router;
