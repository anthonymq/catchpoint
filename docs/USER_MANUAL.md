# Catchpoint User Manual

Welcome to **Catchpoint**, your ultimate companion for logging and analyzing your fishing adventures. Catchpoint is an offline-first Progressive Web App (PWA) designed to capture your catches with a single tap, even when you're deep in the wilderness without a signal.

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Quick Capture (FISH ON!)](#2-quick-capture-fish-on)
3. [The Catch Log](#3-the-catch-log)
4. [Catch Details & Editing](#4-catch-details--editing)
5. [Map View](#5-map-view)
6. [Statistics Dashboard](#6-statistics-dashboard)
7. [Settings & Customization](#7-settings--customization)
8. [Social Features](#8-social-features)
9. [Offline Mode](#9-offline-mode)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Getting Started

### Accessing the App

You can access Catchpoint from any modern web browser at:
**[https://catchpoint-c47f5.web.app](https://catchpoint-c47f5.web.app)**

### Installing as a PWA

For the best experience, install Catchpoint on your device. This allows it to work offline and provides a full-screen experience.

**On iOS (iPhone/iPad):**

1. Open the URL in **Safari**.
2. Tap the **Share** button (the square with an arrow pointing up).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add** in the top-right corner.

**On Android / Chrome (Desktop):**

1. Open the URL in **Chrome**.
2. A prompt should appear at the bottom of the screen saying **Add Catchpoint to Home screen**. Tap it.
3. If the prompt doesn't appear, tap the **three dots** in the top-right corner and select **Install app**.

### Creating an Account

While you can use the app as a guest, creating an account allows you to sync your data and access social features.

- **Google Sign-in:** The fastest way to get started.
- **Email/Password:** Create a traditional account with your email address.

> **Tip:** Make sure to verify your email if you choose the email/password option to ensure you can recover your account if needed.

---

## 2. Quick Capture (FISH ON!)

The heart of Catchpoint is the **FISH ON!** button located on the Home screen.

### How it Works

1. When you catch a fish, tap the large **FISH ON!** button.
2. The app immediately registers the catch with a satisfying haptic vibration and a success icon.
3. Catchpoint automatically captures:
   - **Current Time & Date**
   - **GPS Location** (Current coordinates)
   - **Weather Data** (Temperature, pressure, wind, and conditions)

### Why Use Quick Capture?

It’s designed for when you're in the middle of the action. Don't worry about entering details like species or weight immediately—just tap the button and get back to fishing! You can add photos and more details later in the Catch Log.

> **Tip:** Even if you are offline, the app will save your GPS location. Weather data will be automatically synced as soon as your device regains an internet connection.

---

## 3. The Catch Log

The **Log** tab is where you can view your entire history of catches.

- **Scrollable List:** Your catches are displayed in reverse chronological order (newest first).
- **Filtering:** Tap the filter icon to narrow down your view by:
  - **Date Range:** Find catches from a specific trip or season.
  - **Species:** Filter for just your Bass, Trout, etc.
  - **Weather Conditions:** See what you caught during a specific weather pattern.
- **Test Data:** If you're new to the app and want to see how it looks with data, you can find an option in Settings to **Load Test Data**.

---

## 4. Catch Details & Editing

Tap any catch card in the Log to view or edit its details.

### Editing a Catch

- **Photos:** Tap the photo area or the camera icon to upload a photo of your catch.
- **Species:** Type the name of the fish. The app provides autocomplete suggestions for common species.
- **Weight & Length:** Enter the measurements. The units (lbs/kg, in/cm) follow your preferences set in [Settings](#7-settings--customization).
- **Notes:** Add any specific details about the lure used, the fight, or the exact spot.
- **Auto-captured Data:** You can view the precise time, coordinates, and weather conditions that were recorded at the moment of the catch.

### Actions

- **Share:** Use the Share icon to send your catch to social media, messaging apps, or the internal Catchpoint Feed.
- **Delete:** If you logged a catch by mistake, use the Delete button (or swipe the card in the Log view).

---

## 5. Map View

The **Map** tab provides a visual geographic history of your fishing success.

- **Markers & Clustering:** Individual catches appear as pins. When zoomed out, multiple catches in the same area are "clustered" together for a cleaner view.
- **Heatmap View:** Switch to the Heatmap to see "hot spots" where you've had the most activity over time.
- **Interactions:** Tap any marker to see a popup with the catch photo, species, and weight.
- **Navigation:** Use the arrows on the map to browse through your catches one by one.
- **Auto-Center:** Tap the location icon to center the map on your current position.

> **Tip:** The map uses cached tiles, meaning it can still display areas you've previously viewed even when you're offline.

---

## 6. Statistics Dashboard

Curious about your performance? The **Stats** tab analyzes your data to give you professional-grade insights.

### Summary Cards

Quickly see your **Total Catches**, **Top Species**, **Average Weight**, and your **Best Day ever**.

### Golden Hour Insight

This is Catchpoint's most powerful tool. It analyzes your catch history to determine your "Golden Hour"—the 3-hour window when you are statistically most likely to catch fish.

### Charts & Graphs

- **Time of Day:** A bar chart showing when you are most active.
- **Species Distribution:** A pie chart showing the variety of your catches.
- **Monthly Activity:** Track how your fishing changes throughout the year.
- **Environmental Impact:** See how **Moon Phase**, **Barometric Pressure**, and **Temperature** correlate with your success.

---

## 7. Settings & Customization

Tailor Catchpoint to your specific needs in the **Settings** tab.

### Account

- **Profile:** Manage your sign-in status and verify your email.

### App & Appearance

- **PWA Status:** Check if the app is installed and see how much storage it's using.
- **Theme:** Choose between **Light Mode**, **Dark Mode**, or let it follow your **System** settings.
- **Language:** Supports **English** and **French**. Set it manually or let it auto-detect your system language.

### Units of Measurement

- **Weight:** Toggle between **lbs** (pounds) and **kg** (kilograms).
- **Length:** Toggle between **in** (inches) and **cm** (centimeters).

### Data Management

- **Export to CSV:** Download all your catch data as a spreadsheet for your own records.
- **Load Test Data:** Populates your app with 20 sample catches to explore the features.
- **Clear All Data:** Warning! This permanently deletes all catches from your device and account.

---

## 8. Social Features

If you are signed in, you can connect with other anglers.

- **The Feed:** Share your catches and see what others are catching.
- **Likes & Comments:** Engage with the community by liking and commenting on catches.
- **Following:** Follow your friends or local pros to stay updated on their latest hauls.
- **Leaderboards:** See how you rank against others in your region or for specific species.
- **Messaging:** Chat directly with other users to share tips or plan trips.

---

## 9. Offline Mode

Catchpoint is built for the great outdoors.

- **Always Ready:** The app works fully without an internet connection.
- **Local Storage:** All catches are saved securely on your device's internal database (IndexedDB).
- **Background Sync:** Once you return to cell service or Wi-Fi, the app automatically syncs your catches to the cloud and fetches any missing weather data.
- **Status Indicator:** Look for the "Offline" banner to know when you're disconnected.

---

## 10. Troubleshooting

### GPS Not Working

- Ensure Location Services are enabled on your device.
- Make sure you have granted Catchpoint permission to access your location in your browser settings.

### Weather Data Missing

- Weather data requires an internet connection. If you are offline, the data will appear once you sync.
- Check if your device has a working connection.

### App Not Installing

- Make sure you are using Safari on iOS or Chrome on Android/Desktop.
- Check if you have enough storage space on your device.

### Photos Not Uploading

- Ensure the app has permission to access your camera or photo library.
- Large photo files may take longer to upload on slow connections.

---

© 2026 Catchpoint Fishing. All rights reserved.
