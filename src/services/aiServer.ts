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
    
    // 1. Gather context from the local SQLite database to feed to Gemini
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

    // 2. Build the prompt using the real-time data
    const systemPrompt = `
      You are a friendly, helpful, and concise Sales Assistant AI for a local micro-business app called FerSales.
      You can understand and speak in English, Tagalog, and Bisaya fluently. Always match the language the user is speaking.
      You are not limited to just sales data. You can chat, answer general questions, and help with anything the store owner asks.
      Speak to her warmly and directly. Keep your answers short and easy to read.
      
      Here is the current real-time store data from the local database (use this if they ask about sales or orders):
      - Total Sales Today: ₱${salesToday?.total || 0}
      - Total Orders Today: ${ordersToday?.count || 0}
      - All-Time Best Selling Item: ${bestSellingItem?.name || 'Nothing yet'} (${bestSellingItem?.total_sold || 0} sold)
      
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
