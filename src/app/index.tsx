import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { theme } from '../constants/theme';
import { getDb } from '../database/db';
import { useFocusEffect } from 'expo-router';
import { PlusIcon, GridIcon } from '../components/icons/Icons';


export default function Dashboard() {
  const router = useRouter();
  const [totalSales, setTotalSales] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'year'>('today');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = async () => {
    try {
      const db = await getDb();
      
      let dateCondition = "date(created_at) = date('now', 'localtime')";
      if (timeFilter === 'week') {
        dateCondition = "created_at >= datetime('now', 'localtime', '-7 days')";
      } else if (timeFilter === 'month') {
        dateCondition = "strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')";
      } else if (timeFilter === 'year') {
        dateCondition = "strftime('%Y', created_at) = strftime('%Y', 'now', 'localtime')";
      }

      const salesQuery = db.getFirstSync<any>(
        `SELECT SUM(total_amount) as total, COUNT(*) as count FROM orders WHERE ${dateCondition}`
      );
      setTotalSales(salesQuery?.total || 0);
      setTotalOrders(salesQuery?.count || 0);

      const ordersQuery = db.getAllSync<any>(`
        SELECT o.order_id, o.total_amount, o.created_at, 
               (SELECT GROUP_CONCAT(p.name || ' x' || oi.quantity, ', ') 
                FROM order_items oi 
                JOIN products p ON oi.product_id = p.product_id 
                WHERE oi.order_id = o.order_id) as items_summary
        FROM orders o
        ORDER BY o.created_at DESC
        LIMIT 3
      `);
      setRecentOrders(ordersQuery);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [timeFilter])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Area */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appNameText}>FerSales</Text>
            <Text style={styles.dateText}>
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/ai-assistant')} style={styles.aiButton} activeOpacity={0.8}>
            <Text style={styles.aiButtonText}> Ask AI</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {['today', 'week', 'month', 'year'].map((filter) => (
            <TouchableOpacity 
              key={filter} 
              style={[styles.filterTab, timeFilter === filter && styles.activeFilterTab]}
              onPress={() => setTimeFilter(filter as any)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, timeFilter === filter && styles.activeFilterText]}>
                {filter === 'today' ? 'Today' : filter === 'week' ? '7 Days' : filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Metrics Card */}
        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>
            {timeFilter === 'today' ? "TODAY'S TOTAL SALES" 
              : timeFilter === 'week' ? "LAST 7 DAYS SALES" 
              : timeFilter === 'month' ? "THIS MONTH'S SALES" 
              : "THIS YEAR'S SALES"}
          </Text>
          <Text style={styles.metricsAmount}>₱{totalSales.toLocaleString('en-US')}</Text>
          <Text style={styles.metricsSubtitle}>{totalOrders} orders completed</Text>
        </View>

        {/* Action Hub */}
        <View style={styles.actionHub}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryActionButton]} 
            onPress={() => router.push('/new-order')}
            activeOpacity={0.8}
          >
            <PlusIcon size={24} color={theme.colors.cardIvory} style={{ marginBottom: 8 }} />
            <Text style={styles.primaryActionButtonText}>New Order</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryActionButton]} 
            onPress={() => router.push('/manage-products')}
            activeOpacity={0.8}
          >
            <GridIcon size={24} color={theme.colors.textDark} style={{ marginBottom: 8 }} />
            <Text style={styles.secondaryActionButtonText}>Inventory</Text>
          </TouchableOpacity>
        </View>

        {/* Footprint Log */}
        <View style={styles.logContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
            <Text style={[styles.logTitle, { marginBottom: 0 }]}>Recent Orders</Text>
            <TouchableOpacity onPress={() => router.push({ pathname: '/transactions', params: { filter: timeFilter } })}>
              <Text style={{ color: theme.colors.primaryOrange, fontWeight: theme.typography.fontWeight.bold, fontSize: 16 }}>View All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentOrders}
            keyExtractor={(item) => item.order_id.toString()}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const dateObj = new Date(item.created_at + 'Z');
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
                      <Text style={styles.logItemTime}>{timeStr}</Text>
                    </View>
                    <Text style={styles.logItemSummary} numberOfLines={1}>
                      {item.items_summary || 'No items'}
                    </Text>
                  </View>
                  <Text style={styles.logItemAmount}>₱{item.total_amount}</Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={<Text style={styles.emptyLog}>No transactions yet today.</Text>}
          />
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
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl, // Give some breathing room at top
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  appNameText: {
    fontSize: theme.typography.fontSize.h2,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
  },
  dateText: {
    fontSize: theme.typography.fontSize.body,
    color: theme.colors.textGray,
    marginTop: theme.spacing.xs,
  },
  aiButton: {
    backgroundColor: '#F9E5D8',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.pill,
  },
  aiButtonText: {
    color: theme.colors.primaryOrange,
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    backgroundColor: '#F9E5D8',
    padding: 6,
    borderRadius: theme.borderRadius.pill,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.borderRadius.pill,
  },
  activeFilterTab: {
    backgroundColor: theme.colors.cardIvory,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textGray,
    textTransform: 'capitalize',
  },
  activeFilterText: {
    color: theme.colors.primaryOrange,
  },
  metricsCard: {
    backgroundColor: theme.colors.primaryOrange,
    borderRadius: 30, // Large border radius matches mockup
    padding: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
    marginBottom: theme.spacing.xl,
  },
  metricsTitle: {
    color: theme.colors.cardIvory,
    fontSize: theme.typography.fontSize.small,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 1,
    opacity: 0.9,
    marginBottom: theme.spacing.xs,
  },
  metricsAmount: {
    color: theme.colors.cardIvory,
    fontSize: 64, // Massive typography
    fontWeight: theme.typography.fontWeight.bold,
    marginVertical: theme.spacing.xs,
  },
  metricsSubtitle: {
    color: theme.colors.cardIvory,
    fontSize: theme.typography.fontSize.body,
    opacity: 0.9,
  },
  actionHub: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: theme.borderRadius.pill,
  },
  primaryActionButton: {
    backgroundColor: theme.colors.primaryOrange,
  },
  primaryActionButtonText: {
    color: theme.colors.cardIvory,
    fontSize: 15,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
  },
  secondaryActionButton: {
    backgroundColor: theme.colors.cardIvory,
    borderWidth: 1,
    borderColor: '#E2D5C8',
  },
  secondaryActionButtonText: {
    color: theme.colors.textDark,
    fontSize: 15,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
  },
  logContainer: {
    flex: 1,
  },
  logTitle: {
    fontSize: theme.typography.fontSize.h3,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.md,
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.cardIvory,
    padding: theme.spacing.lg,
    borderRadius: 24, // Matches mockup's pill-like cards
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
