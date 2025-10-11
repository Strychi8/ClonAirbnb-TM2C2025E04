CREATE DATABASE `erbienbi`;
USE `erbienbi`;

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `nombre_completo` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `contrasenia` varchar(255) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `foto_perfil` varchar(200) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `numero_identidad` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
);

CREATE TABLE `alojamientos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `ubicacion` varchar(150) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `precio_noche` decimal(10, 2) NOT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `calle` varchar(100) DEFAULT NULL,
  `altura` varchar(10) DEFAULT NULL,
  `localidad` varchar(100) DEFAULT NULL,
  `codigo_postal` varchar(20) DEFAULT NULL,
  `provincia` varchar(100) DEFAULT NULL,
  `pais` varchar(100) DEFAULT NULL,
  `servicios` text DEFAULT NULL,
  `tipo_alojamiento` varchar(25) DEFAULT NULL,
  `tipo_propiedad` varchar(25) DEFAULT NULL,     -- Esta linea esta de mas, es la misma que "tipo_alojamiento"
  `imagen_principal` varchar(200) DEFAULT NULL,
  `fecha_alta` timestamp NOT NULL DEFAULT current_timestamp(),
  `activo` tinyint(1) DEFAULT '1'
  PRIMARY KEY (`id`),
  KEY `fk_alojamientos_usuario` (`usuario_id`),
  CONSTRAINT `fk_alojamientos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE
);

CREATE TABLE `alojamiento_imagenes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `alojamiento_id` int(11) NOT NULL,
  `ruta_imagen` varchar(200) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `alojamiento_id` (`alojamiento_id`),
  CONSTRAINT `alojamiento _imagenes_ibfk_1` FOREIGN KEY (`alojamiento_id`) REFERENCES `alojamientos` (`id`) ON DELETE CASCADE
);

CREATE TABLE `password_reset_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `token` varchar(64) NOT NULL,
  `expiracion` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_token` (`token`),
  KEY `idx_expiracion` (`expiracion`),
  CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
);

CREATE TABLE `reservas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `alojamiento_id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `telefono` varchar(10) DEFAULT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `cantidad_personas` int(11) NOT NULL,
  `precio_noche` decimal(10, 2) NOT NULL,
  `precio_total` decimal(10, 2) NOT NULL,
  `metodo_pago` varchar(30) NOT NULL DEFAULT 'MercadoPago',
  `fecha_reserva` timestamp NOT NULL DEFAULT current_timestamp(),
  `usuario_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_reservas_aloj_fechas` (`alojamiento_id`, `fecha_inicio`, `fecha_fin`),
  CONSTRAINT `fk_reservas_alojamiento` FOREIGN KEY (`alojamiento_id`) REFERENCES `alojamientos` (`id`) ON UPDATE CASCADE
);




ALTER TABLE reservas ADD COLUMN estado ENUM('activa', 'cancelada', 'finalizada') DEFAULT 'activa';

