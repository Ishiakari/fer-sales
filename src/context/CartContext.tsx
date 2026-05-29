import React, { createContext, useContext, useState, useMemo } from 'react';

export type Modifier = {
  modifier_id: number;
  product_id: number;
  name: string;
  extra_price: number;
  type: string;
};

export type CartItem = {
  product_id: number;
  name: string;
  price: number;
  category_id: number;
  quantity: number;
  price_at_sale: number;
  cart_key: string;
  selectedModifiers: Modifier[];
};

export type CartState = {
  [cartKey: string]: CartItem;
};

type CartContextType = {
  cart: CartState;
  setCart: React.Dispatch<React.SetStateAction<CartState>>;
  cartTotal: number;
  clearCart: () => void;
  generateCartKey: (productId: number, modifiers: Modifier[]) => string;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartState>({});

  const cartTotal = useMemo(() => {
    return Object.values(cart).reduce((total, item) => {
      const modifiersTotal = item.selectedModifiers?.reduce((sum, mod) => sum + mod.extra_price, 0) || 0;
      return total + (item.quantity * (item.price_at_sale + modifiersTotal));
    }, 0);
  }, [cart]);

  const clearCart = () => setCart({});

  const generateCartKey = (productId: number, modifiers: Modifier[]) => {
    if (!modifiers || modifiers.length === 0) return String(productId);
    
    const flavor = modifiers.find(m => m.type === 'flavor')?.modifier_id || 'none';
    const addonsHash = modifiers
      .filter(m => m.type === 'add_on')
      .map(m => m.modifier_id)
      .sort()
      .join(',');

    return `${productId}-${flavor}-${addonsHash}`;
  };

  return (
    <CartContext.Provider value={{ cart, setCart, cartTotal, clearCart, generateCartKey }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
