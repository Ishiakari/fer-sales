import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { getDb } from '../database/db';
import { BackArrowIcon, PlusIcon, MinusIcon } from '../components/icons/Icons';
import { useCart } from '../context/CartContext';

export default function NewOrder() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const { cart, setCart, cartTotal, generateCartKey } = useCart();

  useEffect(() => {
    async function loadData() {
      try {
        const db = await getDb();
        // Use sync reads — avoids NativeDatabase.prepareAsync NPE on Android
        const cats = db.getAllSync<any>('SELECT * FROM categories ORDER BY category_name');
        setCategories(cats);

        const prods = db.getAllSync<any>('SELECT * FROM products');
        setProducts(prods);
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    if (activeCategoryId === 'all') return products;
    return products.filter(p => p.category_id === activeCategoryId);
  }, [products, activeCategoryId]);

  const updateQuantity = (product: any, delta: number) => {
    // We haven't built the UI for selecting modifiers yet, so we pass an empty array for now.
    const cartKey = generateCartKey(product.product_id, []);
    
    setCart(prev => {
      const currentQty = prev[cartKey]?.quantity || 0;
      const newQty = Math.max(0, currentQty + delta);
      
      if (newQty === 0) {
        const newCart = { ...prev };
        delete newCart[cartKey];
        return newCart;
      }
      
      return {
        ...prev,
        [cartKey]: {
          ...product,
          quantity: newQty,
          price_at_sale: product.price, // Lock in price at selection
          cart_key: cartKey,
          selectedModifiers: [] // Prepared for future UI
        }
      };
    });
  };

  const handleCheckout = () => {
    if (Object.keys(cart).length === 0) return;
    router.push("/delivery-details");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <BackArrowIcon color={theme.colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Order</Text>
        </View>

        {/* Categories Filter Tabs */}
        <View style={styles.categoriesContainer}>
          <TouchableOpacity
            style={[
              styles.categoryTab,
              activeCategoryId === 'all' && styles.activeCategoryTab
            ]}
            onPress={() => setActiveCategoryId('all')}
          >
            <Text style={[
              styles.categoryText,
              activeCategoryId === 'all' && styles.activeCategoryText
            ]}>All</Text>
          </TouchableOpacity>
          
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.category_id}
              style={[
                styles.categoryTab,
                activeCategoryId === cat.category_id && styles.activeCategoryTab
              ]}
              onPress={() => setActiveCategoryId(cat.category_id)}
            >
              <Text style={[
                styles.categoryText,
                activeCategoryId === cat.category_id && styles.activeCategoryText
              ]}>
                {cat.category_name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transaction Grid */}
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.product_id.toString()}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => {
            // Compute cart key without modifiers for the base catalog listing qty display
            const baseCartKey = generateCartKey(item.product_id, []);
            const qty = cart[baseCartKey]?.quantity || 0;
            return (
              <View style={styles.productCard}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.productPrice}>₱{item.price}</Text>
                </View>
                
                <View style={styles.counterEngine}>
                  <TouchableOpacity 
                    style={styles.minusBtn} 
                    onPress={() => updateQuantity(item, -1)}
                  >
                    <MinusIcon color={theme.colors.primaryOrange} size={20} />
                  </TouchableOpacity>
                  
                  <Text style={styles.quantityText}>{qty}</Text>
                  
                  <TouchableOpacity 
                    style={styles.plusBtn} 
                    onPress={() => updateQuantity(item, 1)}
                  >
                    <PlusIcon color={theme.colors.cardIvory} size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />

        {/* Bottom Math Compilation Matrix */}
        <View style={styles.bottomBar}>
          <View style={styles.totalMatrix}>
            <Text style={styles.totalLabel}>Running Total</Text>
            <Text style={styles.totalValue}>₱{cartTotal}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.checkoutBtn, cartTotal === 0 && styles.checkoutBtnDisabled]} 
            onPress={handleCheckout}
            disabled={cartTotal === 0}
            activeOpacity={0.8}
          >
            <Text style={styles.checkoutBtnText}>Proceed to Delivery Details</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.backgroundCream,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.cardIvory,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
  },
  categoriesContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryTab: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.cardIvory,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  activeCategoryTab: {
    backgroundColor: theme.colors.primaryOrange,
    borderColor: theme.colors.primaryOrange,
  },
  categoryText: {
    fontSize: theme.typography.fontSize.body,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textGray,
  },
  activeCategoryText: {
    color: theme.colors.cardIvory,
  },
  gridContainer: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  gridRow: {
    gap: theme.spacing.md,
  },
  productCard: {
    flex: 1,
    backgroundColor: theme.colors.cardIvory,
    padding: theme.spacing.md,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2D5C8',
    justifyContent: 'space-between',
    minHeight: 180,
  },
  productInfo: {
    marginBottom: theme.spacing.md,
  },
  productName: {
    fontSize: 16,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.xs,
  },
  productPrice: {
    fontSize: theme.typography.fontSize.h3,
    color: theme.colors.primaryOrange,
    fontWeight: theme.typography.fontWeight.bold,
  },
  counterEngine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: theme.spacing.xs,
  },
  minusBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FCDCD3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primaryOrange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 22,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
  },
  bottomBar: {
    backgroundColor: theme.colors.backgroundCream,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    paddingBottom: 40, // accommodate safe area bottom
  },
  totalMatrix: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  totalLabel: {
    color: theme.colors.textGray,
    fontSize: theme.typography.fontSize.body,
    fontWeight: theme.typography.fontWeight.bold,
  },
  totalValue: {
    color: theme.colors.textDark,
    fontSize: 42,
    fontWeight: theme.typography.fontWeight.black,
  },
  checkoutBtn: {
    backgroundColor: theme.colors.activeGreen,
    paddingVertical: 18,
    borderRadius: theme.borderRadius.pill,
    alignItems: 'center',
  },
  checkoutBtnDisabled: {
    backgroundColor: theme.colors.textGray,
    opacity: 0.5,
  },
  checkoutBtnText: {
    color: theme.colors.cardIvory,
    fontSize: theme.typography.fontSize.body,
    fontWeight: theme.typography.fontWeight.bold,
  },
});
