# FerSales

A lightweight, high-contrast, offline-first Point of Sale (POS) and sales tracking mobile application designed specifically for micro-businesses and local retail shops. Built with **React Native** and **Expo**, FerSales operates completely locally on the device using **SQLite**—ensuring lightning-fast performance without requiring an active internet connection.

## Project Overview

FerSales simplifies order entry, customer management, and sales tracking for small shop owners. The user interface focuses heavily on accessibility and speed—utilizing a **"Big Button" UX** methodology to accommodate fast-paced environments like busy kitchens, food stalls, or retail desks.

### Key Features

- ** Product Ledger Management:** Add, update, and categorize items (e.g., Milk Tea, Eggs, Meals) with customizable pricing tiers.
- ** High-Speed Order Checkout:** Tap-to-add product grids featuring simple `+` and `-` quantity selectors, eliminating the need for manual numeric input.
- ** Local Customer Directory:** Maintain customer delivery profiles with integrated addresses and phone records.
- ** Offline Sales Tracking:** Keep an instant rolling tally of daily, weekly, and historic revenue streams entirely on-device.
- ** 100% Offline-First Architecture:** Powered by local relational database structures to prevent transaction loss during network drops.

---

## Tech Stack & Architecture

- **Framework:** React Native (Expo Workflow SDK 54)
- **Language:** JavaScript / TypeScript
- **Database Engine:** `expo-sqlite` (Local relational storage)
- **Styling Paradigm:** React Native Built-in StyleSheet Engine (High-Contrast Theme)

### Database Schema Blueprint

The application handles transactions through a local relational schema managed via SQL data definitions:

- `products`: Tracks inventory items, unit costs, and categories.
- `customers`: Retains shipping, delivery details, and contact points.
- `orders`: Manages transactional manifests, total sales values, timestamps, and order tracking indices.
- `order_items`: A relational junction map linking individual products to bulk order quantities.

---

## 🚀 Getting Started

Follow these steps to run the development environment locally on your machine.

### Prerequisites

1. Ensure you have [Node.js (LTS version)](https://nodejs.org/) installed on your computer.
2. Download the **Expo Go** client application onto your physical Android or iOS device from the app store.

### Installation & Initialization

1. **Clone the Repository:**
