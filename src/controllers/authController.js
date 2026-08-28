const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Rol = require('../models/rol');

const signToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            username: user.username,
            rolNombre: user.rol.nombre,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '1d',
        }
    );
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = signToken(user);
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({
            user: userResponse,
            token,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const register = async (req, res) => {
    try {
        const { username, email, password, rolId, ci } = req.body;

        if (!rolId) {
            return res.status(400).json({ error: 'El rolId es obligatorio' });
        }

        const rolEncontrado = await Rol.findById(rolId);
        if (!rolEncontrado) {
            return res.status(404).json({ error: 'Rol no encontrado' });
        }

        const newUser = new User({
            username,
            email,
            password, // el pre('save') del modelo ya lo hashea
            ci: ci ? ci.trim() : undefined, // opcional
            rolId: rolEncontrado._id,
            rol: {
                nombre: rolEncontrado.nombre,
                descripcion: rolEncontrado.descripcion,
            },
        });

        const savedUser = await newUser.save();
        const token = signToken(savedUser);

        const userResponse = savedUser.toObject();
        delete userResponse.password;

        res.status(201).json({
            user: userResponse,
            token,
        });
    } catch (error) {
        if (error.code === 11000) {
            const campo = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ error: `El ${campo} ya está en uso` });
        }
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    login,
    register,
};
