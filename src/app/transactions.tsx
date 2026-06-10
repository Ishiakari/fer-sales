import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { theme } from '../constants/theme';
import { getDb } from '../database/db';
import { BackArrowIcon } from '../components/icons/Icons';

export default function Transactions() {
  const router = useRouter();
  const { filter } = useLocalSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [totalSales, setTotalSales] = useState(0);

  const loadData = async () => {
    try {
      const db = await getDb();
      let dateCondition = "date(created_at) = date('now', 'localtime')";
      
      if (filter === 'week') {
        dateCondition = "created_at >= datetime('now', 'localtime', '-7 days')";
      } else if (filter === 'month') {
        dateCondition = "strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')";
      } else if (filter === 'year') {
        dateCondition = "strftime('%Y', created_at) = strftime('%Y', 'now', 'localtime')";
      }

      const query = db.getAllSync<any>(`
        SELECT o.order_id, o.total_amount, o.created_at, 
               (SELECT GROUP_CONCAT(p.name || ' x' || oi.quantity, ', ') 
                FROM order_items oi 
                JOIN products p ON oi.product_id = p.product_id 
                WHERE oi.order_id = o.order_id) as items_summary
        FROM orders o
        WHERE ${dateCondition}
        ORDER BY o.created_at DESC
      `);
      setOrders(query);
      setTotalSales(query.reduce((sum, o) => sum + o.total_amount, 0));
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [filter])
  );

  const getTitle = () => {
    if (filter === 'week') return "Last 7 Days";
    if (filter === 'month') return "This Month";
    if (filter === 'year') return "This Year";
    return "Today";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <BackArrowIcon color={theme.colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getTitle()} Transactions</Text>
      </View>

      <View style={styles.metricsHeader}>
        <Text style={styles.metricsLabel}>Total Sales</Text>
        <Text style={styles.metricsValue}>₱{totalSales.toLocaleString('en-US')}</Text>
        <Text style={styles.metricsCount}>{orders.length} orders found</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.order_id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const dateObj = new Date(item.created_at + 'Z');
          const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const timeStr = dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          const orderNum = item.order_id.toString().padStart(3, '0');
          
          return (
            <TouchableOpacity 
              style={styles.logItem}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/order-details', params: { id: item.order_id } })}
            >
              <View style={styles.logItemLeft}>
                <View style={styles.logItemHeader}>
                  <Text style={styles.logItemOrderNum}>Order #{orderNum}</Text>
                  <Text style={styles.logItemTime}>{dateStr}, {timeStr}</Text>
                </View>
                <Text style={styles.logItemSummary} numberOfLines={1}>
                  {item.items_summary || 'No items'}
                </Text>
              </View>
              <Text style={styles.logItemAmount}>₱{item.total_amount}</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyLog}>No transactions found for this period.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.backgroundCream,
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
    fontSize: 24,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
  },
  metricsHeader: {
    padding: theme.spacing.lg,
    backgroundColor: '#FAEEE4',
    marginHorizontal: theme.spacing.lg,
    borderRadius: 24,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  metricsLabel: {
    fontSize: 14,
    color: theme.colors.textGray,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: 4,
  },
  metricsValue: {
    fontSize: 36,
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.primaryOrange,
  },
  metricsCount: {
    fontSize: 14,
    color: theme.colors.textGray,
    marginTop: 4,
  },
  listContainer: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.cardIvory,
    padding: theme.spacing.lg,
    borderRadius: 24,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E2D5C8',
  },
  logItemLeft: {
    flex: 1,
  },
  logItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  logItemOrderNum: {
    fontSize: theme.typography.fontSize.body,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
  },
  logItemTime: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textGray,
  },
  logItemSummary: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textGray,
  },
  logItemAmount: {
    fontSize: theme.typography.fontSize.h3,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primaryOrange,
    marginLeft: theme.spacing.md,
  },
  emptyLog: {
    color: theme.colors.textGray,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
});
