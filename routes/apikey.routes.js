const express = require('express');
const router = express.Router();
const apiKeyController = require('../controllers/apikey.controller');
const { checkAdmin } = require('../middleware/auth.middleware');

// طرق النهاية لمفاتيح API
// جميع طرق النهاية محمية بوسيط التحقق من المسؤول
router.post('/', checkAdmin, apiKeyController.createApiKey);
router.get('/', checkAdmin, apiKeyController.getAllApiKeys);
router.get('/:id', checkAdmin, apiKeyController.getApiKey);
router.put('/:id', checkAdmin, apiKeyController.updateApiKey);
router.post('/:id/regenerate', checkAdmin, apiKeyController.regenerateApiKey);
router.delete('/:id', checkAdmin, apiKeyController.deleteApiKey);

module.exports = router; 