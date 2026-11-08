"use client";

import { useState, useEffect, useCallback } from "react";
import { IProduct } from "@/services/storeService";
import { toast } from "sonner";

export interface CartItem {
  product: IProduct;
  quantity: number;
}

export interface CartMap {
  [productId: string]: CartItem;
}

const CART_STORAGE_KEY = "lms_material_stock_cart";

export function useCart() {
  const [cart, setCart] = useState<CartMap>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse cart from localStorage:", e);
    } finally {
      setIsLoaded(true);
    }

    const handleSync = () => {
      try {
        const updated = localStorage.getItem(CART_STORAGE_KEY);
        setCart(updated ? JSON.parse(updated) : {});
      } catch (err) {
        console.error("Cart sync error:", err);
      }
    };

    window.addEventListener("lms-cart-update", handleSync);
    window.addEventListener("storage", handleSync);

    return () => {
      window.removeEventListener("lms-cart-update", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const addToCart = useCallback((product: IProduct, qty = 1) => {
    setCart((prev) => {
      const existing = prev[product._id];
      const newQty = (existing ? existing.quantity : 0) + qty;
      if (newQty > product.inventory_count) {
        toast.error(`Only ${product.inventory_count} items available in stock`);
        return prev;
      }
      const updated: CartMap = {
        ...prev,
        [product._id]: { product, quantity: newQty },
      };
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event("lms-cart-update"));
      } catch (e) {}
      return updated;
    });
  }, []);

  const updateCartQty = useCallback((productId: string, delta: number) => {
    setCart((prev) => {
      const item = prev[productId];
      if (!item) return prev;
      const newQty = item.quantity + delta;
      const updated = { ...prev };
      if (newQty <= 0) {
        delete updated[productId];
      } else {
        if (newQty > item.product.inventory_count) {
          toast.error(
            `Maximum available stock reached (${item.product.inventory_count})`
          );
          return prev;
        }
        updated[productId] = { ...item, quantity: newQty };
      }
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event("lms-cart-update"));
      } catch (e) {}
      return updated;
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => {
      const updated = { ...prev };
      delete updated[productId];
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event("lms-cart-update"));
      } catch (e) {}
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart({});
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      window.dispatchEvent(new Event("lms-cart-update"));
    } catch (e) {}
  }, []);

  const cartItems = Object.values(cart);
  const totalItems = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalAmount = cartItems.reduce(
    (acc, curr) => acc + curr.product.price * curr.quantity,
    0
  );

  return {
    cart,
    cartItems,
    totalItems,
    totalAmount,
    isLoaded,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
  };
}
