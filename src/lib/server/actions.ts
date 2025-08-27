
'use server';

import * as db from './db';
import type { Restaurant, User, Product, Category, Customer, Purchase, Sale } from '@/types';

// =================================================================
// RESTAURANT ACTIONS
// =================================================================

export async function getAllRestaurantsWithUsers(): Promise<Restaurant[]> {
    return db.getAllRestaurantsWithUsers();
}

export async function getRestaurantById(id: string): Promise<Restaurant | null> {
    return db.getRestaurantById(id);
}

export async function createRestaurant(restaurantData: Omit<Restaurant, 'id' | 'users'>, adminData: Omit<User, 'id' | 'role' | 'restaurantId'>): Promise<Restaurant> {
    return db.createRestaurant(restaurantData, adminData);
}

export async function updateRestaurant(id: string, restaurantData: Partial<Omit<Restaurant, 'id' | 'users'>>, adminData?: {id: string, email: string, password?: string}): Promise<Restaurant> {
    return db.updateRestaurant(id, restaurantData, adminData);
}

export async function deleteRestaurant(id: string): Promise<void> {
    return db.deleteRestaurant(id);
}


// =================================================================
// USER ACTIONS
// =================================================================
export async function addUser(userData: Omit<User, 'id'>): Promise<User> {
    return db.addUser(userData);
}

export async function updateUser(id: string, userData: Partial<Omit<User, 'id'>>): Promise<User> {
    return db.updateUser(id, userData);
}

export async function deleteUser(id: string, currentUserId: string): Promise<void> {
    return db.deleteUser(id, currentUserId);
}


// =================================================================
// PRODUCT ACTIONS
// =================================================================
export async function getProductsForRestaurant(restaurantId: string): Promise<Product[]> {
    return db.getProductsForRestaurant(restaurantId);
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    return db.addProduct(product);
}

export async function updateProduct(id: string, product: Partial<Omit<Product, 'id' | 'restaurantId'>>): Promise<Product> {
    return db.updateProduct(id, product);
}

export async function deleteProduct(id: string): Promise<void> {
    return db.deleteProduct(id);
}

// =================================================================
// CATEGORY ACTIONS
// =================================================================
export async function getCategoriesForRestaurant(restaurantId: string): Promise<Category[]> {
    return db.getCategoriesForRestaurant(restaurantId);
}

export async function addCategory(category: Omit<Category, 'id'>): Promise<Category> {
    return db.addCategory(category);
}

export async function updateCategory(id: string, category: Partial<Omit<Category, 'id' | 'restaurantId'>>): Promise<Category> {
    return db.updateCategory(id, category);
}

export async function deleteCategory(id: string): Promise<void> {
    return db.deleteCategory(id);
}

// =================================================================
// CUSTOMER ACTIONS
// =================================================================
export async function getCustomersForRestaurant(restaurantId: string): Promise<Customer[]> {
    return db.getCustomersForRestaurant(restaurantId);
}

export async function addCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    return db.addCustomer(customer);
}

export async function updateCustomer(id: string, customer: Partial<Omit<Customer, 'id' | 'restaurantId'>>): Promise<Customer> {
    return db.updateCustomer(id, customer);
}

export async function deleteCustomer(id: string): Promise<void> {
    return db.deleteCustomer(id);
}

// =================================================================
// PURCHASE ACTIONS
// =================================================================
export async function getPurchasesForRestaurant(restaurantId: string): Promise<Purchase[]> {
    return db.getPurchasesForRestaurant(restaurantId);
}

export async function addPurchase(purchase: Omit<Purchase, 'id'>): Promise<Purchase> {
    return db.addPurchase(purchase);
}

export async function updatePurchase(id: string, purchase: Partial<Omit<Purchase, 'id' | 'restaurantId'>>): Promise<Purchase> {
    return db.updatePurchase(id, purchase);
}

export async function deletePurchase(id: string): Promise<void> {
    return db.deletePurchase(id);
}

// =================================================================
// SALE ACTIONS
// =================================================================
export async function getSalesForRestaurant(restaurantId: string): Promise<Sale[]> {
    return db.getSalesForRestaurant(restaurantId);
}

export async function getSaleById(id: string): Promise<Sale | null> {
    return db.getSaleById(id);
}

export async function addSale(sale: Omit<Sale, 'id'>): Promise<Sale> {
    return db.addSale(sale);
}

export async function updateSale(id: string, sale: Partial<Omit<Sale, 'id' | 'restaurantId'>>): Promise<Sale> {
    return db.updateSale(id, sale);
}

export async function updateSaleStatus(id: string, status: 'paid' | 'pending'): Promise<Sale> {
    return db.updateSaleStatus(id, status);
}

export async function deleteSales(ids: string[]): Promise<void> {
    return db.deleteSales(ids);
}
