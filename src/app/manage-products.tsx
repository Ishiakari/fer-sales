import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { getDb } from '../database/db';
import { BackArrowIcon, MinusIcon } from '../components/icons/Icons';

export default function ManageProducts() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setProdName('');
    setProdPrice('');
    if (categories.length > 0) setSelectedCatId(categories[0].category_id);
  };

  const handleEditProduct = (p: any) => {
    setEditingProductId(p.product_id);
    setProdName(p.name);
    setProdPrice(p.price.toString());
    setSelectedCatId(p.category_id);
  };

  const handleCategoryLongPress = (cat: any) => {
    Alert.alert('Manage Category', `What would you like to do with "${cat.category_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit Name', onPress: () => {
          setEditingCategoryId(cat.category_id);
          setNewCatName(cat.category_name);
        }
      },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const db = await getDb();
            db.runSync('DELETE FROM categories WHERE category_id = ?', [cat.category_id]);
            loadData();
          } catch(e) {
            Alert.alert('Error', 'Cannot delete a category that contains products. Delete the products first.');
          }
        }
      }
    ]);
  };

  const loadData = async () => {
    try {
      const db = await getDb();
      // Use synchronous reads — no prepareAsync, no NPE.
      const cats = db.getAllSync<any>('SELECT * FROM categories ORDER BY category_name');
      setCategories(cats);

      const prods = db.getAllSync<any>(`
        SELECT p.*, c.category_name 
        FROM products p 
        JOIN categories c ON p.category_id = c.category_id
        ORDER BY p.name
      `);
      setProducts(prods);

      if (cats.length > 0 && !selectedCatId) {
        setSelectedCatId(cats[0].category_id);
      }
    } catch (e) {
      console.error('loadData error:', e);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return Alert.alert('Error', 'Category name cannot be empty.');
    try {
      const db = await getDb();
      if (editingCategoryId) {
        db.runSync('UPDATE categories SET category_name = ? WHERE category_id = ?', [newCatName.trim(), editingCategoryId]);
        setEditingCategoryId(null);
      } else {
        db.runSync('INSERT INTO categories (category_name) VALUES (?)', [newCatName.trim()]);
      }
      setNewCatName('');
      loadData();
    } catch (e) {
      Alert.alert('Error', 'That category name might already exist.');
    }
  };

  const handleAddProduct = async () => {
    if (!prodName.trim() || !prodPrice.trim() || !selectedCatId) {
      return Alert.alert('Error', 'Please fill in all product fields and select a category.');
    }
    const priceNum = parseFloat(prodPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      return Alert.alert('Error', 'Price must be a valid number greater than 0.');
    }
    try {
      const db = await getDb();
      if (editingProductId) {
        db.runSync(
          'UPDATE products SET name = ?, price = ?, category_id = ? WHERE product_id = ?',
          [prodName.trim(), priceNum, selectedCatId, editingProductId]
        );
      } else {
        db.runSync(
          'INSERT INTO products (name, price, category_id) VALUES (?, ?, ?)',
          [prodName.trim(), priceNum, selectedCatId]
        );
      }
      handleCancelEdit();
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to save product.');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    Alert.alert('Delete Product', 'Remove this item from the menu?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const db = await getDb();
            db.runSync('DELETE FROM products WHERE product_id = ?', [id]);
            loadData();
          } catch (e) {
            Alert.alert('Error', 'Cannot delete — this product is linked to existing orders.');
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <BackArrowIcon color={theme.colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Inventory</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Add/Edit Category */}
          <View style={styles.sectionBlock}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                1. {editingCategoryId ? "Edit Category" : "Add a New Category"}
              </Text>
              {editingCategoryId && (
                <TouchableOpacity onPress={() => { setEditingCategoryId(null); setNewCatName(''); }}>
                  <Text style={{ color: theme.colors.dangerRed, fontWeight: theme.typography.fontWeight.bold }}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.inputRow}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="e.g. Desserts" placeholderTextColor="#9B8C82" value={newCatName} onChangeText={setNewCatName} />
              <TouchableOpacity style={styles.addBtn} onPress={handleAddCategory}>
                <Text style={styles.addBtnText}>{editingCategoryId ? "Update" : "+ Add"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Add/Edit Product */}
          <View style={styles.sectionBlock}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                {editingProductId ? "2. Edit Product" : "2. Add a New Product"}
              </Text>
              {editingProductId && (
                <TouchableOpacity onPress={handleCancelEdit}>
                  <Text style={{ color: theme.colors.dangerRed, fontWeight: theme.typography.fontWeight.bold }}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.label}>Select Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.category_id}
                  style={[styles.categoryTab, selectedCatId === cat.category_id && styles.activeCategoryTab]}
                  onPress={() => setSelectedCatId(cat.category_id)}
                  onLongPress={() => handleCategoryLongPress(cat)}
                  delayLongPress={300}
                >
                  <Text style={[styles.categoryText, selectedCatId === cat.category_id && styles.activeCategoryText]}>
                    {cat.category_name}
                  </Text>
                </TouchableOpacity>
              ))}
              {categories.length === 0 && <Text style={{ color: theme.colors.textGray }}>Add a category first.</Text>}
            </ScrollView>

            <Text style={styles.label}>Product Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Mango Graham" placeholderTextColor="#9B8C82" value={prodName} onChangeText={setProdName} />

            <Text style={styles.label}>Price (₱)</Text>
            <TextInput style={styles.input} placeholder="e.g. 120" placeholderTextColor="#9B8C82" keyboardType="numeric" value={prodPrice} onChangeText={setProdPrice} />

            <TouchableOpacity style={[styles.saveBtn, categories.length === 0 && { opacity: 0.5 }]} onPress={handleAddProduct} disabled={categories.length === 0}>
              <Text style={styles.saveBtnText}>{editingProductId ? "Update Product" : "Save Product"}</Text>
            </TouchableOpacity>
          </View>

          {/* Products List */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Current Menu</Text>
            {products.length === 0
              ? <Text style={{ color: theme.colors.textGray, marginTop: theme.spacing.sm }}>Your inventory is empty.</Text>
              : products.map(p => (
                <TouchableOpacity 
                  key={p.product_id} 
                  style={[styles.productCard, editingProductId === p.product_id && { borderColor: theme.colors.primaryOrange, borderWidth: 2 }]} 
                  onPress={() => handleEditProduct(p)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{p.name}</Text>
                    <Text style={styles.productMeta}>{p.category_name} · ₱{p.price}</Text>
                  </View>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteProduct(p.product_id)}>
                    <MinusIcon color={theme.colors.cardIvory} size={18} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            }
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.backgroundCream },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.lg, paddingTop: theme.spacing.xl, gap: theme.spacing.md },
  backButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: theme.colors.cardIvory, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.borderLight },
  headerTitle: { fontSize: 26, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.textDark },
  scrollContent: { padding: theme.spacing.lg },
  sectionBlock: { backgroundColor: '#F3E5D8', padding: theme.spacing.lg, borderRadius: 24, marginBottom: theme.spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.textDark, marginBottom: theme.spacing.md },
  inputRow: { flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'center' },
  input: { backgroundColor: '#FAEEE4', borderWidth: 1, borderColor: '#EBDDD1', borderRadius: 24, padding: theme.spacing.lg, fontSize: 16, color: theme.colors.textDark },
  addBtn: { backgroundColor: theme.colors.primaryOrange, paddingVertical: 18, paddingHorizontal: 20, borderRadius: 24, justifyContent: 'center' },
  addBtnText: { color: theme.colors.cardIvory, fontWeight: theme.typography.fontWeight.bold, fontSize: 16 },
  label: { fontSize: 14, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.textGray, marginTop: theme.spacing.sm, marginBottom: theme.spacing.xs, marginLeft: theme.spacing.xs },
  categoriesContainer: { gap: theme.spacing.sm, paddingBottom: theme.spacing.sm },
  categoryTab: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: theme.borderRadius.pill, backgroundColor: theme.colors.cardIvory, borderWidth: 1, borderColor: theme.colors.borderLight },
  activeCategoryTab: { backgroundColor: theme.colors.primaryOrange, borderColor: theme.colors.primaryOrange },
  categoryText: { fontSize: theme.typography.fontSize.small, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.textGray },
  activeCategoryText: { color: theme.colors.cardIvory },
  saveBtn: { backgroundColor: theme.colors.activeGreen, paddingVertical: 16, borderRadius: theme.borderRadius.pill, alignItems: 'center', marginTop: theme.spacing.md },
  saveBtnText: { color: theme.colors.cardIvory, fontSize: 16, fontWeight: theme.typography.fontWeight.bold },
  productCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.cardIvory, padding: theme.spacing.md, borderRadius: 16, marginBottom: theme.spacing.sm },
  productName: { fontSize: 16, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.textDark },
  productMeta: { fontSize: 14, color: theme.colors.textGray, marginTop: 2 },
  deleteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.dangerRed, justifyContent: 'center', alignItems: 'center' },
});
