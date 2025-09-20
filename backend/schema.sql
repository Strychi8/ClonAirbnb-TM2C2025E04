CREATE DATABASE IF NOT EXISTS erbienbi;
USE erbienbi;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    contrasenia VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alojamientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_noche DECIMAL(10,2) NOT NULL,
    direccion VARCHAR(200), -- dirección completa (compatibilidad)
    -- Dirección normalizada
    calle VARCHAR(100),
    altura VARCHAR(10),
    localidad VARCHAR(100),
    codigo_postal VARCHAR(20),
    provincia VARCHAR(100),
    pais VARCHAR(100),
    servicios TEXT,
    imagen_principal VARCHAR(200),
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(10),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    cantidad_personas INT NOT NULL,
    precio_noche DECIMAL(10,2) NOT NULL,
    precio_total DECIMAL(10,2) NOT NULL,
    fecha_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alojamiento_imagenes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alojamiento_id INT NOT NULL,
    ruta_imagen VARCHAR(200) NOT NULL,
    FOREIGN KEY (alojamiento_id) REFERENCES alojamientos(id) ON DELETE CASCADE
);



ALTER TABLE reservas ADD COLUMN alojamiento_id INT NOT NULL AFTER id;
ALTER TABLE reservas ADD COLUMN metodo_pago VARCHAR(30) NOT NULL DEFAULT 'MercadoPago' AFTER precio_total;
-- Clave foránea a alojamientos(id) 
ALTER TABLE reservas ADD CONSTRAINT fk_reservas_alojamiento FOREIGN KEY (alojamiento_id) REFERENCES alojamientos(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX ix_reservas_aloj_fechas ON reservas (alojamiento_id, fecha_inicio, fecha_fin);

-- Migración para bases existentes (MySQL 8+ admite IF NOT EXISTS)
ALTER TABLE alojamientos ADD COLUMN IF NOT EXISTS usuario_id INT NULL AFTER id;
ALTER TABLE alojamientos ADD COLUMN IF NOT EXISTS calle VARCHAR(100) NULL AFTER direccion;
ALTER TABLE alojamientos ADD COLUMN IF NOT EXISTS altura VARCHAR(10) NULL AFTER calle;
ALTER TABLE alojamientos ADD COLUMN IF NOT EXISTS localidad VARCHAR(100) NULL AFTER altura;
ALTER TABLE alojamientos ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR(20) NULL AFTER localidad;
ALTER TABLE alojamientos ADD COLUMN IF NOT EXISTS provincia VARCHAR(100) NULL AFTER codigo_postal;
ALTER TABLE alojamientos ADD COLUMN IF NOT EXISTS pais VARCHAR(100) NULL AFTER provincia;

-- Add foreign key constraint for usuario_id if it doesn't exist
-- Note: This will need to be run manually if there are existing alojamientos without usuario_id
-- ALTER TABLE alojamientos ADD CONSTRAINT fk_alojamientos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE;