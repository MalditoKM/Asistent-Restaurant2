
# Estructura de Datos para Añadir Manualmente en Firestore

Esta es la guía de cómo deben estructurarse los datos para cada colección en tu base de datos de Firestore.

---

### 1. Restaurante (`Restaurant`)

- **Colección en Firestore:** `restaurants`
- **Descripción:** Contiene la información principal de cada restaurante.
- **Campos del Documento:**
  - `name`: (string) Ejemplo: "Mi Restaurante"
  - `address`: (string) Ejemplo: "Calle Falsa 123"
  - `phone`: (string) Ejemplo: "555-1234"
- **Subcolecciones:**
  - `users`: Contiene los documentos de los usuarios de este restaurante.

---

### 2. Usuario (`User`)

- **Subcolección en Firestore:** Se encuentra dentro de un restaurante: `restaurants/{ID_DEL_RESTAURANTE}/users`
- **Descripción:** Define los usuarios y sus roles dentro de un restaurante.
- **Campos del Documento:**
  - `name`: (string) Ejemplo: "Juan Pérez"
  - `email`: (string) Ejemplo: "juan@example.com"
  - `password`: (string) Ejemplo: "micontraseña"
  - `role`: (string) Opciones: "superadmin", "admin", "seller", "waiter".
  - `restaurantId`: (string) El ID del documento del restaurante al que pertenece.

---

### 3. Categoría (`Category`)

- **Colección en Firestore:** `categories`
- **Descripción:** Agrupa los productos del menú.
- **Campos del Documento:**
  - `name`: (string) Ejemplo: "Bebidas"
  - `restaurantId`: (string) El ID del restaurante al que pertenece.

---

### 4. Producto (`Product`)

- **Colección en Firestore:** `products`
- **Descripción:** Define cada ítem del menú.
- **Campos del Documento:**
  - `name`: (string) Ejemplo: "Coca-Cola"
  - `price`: (number) Ejemplo: 2.50
  - `category`: (string) Ejemplo: "Bebidas"
  - `restaurantId`: (string) El ID del restaurante al que pertenece.

---

### 5. Cliente (`Customer`)

- **Colección en Firestore:** `customers`
- **Descripción:** Almacena información de los clientes del restaurante.
- **Campos del Documento:**
  - `name`: (string) Ejemplo: "Ana García"
  - `email`: (string) Ejemplo: "ana@cliente.com"
  - `phone`: (string) Ejemplo: "555-5678"
  - `restaurantId`: (string) El ID del restaurante al que pertenece.

---

### 6. Compra (`Purchase`)

- **Colección en Firestore:** `purchases`
- **Descripción:** Registra las compras de inventario.
- **Campos del Documento:**
  - `productName`: (string) Ejemplo: "Tomates"
  - `supplier`: (string) Ejemplo: "Proveedor Agrícola"
  - `quantity`: (number) Ejemplo: 50
  - `unitPrice`: (number) Ejemplo: 0.20
  - `purchaseDate`: (string) Fecha en formato ISO. Ejemplo: "2023-10-27T10:00:00.000Z"
  - `restaurantId`: (string) El ID del restaurante al que pertenece.

---

### 7. Venta (`Sale`)

- **Colección en Firestore:** `sales`
- **Descripción:** Registra cada venta o comanda realizada.
- **Campos del Documento:**
  - `customerName`: (string) Ejemplo: "Consumidor Final"
  - `tableNumber`: (string) Ejemplo: "5"
  - `totalPrice`: (number) Ejemplo: 55.75
  - `saleDate`: (string) Fecha en formato ISO.
  - `userId`: (string) El ID del usuario (de la subcolección `users`) que realizó la venta.
  - `userName`: (string) El nombre del usuario que realizó la venta.
  - `restaurantId`: (string) El ID del restaurante.
  - `status`: (string) Opciones: "pending" o "paid".
  - `items`: (array) Una lista de mapas (objetos), donde cada mapa representa un producto vendido.
    - **Estructura de un objeto en el array `items`:**
      - `id`: (string) ID del producto.
      - `name`: (string) Nombre del producto.
      - `price`: (number) Precio del producto.
      - `category`: (string) Categoría del producto.
      - `quantity`: (number) Cantidad vendida.
      - `restaurantId`: (string) ID del restaurante.

