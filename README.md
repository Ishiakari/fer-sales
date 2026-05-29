# FerSales

A lightweight, high-contrast, offline-first Point of Sale (POS) and sales tracking mobile application designed specifically for micro-businesses and local retail shops. Built with **React Native** and **Expo Router**, FerSales operates completely locally on the device using **SQLite**—ensuring lightning-fast performance without requiring an active internet connection.

## Project Overview

FerSales simplifies order entry, customer management, and sales tracking for small shop owners. The user interface focuses heavily on accessibility and speed—utilizing a **"Big Button" UX** methodology with clear native icons and accessible layouts to accommodate fast-paced environments like busy kitchens, food stalls, or retail desks.

### Key Features

- **Inventory Management:** Add, update, delete, and categorize items (e.g., Burgers, Drinks, Combos) with customizable pricing tiers. Fully editable catalog.
- **High-Speed Order Checkout:** Tap-to-add product grids featuring simple `+` and `-` quantity selectors, wrapped categories, and a clean interface.
- **Custom Modifiers (Coming Soon / Schema Ready):** Support for add-ons and modifiers (like extra cheese, boba, etc.).
- **Global Cart Context:** A highly performant global React Context handles the cart state seamlessly across the app without messy URL prop drilling.
- **Customer Directory & Delivery:** Log customer profiles, phone numbers, and addresses. Includes one-tap "Open in Google Maps" integration for delivery riders.
- **Offline Sales Tracking:** Keep an instant rolling tally of daily, weekly (7 days), monthly, and historic revenue streams entirely on-device, including a full searchable Transactions ledger.
- **100% Offline-First Architecture:** Powered by local relational database structures (`expo-sqlite`) to prevent transaction loss during network drops.
- **Accessible UI:** Designed specifically for older or non-techy users. Features selectable receipt text for easy copy-pasting, clear native icons (Plus, Grid, Cart), and large readable fonts.

---

## Tech Stack & Architecture

- **Framework:** React Native / Expo (SDK 50+)
- **Routing:** Expo Router (File-based routing)
- **Language:** TypeScript / JavaScript
- **Database Engine:** `expo-sqlite` (Synchronous Local relational storage)
- **State Management:** React Context API (`CartContext`)
- **Styling Paradigm:** React Native Built-in StyleSheet Engine (High-Contrast Theme System)

### Database Schema Blueprint

The application handles transactions through a local relational schema managed via SQL data definitions (`db.ts`):

- `categories`: Menu sorting categories.
- `products`: Tracks inventory items, unit costs, and relationships to categories.
- `product_modifiers`: (Schema included) Links to products for custom variations.
- `customers`: Retains shipping, delivery details, and contact points.
- `orders`: Manages transactional manifests, total sales values, notes, and timestamps.
- `order_items`: A relational junction map linking individual products to bulk order quantities.
- `order_item_modifiers`: Logs specific modifiers chosen for a specific item in an order.

---

## 🚀 Getting Started

Follow these steps to run the development environment locally on your machine.

### Prerequisites

1. Ensure you have [Node.js (LTS version)](https://nodejs.org/) installed on your computer.
2. Download the **Expo Go** client application onto your physical Android or iOS device from the app store.

### Installation & Initialization

1. **Clone or Download the Repository:**
   Navigate to the project folder in your terminal.

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Start the Expo Development Server:**

   ```bash
   npx expo start -c
   ```

   _(The `-c` flag clears the cache to ensure a fresh start)._

4. **Launch the App:**
   - Scan the generated QR code in your terminal using the **Expo Go** app on Android, or the default **Camera app** on iOS.
   - Alternatively, press `a` in the terminal to launch the Android emulator if you have Android Studio configured.

## Theme & Design System

All colors, sizing, and typography are dynamically pulled from `src/constants/theme.ts`. To change the brand color or implement a new palette, update the central tokens in that file and the entire app will automatically adapt.
