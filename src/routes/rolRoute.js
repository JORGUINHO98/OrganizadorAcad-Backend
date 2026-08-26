const express = require('express');
const router = express.Router();

const { index, show, create, update, destroy } = require('../controllers/rolController');

// Los roles son catálogo básico de la app (no datos sensibles), y además
// deben poder consultarse/crearse ANTES de que exista ningún usuario/token
// (el registro necesita un rolId válido). Por eso se dejan públicos.
router.get('/', index);
router.get('/:id', show);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', destroy);

module.exports = router;