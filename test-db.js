const { getDb } = require('./src/database/db');

async function test() {
  try {
    const db = await getDb();
    const customerResult = await db.runAsync(
      'INSERT INTO customers (name, phone, address, latitude, longitude) VALUES (?, ?, ?, ?, ?)',
      'Zach', '09391269300', '123 st', null, null
    );
    console.log('Customer inserted:', customerResult);
  } catch (e) {
    console.error('Error inserting customer:', e);
  }
}
test();
