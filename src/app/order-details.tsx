import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { theme } from '../constants/theme';
import { getDb } from '../database/db';
import { BackArrowIcon } from '../components/icons/Icons';

export default function OrderDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    try {
      const db = getDb().then(db => {
        const orderData = db.getFirstSync<any>('SELECT * FROM orders WHERE order_id = ?', [id]);
        setOrder(orderData);
        
        if (orderData?.customer_id) {
          const customerData = db.getFirstSync<any>('SELECT * FROM customers WHERE customer_id = ?', [orderData.customer_id]);
          setCustomer(customerData);
        }

        const itemsData = db.getAllSync<any>(`
          SELECT oi.*, p.name 
          FROM order_items oi
          JOIN products p ON oi.product_id = p.product_id
          WHERE oi.order_id = ?
        `, [id]);
        setItems(itemsData);
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to load order details');
    }
  }, [id]);

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <BackArrowIcon color={theme.colors.textDark} />
          </TouchableOpacity>
        </View>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const orderNumStr = String(order.order_id).padStart(3, '0');
  const dateObj = new Date(order.created_at + 'Z');
  const formattedDate = dateObj.toLocaleString('en-US', { 
    weekday: 'short', month: 'short', day: 'numeric', 
    hour: 'numeric', minute: '2-digit' 
  });

  const handleCopyReceipt = async () => {
    const receiptItems = items
      .map((item: any) => `  ${item.quantity}x ${item.name} — ₱${(item.quantity * item.price_at_sale).toFixed(2)}`)
      .join('\n');

    const receiptLink =
      customer?.latitude && customer?.longitude
        ? `https://www.google.com/maps/search/?api=1&query=${customer.latitude},${customer.longitude}`
        : customer?.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}` : 'No address provided';

    const receiptText = [
      `🧾 FERSALES ORDER #${orderNumStr}`,
      '---------------------------',
      `Customer: ${customer?.name || 'N/A'}`,
      `Phone: ${customer?.phone || 'N/A'}`,
      `Delivery: ${customer?.address || 'N/A'}`,
      '',
      '📦 ITEMS:',
      receiptItems,
      '---------------------------',
      `TOTAL: ₱${order.total_amount.toFixed(2)}`,
      `Notes: ${order.order_notes || 'None'}`,
      '',
      '🗺️ DELIVERY PIN:',
      receiptLink,
    ].join('\n');

    await Clipboard.setStringAsync(receiptText);
    Alert.alert('Copied!', 'Receipt copied to clipboard.');
  };

  const handleOpenMap = () => {
    if (!customer?.address) return;
    const url = customer?.latitude && customer?.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${customer.latitude},${customer.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <BackArrowIcon color={theme.colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{orderNumStr}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <Text style={styles.totalText}>Total: ₱{order.total_amount.toFixed(2)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <View style={styles.card}>
            <Text style={styles.detailText} selectable={true}><Text style={styles.bold}>Name:</Text> {customer?.name || 'N/A'}</Text>
            <Text style={styles.detailText} selectable={true}><Text style={styles.bold}>Phone:</Text> {customer?.phone || 'N/A'}</Text>
            <Text style={styles.detailText} selectable={true}><Text style={styles.bold}>Address:</Text> {customer?.address || 'N/A'}</Text>
            {customer?.address && (
              <TouchableOpacity style={styles.mapButton} onPress={handleOpenMap}>
                <Text style={styles.mapButtonText}>Open in Google Maps</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <View style={styles.card}>
            {items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.quantity}x {item.name}</Text>
                <Text style={styles.itemPrice}>₱{(item.quantity * item.price_at_sale).toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <Text style={styles.detailText} selectable={true}><Text style={styles.bold}>Notes:</Text> {order.order_notes || 'None'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={handleCopyReceipt}>
          <Text style={styles.actionButtonText}>Copy Receipt</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.backgroundCream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  backButton: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: theme.colors.cardIvory,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: theme.colors.borderLight,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: theme.colors.textGray,
  },
  scrollContent: { padding: theme.spacing.lg },
  card: {
    backgroundColor: theme.colors.cardIvory,
    padding: theme.spacing.lg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2D5C8',
    marginBottom: theme.spacing.md,
  },
  dateText: { fontSize: 14, color: theme.colors.textGray, marginBottom: 8 },
  totalText: { fontSize: 32, fontWeight: theme.typography.fontWeight.black, color: theme.colors.textDark },
  section: { marginTop: theme.spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.textDark, marginBottom: theme.spacing.sm, marginLeft: 8 },
  detailText: { fontSize: 16, color: theme.colors.textDark, marginBottom: 8 },
  bold: { fontWeight: theme.typography.fontWeight.bold },
  mapButton: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.paleOrange,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  mapButtonText: {
    color: theme.colors.primaryOrange,
    fontWeight: theme.typography.fontWeight.bold,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: { fontSize: 16, color: theme.colors.textDark, flex: 1 },
  itemPrice: { fontSize: 16, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.textDark },
  divider: { height: 1, backgroundColor: theme.colors.borderLight, marginVertical: 12 },
  actionButton: {
    backgroundColor: theme.colors.primaryOrange,
    padding: 18,
    borderRadius: theme.borderRadius.pill,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  actionButtonText: {
    color: theme.colors.cardIvory,
    fontSize: 18,
    fontWeight: theme.typography.fontWeight.bold,
  },
});
