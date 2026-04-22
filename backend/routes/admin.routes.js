import { Router } from 'express';
import {
  bulkImportQuestions,
  createQuestion,
  deleteQuestion,
  listQuestions,
  toggleQuestion,
  updateQuestion
} from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';

const router = Router();

router.use(requireAuth, requireAdmin);
router.get('/questions', listQuestions);
router.post('/questions', createQuestion);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);
router.patch('/questions/:id/toggle', toggleQuestion);
router.post('/questions/bulk-import', bulkImportQuestions);

export default router;

