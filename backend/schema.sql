CREATE DATABASE IF NOT EXISTS erbienbi;
USE erbienbi;

CREATE TABLE alojamientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(150),
    descripcion TEXT,
    precio_noche DECIMAL(10,2) NOT NULL,
    direccion VARCHAR(200),
    servicios TEXT,
    imagen_principal VARCHAR(200),
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
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