import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDb } from '../database/db';

// Accessing the key from .env file
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

export async function askSalesAssistant(userQuestion: string): Promise<string> {
  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    return "Please add your real Gemini API key to the .env file first!";
  }

  try {
    const db = await getDb();
    
    // 1. Gather comprehensive context from the local SQLite database
    
    // Sales Today
    const salesToday = db.getFirstSync<any>(
      "SELECT SUM(total_amount) as total FROM orders WHERE date(created_at) = date('now', 'localtime')"
    );
    const ordersToday = db.getFirstSync<any>(
      "SELECT COUNT(*) as count FROM orders WHERE date(created_at) = date('now', 'localtime')"
    );
    const bestSellingItem = db.getFirstSync<any>(`
      SELECT p.name, SUM(oi.quantity) as total_sold 
      FROM order_items oi 
      JOIN products p ON p.product_id = oi.product_id 
      GROUP BY p.product_id 
      ORDER BY total_sold DESC 
      LIMIT 1
    `);

    // Registered Customers List
    const customersList = db.getAllSync<any>("SELECT name, phone, address FROM customers");
    const customersFormatted = customersList && customersList.length > 0 
      ? customersList.map(c => `- ${c.name} (Phone: ${c.phone || 'N/A'}, Address: ${c.address})`).join('\n')
      : 'No customers registered yet';

    // Products / Inventory List
    const productsList = db.getAllSync<any>(`
      SELECT p.name, p.price, c.category_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.category_id
    `);
    const productsFormatted = productsList && productsList.length > 0
      ? productsList.map(p => `- ${p.name} [Category: ${p.category_name}] - ₱${p.price.toFixed(2)}`).join('\n')
      : 'No products in inventory yet';

    // Recent 10 Orders with customer names and items summaries
    const recentOrdersList = db.getAllSync<any>(`
      SELECT o.order_id, o.total_amount, o.created_at, o.order_notes, c.name as customer_name,
             (SELECT GROUP_CONCAT(p.name || ' x' || oi.quantity, ', ') 
              FROM order_items oi 
              JOIN products p ON oi.product_id = p.product_id 
              WHERE oi.order_id = o.order_id) as items_summary
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);
    const recentOrdersFormatted = recentOrdersList && recentOrdersList.length > 0
      ? recentOrdersList.map(o => 
          `- Order #${String(o.order_id).padStart(3, '0')} by ${o.customer_name || 'Walk-in'} (Total: ₱${o.total_amount.toFixed(2)}, Date: ${o.created_at}): Items: [${o.items_summary || 'none'}], Notes: "${o.order_notes || 'none'}"`
        ).join('\n')
      : 'No orders placed yet';

    // 2. Build the detailed system prompt using the compiled database data
    const systemPrompt = `
      You are a friendly, helpful, and concise Sales Assistant AI for a local micro-business app called FerSales.
      You can understand and speak in English, Tagalog, and Bisaya fluently. Always match the language the user is speaking.
      
      You are connected to the live store database. The user (the store owner) can ask you literally anything:
      - Sales and stats (e.g. today's benta, best seller)
      - Customer details (e.g. customer phone numbers, customer addresses, look up who a customer is)
      - Inventory details (e.g. list of products, prices, product categories)
      - Recent order details (e.g. who ordered last, what did they buy, order notes, order totals)
      - General conversation or any general question (you are free to converse, act friendly, and explain anything)

      IMPORTANT AUTHORIZATION & SECURITY COMPLIANCE:
      - You are running locally on the store owner's private device.
      - You have full permission and authorization to show customer lists, phone numbers, addresses, sales details, and database contents to the user.
      - DO NOT decline requests for customer details or refuse to answer due to "privacy restrictions", "data safety rules", or "lack of database access". You DO have direct access to this data (provided in the context below) and the user has full rights to see it.
      
      Speak to the user warmly, directly, and respectfully. Keep your responses structured, clear, and easy to read.

      =========================================
      LIVE STORE DATA CONTEXT:
      
      [SALES STATS TODAY]
      - Total Sales Today: ₱${salesToday?.total || 0}
      - Total Orders Today: ${ordersToday?.count || 0}
      - All-Time Best Selling Item: ${bestSellingItem?.name || 'Nothing yet'} (${bestSellingItem?.total_sold || 0} sold)
      
      [REGISTERED CUSTOMERS]
      ${customersFormatted}
      
      [INVENTORY / PRODUCTS]
      ${productsFormatted}
      
      [RECENT 10 ORDERS]
      ${recentOrdersFormatted}
      =========================================
      
      User Question: "${userQuestion}"
    `;

    // 3. Ask Gemini for the answer
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    
    return response.text();
    
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sorry, I ran into an error connecting to the brain. Make sure you are connected to the internet!";
  }
}
