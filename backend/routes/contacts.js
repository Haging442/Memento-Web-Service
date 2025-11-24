const express = require('express');
const router = express.Router();
const auth = require('../auth');
const ctrl = require('../controllers/contacts');

router.get('/', auth, ctrl.getContacts);
router.post('/', auth, ctrl.createContact);

module.exports = router;
