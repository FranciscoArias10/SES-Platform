CREATE TABLE usuario (
  id_usuario SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  correo VARCHAR(255) NOT NULL UNIQUE,
  contrasena_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL DEFAULT 'Evaluador' CHECK (rol IN ('Admin','Evaluador','Consultor')),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE evaluacion (
  id_evaluacion SERIAL PRIMARY KEY,
  id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario),
  nombre_software VARCHAR(200) NOT NULL,
  version_software VARCHAR(50),
  categoria_software VARCHAR(100),
  descripcion TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'En_curso' CHECK (estado IN ('En_curso','Completada','Archivada')),
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_fin TIMESTAMPTZ
);

CREATE TABLE dimension (
  id_dimension SERIAL PRIMARY KEY,
  nombre VARCHAR(20) NOT NULL UNIQUE CHECK (nombre IN ('Tecnologica','Organizacional','Economica')),
  descripcion TEXT
);

CREATE TABLE factor (
  id_factor SERIAL PRIMARY KEY,
  id_dimension INTEGER NOT NULL REFERENCES dimension(id_dimension),
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  tipo_impacto VARCHAR(10) NOT NULL CHECK (tipo_impacto IN ('Interno','Externo')),
  importancia_literatura SMALLINT NOT NULL CHECK (importancia_literatura BETWEEN 1 AND 4),
  importancia_experto SMALLINT NOT NULL CHECK (importancia_experto BETWEEN 1 AND 4),
  importancia_sugerida SMALLINT NOT NULL CHECK (importancia_sugerida BETWEEN 1 AND 4)
);

CREATE TABLE subfactor (
  id_subfactor SERIAL PRIMARY KEY,
  id_factor INTEGER NOT NULL REFERENCES factor(id_factor),
  descripcion TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE eval_factor (
  id_eval_factor SERIAL PRIMARY KEY,
  id_evaluacion INTEGER NOT NULL REFERENCES evaluacion(id_evaluacion) ON DELETE CASCADE,
  id_factor INTEGER NOT NULL REFERENCES factor(id_factor),
  importancia_decisor SMALLINT NOT NULL CHECK (importancia_decisor BETWEEN 1 AND 4),
  importancia_relativa SMALLINT CHECK (importancia_relativa BETWEEN 1 AND 4),
  ponderacion_media NUMERIC(3,1) CHECK (ponderacion_media BETWEEN 1.0 AND 4.0),
  clasificacion_foda VARCHAR(20) CHECK (clasificacion_foda IN ('Fortaleza','Oportunidad','Debilidad','Amenaza')),
  UNIQUE (id_evaluacion, id_factor)
);

CREATE TABLE eval_subfactor (
  id_eval_subfactor SERIAL PRIMARY KEY,
  id_eval_factor INTEGER NOT NULL REFERENCES eval_factor(id_eval_factor) ON DELETE CASCADE,
  id_subfactor INTEGER NOT NULL REFERENCES subfactor(id_subfactor),
  ponderacion SMALLINT NOT NULL CHECK (ponderacion BETWEEN 1 AND 4),
  UNIQUE (id_eval_factor, id_subfactor)
);

CREATE TABLE recomendacion (
  id_recomendacion SERIAL PRIMARY KEY,
  id_evaluacion INTEGER NOT NULL UNIQUE REFERENCES evaluacion(id_evaluacion),
  resultado VARCHAR(30) NOT NULL CHECK (resultado IN ('Adoptar','Adoptar_con_condiciones','No_adoptar')),
  justificacion TEXT,
  puntaje_fortalezas NUMERIC(4,2),
  puntaje_debilidades NUMERIC(4,2),
  puntaje_oportunidades NUMERIC(4,2),
  puntaje_amenazas NUMERIC(4,2),
  fecha_generacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reporte (
  id_reporte SERIAL PRIMARY KEY,
  id_evaluacion INTEGER NOT NULL REFERENCES evaluacion(id_evaluacion),
  nombre_archivo VARCHAR(255) NOT NULL,
  ruta_almacenamiento TEXT NOT NULL,
  fecha_generacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  formato VARCHAR(10) NOT NULL DEFAULT 'PDF'
);

-- INDICES
CREATE INDEX idx_evaluacion_usuario ON evaluacion(id_usuario);
CREATE INDEX idx_eval_factor_eval ON eval_factor(id_evaluacion);
CREATE INDEX idx_eval_subfactor_ef ON eval_subfactor(id_eval_factor);
CREATE INDEX idx_factor_dimension ON factor(id_dimension);
CREATE INDEX idx_recomendacion_eval ON recomendacion(id_evaluacion);
