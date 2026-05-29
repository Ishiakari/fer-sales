import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Linking, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { getDb } from '../database/db';
import { BackArrowIcon } from '../components/icons/Icons';
import { useCart } from '../context/CartContext';

export default function DeliveryDetails() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useCart();
  const cartData = Object.values(cart);
  const totalAmount = cartTotal;
  const totalItems = cartData.reduce((acc: number, item: any) => acc + item.quantity, 0);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyMapLink = () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter an address or landmark first.');
      return;
    }
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
  };

  const handleCompleteOrder = async () => {
    if (!customerName.trim() || !address.trim()) {
      Alert.alert('Validation Error', 'Name and Delivery Address are required.');
      return;
    }
    if (loading) return;
    setLoading(true);

    let orderId: number | null = null;

    try {
      const db = await getDb();

      // Use withTransactionSync — calls prepareSync, NOT prepareAsync.
      // This is the definitive fix for the Android NullPointerException.
      db.withTransactionSync(() => {
        // 1. Insert customer
        const custResult = db.runSync(
          'INSERT INTO customers (name, phone, address, latitude, longitude) VALUES (?, ?, ?, ?, ?)',
          [customerName.trim(), customerPhone.trim(), address.trim(), latitude, longitude]
        );
        const customerId = custResult.lastInsertRowId;

        // 2. Insert order
        const orderResult = db.runSync(
          'INSERT INTO orders (customer_id, total_amount, order_notes) VALUES (?, ?, ?)',
          [customerId, totalAmount, notes.trim()]
        );
        orderId = orderResult.lastInsertRowId;

        // 3. Insert each cart line item
        for (const item of cartData) {
          const oiResult = db.runSync(
            'INSERT INTO order_items (order_id, product_id, quantity, price_at_sale) VALUES (?, ?, ?, ?)',
            [orderId, item.product_id, item.quantity, item.price_at_sale]
          );
          
          const orderItemId = oiResult.lastInsertRowId;
          
          // 4. Insert modifiers for this order item
          if (item.selectedModifiers && item.selectedModifiers.length > 0) {
            for (const mod of item.selectedModifiers) {
              db.runSync(
                'INSERT INTO order_item_modifiers (order_item_id, modifier_id, price_at_sale) VALUES (?, ?, ?)',
                [orderItemId, mod.modifier_id, mod.extra_price]
              );
            }
          }
        }
      });

      // 4. Build and copy receipt to clipboard
      const receiptLink =
        latitude && longitude
          ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

      const receiptItems = cartData
        .map((item: any) => `  ${item.quantity}x ${item.name} — ₱${(item.quantity * item.price_at_sale).toFixed(2)}`)
        .join('\n');

      const orderNumStr = String(orderId).padStart(3, '0');
      const receiptText = [
        `🧾 FERSALES ORDER #${orderNumStr}`,
        '---------------------------',
        `Customer: ${customerName}`,
        `Phone: ${customerPhone || 'N/A'}`,
        `Delivery: ${address}`,
        '',
        '📦 ITEMS:',
        receiptItems,
        '---------------------------',
        `TOTAL: ₱${totalAmount.toFixed(2)}`,
        `Notes: ${notes || 'None'}`,
        '',
        '🗺️ DELIVERY PIN:',
        receiptLink,
      ].join('\n');

      await Clipboard.setStringAsync(receiptText);

      clearCart();
      Alert.alert(
        '✅ Order Saved!',
        'Receipt copied to clipboard — paste it in Messenger or SMS.',
        [{ text: 'Done', onPress: () => router.replace('/') }]
      );
    } catch (e) {
      console.error('Order save error:', e);
      Alert.alert('Error', 'Failed to save the order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <BackArrowIcon color={theme.colors.textDark} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Customer Details</Text>
            <Text style={styles.headerSubtitle}>Step 2 of 2</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{totalItems} item{totalItems !== 1 ? 's' : ''} in cart</Text>
            <Text style={styles.summaryTotal}>Total: ₱{totalAmount.toFixed(2)}</Text>
          </View>

          <View style={styles.formBlock}>
            <Text style={styles.label}>Customer Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Maria Santos" placeholderTextColor="#9B8C82" value={customerName} onChangeText={setCustomerName} />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} placeholder="e.g. 09XX-XXX-XXXX" placeholderTextColor="#9B8C82" keyboardType="phone-pad" value={customerPhone} onChangeText={setCustomerPhone} />

            <Text style={styles.label}>Delivery Address</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="e.g. 12 Sampaguita St., Brgy. San Jose" placeholderTextColor="#9B8C82" multiline numberOfLines={3} value={address} onChangeText={setAddress} />

            <View style={styles.mapActionsContainer}>
              <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyMapLink}>
                <Text style={styles.verifyBtnText}>🔍 Verify Map Link</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Order Notes (Optional)</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="e.g. Less sugar, extra hot..." placeholderTextColor="#9B8C82" multiline numberOfLines={2} value={notes} onChangeText={setNotes} />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={[styles.completeBtn, loading && { opacity: 0.6 }]} onPress={handleCompleteOrder} activeOpacity={0.8} disabled={loading}>
            <Text style={styles.completeBtnText}>{loading ? 'Saving...' : 'Complete Order & Copy Receipt'}</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.backgroundCream },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.lg, paddingTop: theme.spacing.xl, gap: theme.spacing.md },
  backButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: theme.colors.cardIvory, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.borderLight },
  headerTitle: { fontSize: 24, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.textDark },
  headerSubtitle: { fontSize: theme.typography.fontSize.small, color: theme.colors.textGray, marginTop: 2 },
  scrollContent: { padding: theme.spacing.lg },
  summaryCard: { backgroundColor: '#F3E5D8', padding: theme.spacing.lg, borderRadius: 24, marginBottom: theme.spacing.xl },
  summaryTitle: { color: theme.colors.textGray, fontSize: 15, marginBottom: theme.spacing.xs },
  summaryTotal: { color: theme.colors.textDark, fontSize: 26, fontWeight: theme.typography.fontWeight.bold },
  formBlock: { gap: theme.spacing.xs },
  label: { fontSize: 16, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.textDark, marginTop: theme.spacing.md, marginBottom: theme.spacing.xs, marginLeft: theme.spacing.xs },
  input: { backgroundColor: '#FAEEE4', borderWidth: 1, borderColor: '#EBDDD1', borderRadius: 24, padding: theme.spacing.lg, fontSize: 17, color: theme.colors.textDark },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  mapActionsContainer: { alignItems: 'flex-start', marginTop: theme.spacing.sm, marginLeft: theme.spacing.xs },
  verifyBtn: { backgroundColor: theme.colors.primaryOrange, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.borderRadius.pill },
  verifyBtnText: { color: theme.colors.cardIvory, fontSize: theme.typography.fontSize.small, fontWeight: theme.typography.fontWeight.bold },
  bottomBar: { backgroundColor: theme.colors.backgroundCream, padding: theme.spacing.lg, paddingBottom: 40 },
  completeBtn: { backgroundColor: theme.colors.activeGreen, paddingVertical: 18, borderRadius: theme.borderRadius.pill, alignItems: 'center' },
  completeBtnText: { color: theme.colors.cardIvory, fontSize: 18, fontWeight: theme.typography.fontWeight.bold },
});
