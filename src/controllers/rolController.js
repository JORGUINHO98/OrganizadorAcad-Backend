const Rol = require('../models/rol');

const index = async (req, res) => {
    try {
        const roles = await Rol.find();
        res.json(roles);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

const show = async (req, res) => {
    try {
        const rol = await Rol.findById(req.params.id);
        res.json(rol);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

const create = async (req, res) => {
    try {
        const newRol = new Rol(req.body);
        const savedRol = await newRol.save();

        res.status(201).json(savedRol);
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};

const update = async (req, res) => {
    try {
        const rol = await Rol.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.json(rol);
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};

const destroy = async (req, res) => {
    try {
        const rol = await Rol.findByIdAndDelete(req.params.id);

        res.status(204).json(rol);
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};

module.exports = {
    index,
    show,
    create,
    update,
    destroy
};