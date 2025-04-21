const express = require('express');
const router = express.Router();
const apiController = require('../controllers/api.controller');
const whatsappController = require('../controllers/whatsapp.controller');
const { apiKeyAuth } = require('../middlewares/api-auth.middleware');

/* GET صفحة إدارة API */
router.get('/', apiController.getApiPage);

/* صفحة إدارة مفاتيح API */
router.get('/keys-management', apiController.getApiKeysPage);

/* وثائق API */
router.get('/docs', apiController.getApiDocs);

/* إدارة مفاتيح API */
router.post('/keys', apiController.createApiKey);
router.get('/keys', apiController.getApiKeys);
router.delete('/keys/:id', apiController.deleteApiKey);
router.put('/keys/:id', apiController.updateApiKey);

/* نقاط وصول API للواتساب مع التحقق من مفتاح API */
router.post('/v2/send', apiKeyAuth, whatsappController.sendMessage);
router.get('/v2/check-number', apiKeyAuth, whatsappController.checkNumber);

module.exports = router; 