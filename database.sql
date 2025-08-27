-- Este archivo SQL contiene el esquema completo para la aplicación Restaurante Simple.
-- Puedes importar este archivo directamente en tu servidor MySQL para crear todas las tablas necesarias.

-- Eliminar tablas si existen para una instalación limpia (opcional)
DROP TABLE IF EXISTS `restaurante_simple_sales`;
DROP TABLE IF EXISTS `restaurante_simple_purchases`;
DROP TABLE IF EXISTS `restaurante_simple_customers`;
DROP TABLE IF EXISTS `restaurante_simple_products`;
DROP TABLE IF EXISTS `restaurante_simple_categories`;
DROP TABLE IF EXISTS `restaurante_simple_users`;
DROP TABLE IF EXISTS `restaurante_simple_restaurants`;

-- Tabla para Restaurantes: Almacena la información básica de cada restaurante.
CREATE TABLE `restaurante_simple_restaurants` (
    `id` varchar(255) NOT NULL,
    `name` varchar(255) NOT NULL,
    `address` varchar(255) NOT NULL,
    `phone` varchar(255) NOT NULL,
    PRIMARY KEY (`id`)
);

-- Tabla para Usuarios: Almacena las credenciales y roles de los usuarios.
CREATE TABLE `restaurante_simple_users` (
    `id` varchar(255) NOT NULL,
    `name` varchar(255) NOT NULL,
    `email` varchar(255) NOT NULL,
    `password` varchar(255) NOT NULL,
    `role` enum('superadmin','admin','seller','waiter') NOT NULL,
    `restaurantId` varchar(255) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `restaurante_simple_email_restaurant_idx` (`email`,`restaurantId`),
    FOREIGN KEY (`restaurantId`) REFERENCES `restaurante_simple_restaurants`(`id`) ON DELETE CASCADE
);

-- Tabla para Categorías: Organiza los productos del menú (Ej: Bebidas, Postres).
CREATE TABLE `restaurante_simple_categories` (
    `id` varchar(255) NOT NULL,
    `name` varchar(255) NOT NULL,
    `restaurantId` varchar(255) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`restaurantId`) REFERENCES `restaurante_simple_restaurants`(`id`) ON DELETE CASCADE
);

-- Tabla para Productos: Define cada item del menú con su precio y categoría.
CREATE TABLE `restaurante_simple_products` (
    `id` varchar(255) NOT NULL,
    `name` varchar(255) NOT NULL,
    `price` decimal(10,2) NOT NULL,
    `category` varchar(255) NOT NULL,
    `restaurantId` varchar(255) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`restaurantId`) REFERENCES `restaurante_simple_restaurants`(`id`) ON DELETE CASCADE
);

-- Tabla para Clientes: Almacena información de los clientes recurrentes.
CREATE TABLE `restaurante_simple_customers` (
    `id` varchar(255) NOT NULL,
    `name` varchar(255) NOT NULL,
    `email` varchar(255) NOT NULL,
    `phone` varchar(255) NOT NULL,
    `restaurantId` varchar(255) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`restaurantId`) REFERENCES `restaurante_simple_restaurants`(`id`) ON DELETE CASCADE
);

-- Tabla para Compras: Registra las compras de insumos y productos a proveedores.
CREATE TABLE `restaurante_simple_purchases` (
    `id` varchar(255) NOT NULL,
    `productName` varchar(255) NOT NULL,
    `supplier` varchar(255),
    `quantity` int NOT NULL,
    `unitPrice` decimal(10,2) NOT NULL,
    `purchaseDate` timestamp NOT NULL,
    `restaurantId` varchar(255) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`restaurantId`) REFERENCES `restaurante_simple_restaurants`(`id`) ON DELETE CASCADE
);

-- Tabla para Ventas: Guarda el registro de cada comanda o venta realizada.
CREATE TABLE `restaurante_simple_sales` (
    `id` varchar(255) NOT NULL,
    `customerName` varchar(255) NOT NULL,
    `tableNumber` varchar(255) NOT NULL,
    `items` json NOT NULL,
    `totalPrice` decimal(10,2) NOT NULL,
    `saleDate` timestamp NOT NULL,
    `userId` varchar(255) NOT NULL,
    `userName` varchar(255) NOT NULL,
    `restaurantId` varchar(255) NOT NULL,
    `status` enum('paid','pending') NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`restaurantId`) REFERENCES `restaurante_simple_restaurants`(`id`) ON DELETE CASCADE
);