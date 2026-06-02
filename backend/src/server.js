const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: '*', // Permitir Vercel
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'ses_super_secret_key_2026';

// Get all factors and subfactors
app.get('/api/factors', async (req, res) => {
  try {
    const dimensions = await pool.query('SELECT * FROM dimension');
    const factors = await pool.query('SELECT * FROM factor');
    const subfactors = await pool.query('SELECT * FROM subfactor WHERE activo = true');
    
    // Structure the data for the frontend
    const result = dimensions.rows.map(dim => ({
      ...dim,
      factores: factors.rows.filter(f => f.id_dimension === dim.id_dimension).map(fac => ({
        ...fac,
        subfactores: subfactors.rows.filter(sf => sf.id_factor === fac.id_factor)
      }))
    }));
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// RF-01: Registro de usuario
app.post('/api/auth/register', async (req, res) => {
  const { nombre, apellido, correo, contrasena } = req.body;
  try {
    // Validar formato del correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({ error: 'Formato de correo inválido' });
    }

    // Hash contraseña con bcrypt costo 12 (RNF-03)
    const saltRounds = 12;
    const contrasena_hash = await bcrypt.hash(contrasena, saltRounds);

    const result = await pool.query(
      `INSERT INTO usuario (nombre, apellido, correo, contrasena_hash, rol) 
       VALUES ($1, $2, $3, $4, 'Evaluador') RETURNING id_usuario, nombre, correo, rol`,
      [nombre, apellido, correo, contrasena_hash]
    );

    // Enviaríamos correo de confirmación aquí
    res.json({ message: 'Usuario registrado con éxito', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// RF-02: Login con Bcrypt y JWT
app.post('/api/auth/login', async (req, res) => {
  const { correo, contrasena } = req.body;
  try {
    const result = await pool.query('SELECT * FROM usuario WHERE correo = $1 AND activo = true', [correo]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo' });
    }
    
    const user = result.rows[0];
    
    // Comparar hash bcrypt
    const isValid = await bcrypt.compare(contrasena, user.contrasena_hash);
    if (!isValid) {
      // Aquí se sumaría a un contador para el "bloqueo tras 5 intentos fallidos"
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Generar sesión con token JWT
    const token = jwt.sign(
      { id: user.id_usuario, rol: user.rol }, 
      JWT_SECRET, 
      { expiresIn: '8h' }
    );
    
    res.json({ 
      token, 
      user: { id: user.id_usuario, nombre: user.nombre, correo: user.correo, rol: user.rol } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err.stack || err) });
  }
});

// Middleware simple para verificar si es Admin (para RF-12)
const verifyAdmin = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || decoded.rol !== 'Admin') return res.status(403).json({ error: 'No autorizado' });
    req.user = decoded;
    next();
  });
};

// RF-12: Gestión de usuarios - Listar
app.get('/api/users', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id_usuario, nombre, apellido, correo, rol, activo, fecha_registro FROM usuario ORDER BY fecha_registro DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// RF-12: Gestión de usuarios - Crear con rol específico
app.post('/api/users', verifyAdmin, async (req, res) => {
  const { nombre, apellido, correo, contrasena, rol } = req.body;
  try {
    const contrasena_hash = await bcrypt.hash(contrasena, 12);
    const result = await pool.query(
      `INSERT INTO usuario (nombre, apellido, correo, contrasena_hash, rol) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id_usuario, nombre, correo, rol`,
      [nombre, apellido, correo, contrasena_hash, rol || 'Evaluador']
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'El correo ya está registrado' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new evaluation
app.post('/api/evaluations', async (req, res) => {
  const { id_usuario, nombre_software, version_software, categoria_software, descripcion } = req.body;
  try {
    const newEval = await pool.query(
      `INSERT INTO evaluacion (id_usuario, nombre_software, version_software, categoria_software, descripcion) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id_usuario || 1, nombre_software, version_software, categoria_software, descripcion]
    );
    res.json(newEval.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get evaluations for a user
app.get('/api/evaluations', async (req, res) => {
  const { userId } = req.query; // Usually from JWT
  try {
    const evals = await pool.query(
      'SELECT * FROM evaluacion WHERE id_usuario = $1 ORDER BY fecha_inicio DESC',
      [userId || 1]
    );
    res.json(evals.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// RF-06, 07, 09: Submit Evaluation and Calculate FODA
app.post('/api/evaluations/:id/submit', async (req, res) => {
  const evalId = req.params.id;
  const { factoresEvaluados } = req.body; 
  /*
    factoresEvaluados: [
      { id_factor: 1, importancia_decisor: 3, 
        subfactores: [{ id_subfactor: 1, ponderacion: 4 }, { id_subfactor: 2, ponderacion: 3 }] 
      }
    ]
  */

  try {
    await pool.query('BEGIN'); // Start transaction

    let fortalezas = 0, oportunidades = 0, debilidades = 0, amenazas = 0;

    for (const fe of factoresEvaluados) {
      // 1. Get factor data for IL and tipo_impacto
      const factorRes = await pool.query('SELECT importancia_literatura, tipo_impacto FROM factor WHERE id_factor = $1', [fe.id_factor]);
      const factorDb = factorRes.rows[0];

      // RF-06: Calcular Importancia Relativa (Math.ceil o promedio simple dependiendo de la matriz exacta, simplificaremos a promedio redondeado para el prototipo)
      const importancia_relativa = Math.round((fe.importancia_decisor + factorDb.importancia_literatura) / 2);

      // RF-05: Ponderación media (Promedio de subfactores)
      const sumSub = fe.subfactores.reduce((acc, curr) => acc + curr.ponderacion, 0);
      const ponderacion_media = fe.subfactores.length > 0 ? (sumSub / fe.subfactores.length).toFixed(1) : 0;

      // RF-07: Clasificación FODA
      let clasificacion_foda = 'Fortaleza';
      const pm = parseFloat(ponderacion_media);
      const interno = factorDb.tipo_impacto === 'Interno';

      if (pm >= 3 && interno) { clasificacion_foda = 'Fortaleza'; fortalezas += pm; }
      else if (pm >= 3 && !interno) { clasificacion_foda = 'Oportunidad'; oportunidades += pm; }
      else if (pm < 3 && interno) { clasificacion_foda = 'Debilidad'; debilidades += pm; }
      else if (pm < 3 && !interno) { clasificacion_foda = 'Amenaza'; amenazas += pm; }

      // Save eval_factor
      const efRes = await pool.query(
        `INSERT INTO eval_factor (id_evaluacion, id_factor, importancia_decisor, importancia_relativa, ponderacion_media, clasificacion_foda)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_eval_factor`,
        [evalId, fe.id_factor, fe.importancia_decisor, importancia_relativa, ponderacion_media, clasificacion_foda]
      );
      const id_eval_factor = efRes.rows[0].id_eval_factor;

      // Save eval_subfactors
      for (const sf of fe.subfactores) {
        await pool.query(
          `INSERT INTO eval_subfactor (id_eval_factor, id_subfactor, ponderacion) VALUES ($1, $2, $3)`,
          [id_eval_factor, sf.id_subfactor, sf.ponderacion]
        );
      }
    }

    // RF-09: Generar Recomendación
    const totalPositivo = fortalezas + oportunidades;
    const totalNegativo = debilidades + amenazas;
    let resultado = 'No_adoptar';
    if (totalPositivo > totalNegativo * 1.5) resultado = 'Adoptar';
    else if (totalPositivo > totalNegativo) resultado = 'Adoptar_con_condiciones';

    const justificacion = `El software obtuvo un puntaje positivo de ${totalPositivo.toFixed(2)} frente a un negativo de ${totalNegativo.toFixed(2)}.`;

    await pool.query(
      `INSERT INTO recomendacion (id_evaluacion, resultado, justificacion, puntaje_fortalezas, puntaje_debilidades, puntaje_oportunidades, puntaje_amenazas)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [evalId, resultado, justificacion, fortalezas, debilidades, oportunidades, amenazas]
    );

    // Update evaluation state
    await pool.query(`UPDATE evaluacion SET estado = 'Completada', fecha_fin = NOW() WHERE id_evaluacion = $1`, [evalId]);

    await pool.query('COMMIT');
    res.json({ message: 'Evaluación completada', foda: { fortalezas, oportunidades, debilidades, amenazas }, resultado });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
// --- NUEVA EVALUACIÓN ENDPOINTS ---

app.get('/api/dimensions', async (req, res) => {
  try {
    // Obtener dimensiones, factores y subfactores jerárquicamente
    const dimResult = await pool.query('SELECT * FROM dimension');
    const facResult = await pool.query('SELECT * FROM factor');
    const subResult = await pool.query('SELECT * FROM subfactor WHERE activo = true');
    
    const dimensions = dimResult.rows.map(d => {
      return {
        ...d,
        factores: facResult.rows
          .filter(f => f.id_dimension === d.id_dimension)
          .map(f => ({
            ...f,
            subfactores: subResult.rows.filter(s => s.id_factor === f.id_factor)
          }))
      };
    });
    
    res.json(dimensions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err.stack || err) });
  }
});

app.post('/api/evaluations', async (req, res) => {
  const { nombre_software, descripcion, factoresPonderados, subfactoresCalificados, id_usuario } = req.body;
  try {
    await pool.query('BEGIN');
    
    // 1. Crear Evaluación
    const evalRes = await pool.query(
      'INSERT INTO evaluacion (id_usuario, nombre_software, descripcion, estado) VALUES ($1, $2, $3, $4) RETURNING id_evaluacion',
      [id_usuario, nombre_software, descripcion, 'Finalizado']
    );
    const id_evaluacion = evalRes.rows[0].id_evaluacion;
    
    // 2. Guardar Ponderaciones de Factores (IR)
    for (const factor of factoresPonderados) {
      await pool.query(
        'INSERT INTO eval_factor (id_evaluacion, id_factor, peso_asignado) VALUES ($1, $2, $3)',
        [id_evaluacion, factor.id_factor, factor.peso]
      );
    }
    
    // 3. Guardar Calificaciones de Subfactores
    for (const sub of subfactoresCalificados) {
      await pool.query(
        'INSERT INTO eval_subfactor (id_evaluacion, id_subfactor, calificacion) VALUES ($1, $2, $3)',
        [id_evaluacion, sub.id_subfactor, sub.calificacion]
      );
    }
    
    await pool.query('COMMIT');
    res.json({ success: true, id_evaluacion });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: String(err.stack || err) });
  }
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SES API is running' });
});

app.get('/api/debug-env', (req, res) => {
  res.json({ 
    db_url_exists: !!process.env.DATABASE_URL,
    db_url_length: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
    db_url_start: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) : null
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
