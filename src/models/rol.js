const mongoose = require('mongoose');
const rolSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true,
        unique: true
    },
    descripcion: {
        type: String,
        required: true
        
    }
})
module.exports = mongoose.model('Rol', rolSchema);