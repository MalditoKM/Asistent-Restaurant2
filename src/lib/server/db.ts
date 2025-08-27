
'use server';

import { initializeFirebaseAdmin } from './firebase';
import type { Restaurant, User, Product, Category, Customer, Purchase, Sale } from '@/types';
import type { firestore } from 'firebase-admin';

// =================================================================
// OBTENEDOR DE COLECCIONES (UTILERÍA INTERNA)
// =================================================================

/**
 * Obtiene una referencia a una colección de Firestore con un convertidor de tipos.
 * El convertidor se encarga de transformar los datos que vienen de Firestore
 * a nuestros tipos de TypeScript (interfaces en `types/index.ts`) y viceversa.
 * @param collectionName El nombre de la colección en Firestore (ej: 'restaurants', 'products').
 * @returns Una referencia a la colección de Firestore o null si la base de datos no está conectada.
 */
async function getCollection<T extends { id: string }>(collectionName: string): Promise<firestore.CollectionReference<T> | null> {
    // Primero, nos aseguramos de que el SDK de Firebase Admin esté inicializado.
    const admin = await initializeFirebaseAdmin();
    if (!admin) {
        // Si no hay conexión, mostramos una advertencia y devolvemos null.
        console.warn(`ADVERTENCIA: Firestore no está disponible. No se pudo acceder a la colección "${collectionName}".`);
        return null;
    }

    const db = admin.firestore();
    
    // Este "converter" es la clave para trabajar con TypeScript de forma segura.
    const converter = {
        // `toFirestore`: Convierte nuestro objeto de JS/TS a un formato que Firestore entiende.
        toFirestore: (data: Partial<T>): firestore.DocumentData => {
            const { id, ...rest } = data as any; // Excluimos el ID porque Firestore lo maneja por separado.
            return rest;
        },
        // `fromFirestore`: Convierte el documento que viene de Firestore a nuestro tipo de TS.
        fromFirestore: (snapshot: firestore.QueryDocumentSnapshot): T => {
            const data = snapshot.data();
            // Firestore devuelve las fechas como objetos `Timestamp`. Las convertimos a strings ISO.
            for (const key in data) {
                if (data[key] instanceof admin.firestore.Timestamp) {
                    data[key] = (data[key] as firestore.Timestamp).toDate().toISOString();
                }
            }
            // Devolvemos los datos del documento junto con su ID.
            return { ...data, id: snapshot.id } as T;
        },
    };
    // Devolvemos la referencia a la colección con el convertidor aplicado.
    return db.collection(collectionName).withConverter(converter);
};

// =================================================================
// FUNCIÓN DE RESPALDO (UTILERÍA INTERNA)
// =================================================================

/**
 * Función de respaldo para cuando la base de datos no está conectada.
 * Devuelve un valor por defecto para evitar que la aplicación se bloquee.
 * @param defaultValue El valor a devolver si no hay conexión (ej: un array vacío []).
 * @param message Mensaje opcional para mostrar en la consola.
 * @returns El valor por defecto.
 */
const handleNoDb = <T>(defaultValue: T, message?: string) => {
    if (message) console.warn(message);
    return defaultValue;
}


// =================================================================
// ACCIONES DE RESTAURANTE
// =================================================================

/**
 * Obtiene todos los restaurantes y anida sus respectivos usuarios.
 * @returns Una lista de todos los restaurantes con sus usuarios.
 */
export async function getAllRestaurantsWithUsers(): Promise<Restaurant[]> {
    const admin = await initializeFirebaseAdmin();
    const restaurantsCollection = await getCollection<Restaurant>('restaurants');
    if (!restaurantsCollection || !admin) return handleNoDb([], 'No se pudieron cargar los restaurantes.');
    
    const snapshot = await restaurantsCollection.get();
    if (snapshot.empty) return [];

    const restaurants = snapshot.docs.map(doc => doc.data());

    // Para cada restaurante, hacemos una sub-consulta para obtener sus usuarios.
    const db = admin.firestore();
    for (const restaurant of restaurants) {
        const usersSnapshot = await db.collection(`restaurants/${restaurant.id}/users`).get();
        restaurant.users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    }

    return restaurants;
}

/**
 * Obtiene un restaurante específico por su ID.
 * @param id El ID del restaurante a buscar.
 * @returns El objeto del restaurante o null si no se encuentra.
 */
export async function getRestaurantById(id: string): Promise<Restaurant | null> {
    const restaurantsCollection = await getCollection<Restaurant>('restaurants');
    if (!restaurantsCollection) return handleNoDb(null, 'No se pudo cargar el restaurante.');

    const doc = await restaurantsCollection.doc(id).get();
    if (!doc.exists) return null;

    const restaurant = doc.data();
    if (!restaurant) return null;

    // También obtenemos los usuarios de este restaurante específico.
    const admin = await initializeFirebaseAdmin();
    if (admin) {
        const usersSnapshot = await admin.firestore().collection(`restaurants/${restaurant.id}/users`).get();
        restaurant.users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    }

    return restaurant;
}

/**
 * Crea un nuevo restaurante y su usuario administrador inicial.
 * @param restaurantData Datos del restaurante a crear.
 * @param adminData Datos del usuario administrador.
 * @returns El nuevo restaurante con su administrador.
 */
export async function createRestaurant(restaurantData: Omit<Restaurant, 'id' | 'users'>, adminData: Omit<User, 'id' | 'role' | 'restaurantId'>): Promise<Restaurant> {
    const admin = await initializeFirebaseAdmin();
    if (!admin) {
        throw new Error('La base de datos no está disponible. No se puede crear el restaurante.');
    }
    const db = admin.firestore();
    const restaurantsCollection = await getCollection<Restaurant>('restaurants');
    if (!restaurantsCollection) {
        throw new Error('La colección de restaurantes no está disponible.');
    }
    
    const allRestaurantsSnapshot = await restaurantsCollection.get();
    const isFirstRestaurantInSystem = allRestaurantsSnapshot.empty;

    // Solo validamos si ya existen otros restaurantes para evitar errores con una DB vacía.
    if (!isFirstRestaurantInSystem) {
        const existingRestaurantQuery = await restaurantsCollection.where('name', '==', restaurantData.name).limit(1).get();
        if (!existingRestaurantQuery.empty) {
            throw new Error('Ya existe un restaurante con este nombre.');
        }

        const allRestaurantsWithUsers = await getAllRestaurantsWithUsers();
        const adminEmailExists = allRestaurantsWithUsers.some(r => r.users.some(u => u.email === adminData.email));
        if (adminEmailExists) {
            throw new Error('Este correo electrónico ya está registrado.');
        }
    }

    // El primer restaurante creado obtiene el rol de 'superadmin'. Los siguientes serán 'admin'.
    const adminRole = isFirstRestaurantInSystem ? 'superadmin' : 'admin';

    const newRestaurantRef = restaurantsCollection.doc(); // Creamos una referencia para el nuevo restaurante.
    const newAdminRef = db.collection(`restaurants/${newRestaurantRef.id}/users`).doc(); // Referencia para el usuario en la subcolección.

    const newFullAdminData: User = {
        id: newAdminRef.id,
        ...adminData,
        role: adminRole,
        restaurantId: newRestaurantRef.id, // Vinculamos el usuario al restaurante.
    };

    // Usamos una transacción para asegurar que ambas operaciones (crear restaurante y crear usuario)
    // se completen con éxito, o ninguna de ellas. Esto mantiene la consistencia de los datos.
    await db.runTransaction(async (transaction) => {
        const { users, ...restOfRestaurantData } = restaurantData as any;
        transaction.set(newRestaurantRef, restOfRestaurantData);

        const { id, ...restOfAdminData } = newFullAdminData;
        transaction.set(newAdminRef, restOfAdminData);
    });

    // Devolvemos el restaurante recién creado.
    const newRestaurantDoc = await newRestaurantRef.get();
    const newRestaurant = newRestaurantDoc.data()!;
    newRestaurant.users = [newFullAdminData];

    return newRestaurant;
}


/**
 * Actualiza los datos de un restaurante y/o su administrador.
 * @param id El ID del restaurante a actualizar.
 * @param restaurantData Nuevos datos para el restaurante.
 * @param adminData Nuevos datos para el administrador (opcional).
 * @returns El restaurante actualizado.
 */
export async function updateRestaurant(id: string, restaurantData: Partial<Omit<Restaurant, 'id' | 'users'>>, adminData?: {id: string, email: string, password?: string}): Promise<Restaurant> {
    const admin = await initializeFirebaseAdmin();
    if (!admin) throw new Error("La base de datos no está conectada.");
    const db = admin.firestore();
    const restaurantRef = db.collection('restaurants').doc(id);

    // Usamos una transacción para actualizar de forma segura.
    await db.runTransaction(async (transaction) => {
        const restaurantDoc = await transaction.get(restaurantRef);
        if (!restaurantDoc.exists) throw new Error('Restaurante no encontrado.');

        transaction.update(restaurantRef, restaurantData as any);

        if (adminData) {
            const adminRef = db.collection(`restaurants/${id}/users`).doc(adminData.id);
            const adminUpdateData: Partial<User> = { email: adminData.email };
            if (adminData.password) adminUpdateData.password = adminData.password;
            transaction.update(adminRef, adminUpdateData as any);
        }
    });

    const result = await getRestaurantById(id);
    if (!result) throw new Error("No se pudo obtener el restaurante actualizado.");
    return result;
}

// Función auxiliar recursiva para eliminar todos los documentos de una colección en lotes.
async function deleteCollection(db: firestore.Firestore, collectionPath: string, batchSize: number) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
    });
}
async function deleteQueryBatch(db: firestore.Firestore, query: firestore.Query, resolve: (value: unknown) => void) {
    const snapshot = await query.get();
    if (snapshot.size === 0) {
        resolve(true);
        return;
    }
    const batch = db.batch();
    snapshot.docs.forEach((doc) => { batch.delete(doc.ref); });
    await batch.commit();
    process.nextTick(() => { deleteQueryBatch(db, query, resolve); });
}

/**
 * Elimina un restaurante y todos sus datos anidados (usuarios, productos, etc.).
 * @param id El ID del restaurante a eliminar.
 */
export async function deleteRestaurant(id: string): Promise<void> {
    const admin = await initializeFirebaseAdmin();
    if (!admin) throw new Error("La base de datos no está conectada.");
    
    const db = admin.firestore();
    const restaurantRef = db.collection('restaurants').doc(id);

    const allRestaurantsSnapshot = await db.collection('restaurants').get();
    if (allRestaurantsSnapshot.size <= 1) {
        throw new Error('No se puede eliminar el único restaurante que queda.');
    }

    // Eliminamos todas las subcolecciones antes de eliminar el restaurante principal.
    const subcollections = ['users', 'products', 'categories', 'customers', 'purchases', 'sales'];
    for(const subcollection of subcollections) {
        await deleteCollection(db, `restaurants/${id}/${subcollection}`, 100);
    }

    await restaurantRef.delete();
}


// =================================================================
// ACCIONES DE USUARIO
// =================================================================

/**
 * Añade un nuevo usuario a un restaurante específico.
 * @param userData Datos del usuario a crear.
 * @returns El nuevo usuario creado.
 */
export async function addUser(userData: Omit<User, 'id'>): Promise<User> {
    const usersCollection = await getCollection<User>(`restaurants/${userData.restaurantId}/users`);
    if (!usersCollection) throw new Error("La base de datos no está conectada.");

    const existingUserQuery = await usersCollection.where('email', '==', userData.email).limit(1).get();
    if(!existingUserQuery.empty) throw new Error('El correo electrónico ya existe en este restaurante.');

    return addDoc<User>(`restaurants/${userData.restaurantId}/users`, userData);
}

/**
 * Actualiza los datos de un usuario.
 * @param id El ID del usuario a actualizar.
 * @param userData Los nuevos datos para el usuario.
 * @returns El usuario actualizado.
 */
export async function updateUser(id: string, userData: Partial<Omit<User, 'id'>>): Promise<User> {
    const allRestaurants = await getAllRestaurantsWithUsers();
    let restaurantId: string | undefined;
    for (const r of allRestaurants) {
        if (r.users.some(u => u.id === id)) {
            restaurantId = r.id;
            break;
        }
    }
    if (!restaurantId) throw new Error('Usuario no encontrado.');

    return updateDoc<User>(`restaurants/${restaurantId}/users`, id, userData);
}

/**
 * Elimina un usuario del sistema.
 * @param id El ID del usuario a eliminar.
 * @param currentUserId El ID del usuario que realiza la acción (para evitar auto-eliminación).
 */
export async function deleteUser(id: string, currentUserId: string): Promise<void> {
    if (id === currentUserId) throw new Error("No puedes eliminar tu propia cuenta.");
    const allRestaurants = await getAllRestaurantsWithUsers();
    // Lógica compleja para encontrar el usuario y su restaurante, y aplicar reglas de negocio.
    let userToDelete: User | undefined, restaurantId: string | undefined, restaurantOfUser: Restaurant | undefined;
    for (const r of allRestaurants) {
        const found = r.users.find(u => u.id === id);
        if (found) { userToDelete = found; restaurantId = r.id; restaurantOfUser = r; break; }
    }
    if (!userToDelete || !restaurantId || !restaurantOfUser) throw new Error('Usuario no encontrado.');
    if (userToDelete.role === 'superadmin' && allRestaurants.flatMap(r => r.users).filter(u => u.role === 'superadmin').length <= 1) {
        throw new Error("No se puede eliminar al último superadministrador.");
    }
    if (userToDelete.role === 'admin' && restaurantOfUser.users.filter(u => u.role === 'admin' || u.role === 'superadmin').length <= 1) {
        throw new Error("No se puede eliminar al último administrador del restaurante.");
    }
    
    return deleteDoc(`restaurants/${restaurantId}/users`, id);
}


// =================================================================
// ACCIONES GENÉRICAS PARA DATOS (PRODUCTOS, CATEGORÍAS, ETC.)
// =================================================================

// Función genérica para obtener todos los documentos de una colección para un restaurante.
// Si restaurantId es 'all', obtiene los datos de todos los restaurantes.
async function getForRestaurant<T extends {id: string, restaurantId: string}>(collectionName: string, restaurantId: string): Promise<T[]> {
    if (restaurantId === 'all') {
        const collection = await getCollection<T>(collectionName);
        if (!collection) return handleNoDb([]);
        const snapshot = await collection.get();
        return snapshot.docs.map(doc => doc.data());
    } else {
        const collection = await getCollection<T>(collectionName);
        if (!collection) return handleNoDb([]);
        const snapshot = await collection.where('restaurantId', '==', restaurantId).get();
        return snapshot.docs.map(doc => doc.data());
    }
};

// Función genérica para añadir un nuevo documento a una colección.
async function addDoc<T extends {id: string}>(collectionPath: string, data: Omit<T, 'id'>): Promise<T> {
    const collection = await getCollection<T>(collectionPath);
    if (!collection) throw new Error('No se pudo añadir. La base de datos no está conectada.');
    const docRef = await collection.add(data as any);
    const newDoc = await docRef.get();
    if (!newDoc.exists) throw new Error("No se pudo crear el documento.");
    return newDoc.data()!;
}

// Función genérica para actualizar un documento existente.
async function updateDoc<T extends {id: string}>(collectionPath: string, id: string, data: Partial<Omit<T, 'id'>>): Promise<T> {
    const collection = await getCollection<T>(collectionPath);
    if (!collection) throw new Error('No se pudo actualizar. La base de datos no está conectada.');
    const docRef = collection.doc(id);
    await docRef.update(data);
    const updatedDoc = await docRef.get();
    if (!updatedDoc.exists) throw new Error("No se pudo actualizar el documento.");
    return updatedDoc.data()!;
}

// Función genérica para eliminar un documento.
async function deleteDoc(collectionPath: string, id: string): Promise<void> {
    const collection = await getCollection<any>(collectionPath);
    if (!collection) throw new Error('No se pudo eliminar. La base de datos no está conectada.');
    await collection.doc(id).delete();
}


// --- Exportaciones específicas por tipo de dato ---

// Productos
export async function getProductsForRestaurant(restaurantId: string): Promise<Product[]> { return getForRestaurant<Product>('products', restaurantId); }
export async function addProduct(data: Omit<Product, 'id'>): Promise<Product> { return addDoc<Product>('products', data); }
export async function updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'restaurantId'>>): Promise<Product> { return updateDoc<Product>('products', id, data); }
export async function deleteProduct(id: string): Promise<void> { return deleteDoc('products', id); }

// Categorías
export async function getCategoriesForRestaurant(restaurantId: string): Promise<Category[]> {
    if (restaurantId === 'all') {
        const collection = await getCollection<Category>('categories');
        if (!collection) return handleNoDb([]);
        const snapshot = await collection.get();
        if (snapshot.empty) return [];
        const uniqueCatNames = [...new Set(snapshot.docs.map(doc => doc.data().name))];
        return uniqueCatNames.map(name => ({ id: name, name, restaurantId: 'all' }));
    }
    return getForRestaurant<Category>('categories', restaurantId);
}
export async function addCategory(data: Omit<Category, 'id'>): Promise<Category> { return addDoc<Category>('categories', data); }
export async function updateCategory(id: string, data: Partial<Omit<Category, 'id' | 'restaurantId'>>): Promise<Category> { return updateDoc<Category>('categories', id, data); }
export async function deleteCategory(id: string): Promise<void> { return deleteDoc('categories', id); }

// Clientes
export async function getCustomersForRestaurant(restaurantId: string): Promise<Customer[]> { return getForRestaurant<Customer>('customers', restaurantId); }
export async function addCustomer(data: Omit<Customer, 'id'>): Promise<Customer> { return addDoc<Customer>('customers', data); }
export async function updateCustomer(id: string, data: Partial<Omit<Customer, 'id' | 'restaurantId'>>): Promise<Customer> { return updateDoc<Customer>('customers', id, data); }
export async function deleteCustomer(id: string): Promise<void> { return deleteDoc('customers', id); }

// Compras
export async function getPurchasesForRestaurant(restaurantId: string): Promise<Purchase[]> { return getForRestaurant<Purchase>('purchases', restaurantId); }
export async function addPurchase(data: Omit<Purchase, 'id'>): Promise<Purchase> { return addDoc<Purchase>('purchases', data); }
export async function updatePurchase(id: string, data: Partial<Omit<Purchase, 'id' | 'restaurantId'>>): Promise<Purchase> { return updateDoc<Purchase>('purchases', id, data); }
export async function deletePurchase(id: string): Promise<void> { return deleteDoc('purchases', id); }

// Ventas
export async function getSalesForRestaurant(restaurantId: string): Promise<Sale[]> { return getForRestaurant<Sale>('sales', restaurantId); }
export async function getSaleById(id: string): Promise<Sale | null> {
    const salesCollection = await getCollection<Sale>('sales');
    if (!salesCollection) return handleNoDb(null);
    const doc = await salesCollection.doc(id).get();
    return doc.exists ? doc.data()! : null;
}
export async function addSale(data: Omit<Sale, 'id'>): Promise<Sale> { return addDoc<Sale>('sales', data); }
export async function updateSale(id: string, data: Partial<Omit<Sale, 'id' | 'restaurantId'>>): Promise<Sale> { return updateDoc<Sale>('sales', id, data); }
export async function updateSaleStatus(id: string, status: 'paid' | 'pending'): Promise<Sale> { return updateDoc<Sale>('sales', id, { status }); }
export async function deleteSales(ids: string[]): Promise<void> {
    const admin = await initializeFirebaseAdmin();
    const salesCollection = await getCollection<Sale>('sales');
    if (!admin || !salesCollection) return;
    const db = admin.firestore();
    const batch = db.batch();
    ids.forEach(id => { batch.delete(salesCollection.doc(id)); });
    await batch.commit();
}
