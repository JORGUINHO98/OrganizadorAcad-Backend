# Backend TecnoWeb2 — Organizador Académico

## Introducción

Este proyecto corresponde al backend de **TecnoWeb2**, una API REST desarrollada para centralizar la lógica del servidor, la gestión de datos y la comunicación con una base de datos MongoDB.

La aplicación está construida con Node.js y Express. Permite administrar roles, usuarios (docentes y estudiantes), materias, tareas académicas y archivos adjuntos como evidencia de entrega, mediante una API REST protegida con autenticación JWT y control de acceso por rol.

## Tecnologías utilizadas

- **Node.js:** entorno de ejecución del servidor.
- **Express:** framework para crear la API REST y gestionar las rutas HTTP.
- **MongoDB:** base de datos NoSQL utilizada para almacenar la información.
- **Mongoose:** ODM para definir esquemas, modelos y operaciones sobre MongoDB.
- **dotenv:** carga de variables de entorno desde un archivo `.env`.
- **CORS:** permite la comunicación entre el backend y aplicaciones frontend alojadas en otros orígenes.
- **bcryptjs:** hash seguro de contraseñas.
- **jsonwebtoken:** genera y valida tokens JWT para la autenticación.
- **multer:** maneja la subida de archivos (PDF/Word) como evidencia de tareas.
- **Nodemon:** reinicia automáticamente el servidor en desarrollo.

## Modelo de roles y permisos

La app tiene dos tipos de usuario, definidos por su rol:

| Rol | Puede |
|---|---|
| **Docente** | Crear/editar/eliminar sus propias materias. Crear/editar/eliminar tareas dentro de sus materias. Inscribir/desinscribir estudiantes en sus materias. Marcar tareas como completadas. |
| **Estudiante** | Ver únicamente las materias donde está inscrito, y las tareas de esas materias. Marcar tareas como completadas. Subir/eliminar el archivo adjunto (PDF o Word) de una tarea. |

Un usuario NO puede ver ni modificar materias/tareas que no le correspondan (ni por rol, ni por no ser el dueño/no estar inscrito).

## Estructura del proyecto

```text
Backend/
├── index.js
├── package.json
├── uploads/                     # Archivos subidos (PDF/Word), servidos en /uploads
└── src/
    ├── app.js
    ├── config/
    │   └── db.js
    ├── controllers/
    │   ├── authController.js    # Registro y login (genera el JWT)
    │   ├── materiaController.js # CRUD de materias + inscripción de estudiantes
    │   ├── rolController.js     # CRUD de roles
    │   ├── tareaController.js   # CRUD de tareas + adjuntos
    │   └── userController.js    # Perfil propio del usuario
    ├── middleware/
    │   ├── checkRole.js         # Restringe rutas por rol (Docente/Estudiante)
    │   ├── Uploadmiddleware.js  # Configuración de multer (PDF/Word, máx. 10MB)
    │   └── verifyToken.js       # Verifica el JWT y llena req.usuario
    ├── models/
    │   ├── materia.js           # Materia: docente dueño + estudiantes inscritos + tareas embebidas
    │   ├── rol.js
    │   ├── tarea.js             # Sub-esquema embebido en Materia, incluye archivoAdjunto
    │   └── user.js
    └── routes/
        ├── authRoute.js
        ├── materiaRoute.js
        ├── rolRoute.js
        ├── tareaRoute.js
        └── userRoute.js
```

## Requisitos

- Node.js instalado.
- MongoDB local o una instancia de MongoDB Atlas.
- npm.

## Instalación

```bash
npm install
```

Crear un archivo `.env` en la raíz del proyecto:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/OrganizadorAcademico
JWT_SECRET=una_clave_secreta_segura
JWT_EXPIRES_IN=1d
```

## Ejecución

```bash
node index.js
```

En desarrollo:

```bash
npx nodemon index.js
```

## Respuestas y códigos de estado

- `200` / `201` — éxito.
- `400` — error de validación o body inválido.
- `401` — token no proporcionado, inválido o expirado.
- `403` — el usuario está autenticado pero no tiene permiso (rol incorrecto, no es el dueño, o no está inscrito en la materia).
- `404` — recurso no encontrado.
- `500` — error interno.

---

## API de roles — `/api/roles`

Pública (no requiere token), ya que el registro de usuarios necesita un `rolId` válido antes de que exista ningún token.

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/roles` | Lista todos los roles |
| `GET` | `/api/roles/:id` | Obtiene un rol por su ID |
| `POST` | `/api/roles` | Crea un rol |
| `PUT` | `/api/roles/:id` | Actualiza un rol |
| `DELETE` | `/api/roles/:id` | Elimina un rol |

Ejemplo:
```json
POST /api/roles
{ "nombre": "Docente", "descripcion": "Rol de docente" }
```

> Se necesitan al menos dos roles creados: `Docente` y `Estudiante` (nombres exactos, sensibles a mayúsculas), ya que el control de acceso los compara literalmente.

---

## API de autenticación — `/api/auth`

Pública.

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/auth/register` | Registra un usuario (requiere `rolId`) y devuelve un token |
| `POST` | `/api/auth/login` | Inicia sesión y devuelve un token |

```json
POST /api/auth/register
{
  "username": "profe_ana",
  "email": "ana@mail.com",
  "password": "secreto123",
  "rolId": "ID_DEL_ROL_DOCENTE"
}
```

El token incluye `id`, `username` y `rolNombre`, y debe enviarse en las rutas protegidas como:
```http
Authorization: Bearer <token>
```

---

## API de usuarios — `/api/users`

Todas las rutas requieren token. Cada usuario solo puede ver/editar/eliminar **su propia cuenta**.

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/users/:id` | Obtiene el perfil propio |
| `PUT` | `/api/users/:id` | Actualiza el perfil propio |
| `DELETE` | `/api/users/:id` | Elimina la cuenta propia |

---

## API de materias — `/api/materias`

Todas las rutas requieren token.

| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| `GET` | `/api/materias` | Docente / Estudiante | Docente ve las suyas; Estudiante ve solo donde está inscrito |
| `GET` | `/api/materias/:id` | Docente / Estudiante | Igual, para una sola materia |
| `POST` | `/api/materias` | **Docente** | Crea una materia (el docente queda como dueño) |
| `PUT` | `/api/materias/:id` | **Docente** dueño | Actualiza el nombre |
| `DELETE` | `/api/materias/:id` | **Docente** dueño | Elimina la materia |
| `POST` | `/api/materias/:id/estudiantes` | **Docente** dueño | Inscribe a un estudiante — body: `{ "estudianteId": "..." }` |
| `DELETE` | `/api/materias/:id/estudiantes/:estudianteId` | **Docente** dueño | Desinscribe a un estudiante |

El campo `docente` ya no se guarda como texto: los datos del docente (username, email) se obtienen automáticamente vía `populate()` desde `usuarioId`.

```json
POST /api/materias
{ "nombre": "Matemáticas" }
```

```json
POST /api/materias/:id/estudiantes
{ "estudianteId": "ID_DEL_ESTUDIANTE" }
```

---

## API de tareas — `/api/tareas`

Todas las rutas requieren token. Las tareas viven **embebidas** dentro del documento de su materia.

| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| `GET` | `/api/tareas` | Docente / Estudiante | Lista tareas (filtros opcionales: `?materiaId=&completada=&prioridad=`) |
| `GET` | `/api/tareas/pendientes` | Docente / Estudiante | Solo tareas no completadas |
| `POST` | `/api/tareas/:materiaId` | **Docente** dueño | Crea una tarea en su materia |
| `PUT` | `/api/tareas/:materiaId/:tareaId` | **Docente** dueño | Actualiza una tarea |
| `DELETE` | `/api/tareas/:materiaId/:tareaId` | **Docente** dueño | Elimina una tarea |
| `PATCH` | `/api/tareas/:materiaId/:tareaId/completar` | Docente / Estudiante | Marca/desmarca como completada |
| `POST` | `/api/tareas/:materiaId/:tareaId/adjunto` | **Estudiante** inscrito | Sube un PDF/Word como evidencia (form-data, campo `archivo`) |
| `DELETE` | `/api/tareas/:materiaId/:tareaId/adjunto` | **Estudiante** inscrito | Elimina el archivo adjunto |

```json
POST /api/tareas/:materiaId
{
  "titulo": "Resolver ejercicios del capítulo 3",
  "descripcion": "Ejercicios indicados en clase",
  "fechaEntrega": "2026-09-01",
  "prioridad": "alta"
}
```

Los archivos subidos quedan accesibles públicamente en:
```
http://localhost:5000/uploads/<nombre-del-archivo>
```

Restricciones del adjunto: solo `.pdf`, `.doc`, `.docx`, máximo 10 MB.

---

## Solución de problemas

### El servidor no se conecta a MongoDB
- Verifica que MongoDB esté corriendo localmente, o que la URL de Atlas sea correcta en `.env`.

### `401 Token no proporcionado` en rutas protegidas
- Asegúrate de mandar el header `Authorization: Bearer <token>`.
- El registro/login (`/api/auth/...`) y los roles (`/api/roles`) son las únicas rutas públicas.

### `403 No tienes permiso` inesperado
- Revisa que el rol del usuario (`nombre` en la colección `rols`) sea exactamente `Docente` o `Estudiante` — la comparación es sensible a mayúsculas.
- Si es un estudiante, confirma que esté inscrito en esa materia (`estudiantes[]` en el documento de la materia).

## Próximas ampliaciones

- Inscripción masiva de estudiantes (varios `estudianteId` en un solo request).
- Validaciones y manejo de errores más completos.
- Pruebas automatizadas.
- Documentación interactiva con Swagger.

## Estado del proyecto

Backend funcional con roles Docente/Estudiante, autenticación JWT, materias con inscripción de estudiantes, tareas embebidas con prioridad/fecha de entrega/estado, y adjuntos de archivos como evidencia de entrega.