const pool = require('./src/config/db');

async function seed() {
  try {
    // Basic setup for testing
    console.log('Seeding Database...');
    
    // Create an Admin user
    await pool.query(`
      INSERT INTO usuario (nombre, apellido, correo, contrasena_hash, rol)
      VALUES ('Admin', 'Root', 'admin@ses.com', 'hashed_password', 'Admin')
      ON CONFLICT (correo) DO NOTHING;
    `);

    // Dimensions
    await pool.query(`
      INSERT INTO dimension (id_dimension, nombre, descripcion) VALUES
      (1, 'Tecnologica', 'Dimensión Tecnológica'),
      (2, 'Organizacional', 'Dimensión Organizacional'),
      (3, 'Economica', 'Dimensión Económica')
      ON CONFLICT (id_dimension) DO NOTHING;
    `);

    // We'll just insert a few factors and subfactors for testing.
    await pool.query(`
      INSERT INTO factor (id_factor, id_dimension, nombre, descripcion, tipo_impacto, importancia_literatura, importancia_experto, importancia_sugerida) VALUES
      (1, 1, 'Compatibilidad', 'Compatibilidad con otros sistemas', 'Interno', 3, 4, 3),
      (2, 1, 'Confiabilidad', 'Confiabilidad del sistema', 'Interno', 4, 4, 4),
      (3, 2, 'Soporte', 'Soporte al usuario', 'Externo', 3, 3, 3),
      (4, 2, 'Formación', 'Capacitación necesaria', 'Interno', 2, 3, 2),
      (5, 3, 'Costo de Licencia', 'Costo de adquisición', 'Externo', 4, 4, 4),
      (6, 3, 'Costo de Migración', 'Costo por migrar datos', 'Externo', 3, 4, 3)
      ON CONFLICT (id_factor) DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO subfactor (id_subfactor, id_factor, descripcion, activo) VALUES
      (1, 1, 'El software es compatible con el SO actual', true),
      (2, 1, 'Se integra bien con nuestra BD', true),
      (3, 2, 'Tiene baja tasa de fallos', true),
      (4, 3, 'Proveedor ofrece soporte 24/7', true),
      (5, 4, 'Requiere menos de 10 horas de capacitación', true),
      (6, 5, 'El costo es menor a $1000/año', true),
      (7, 6, 'Existen herramientas automatizadas de migración', true)
      ON CONFLICT (id_subfactor) DO NOTHING;
    `);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit();
  }
}

seed();
