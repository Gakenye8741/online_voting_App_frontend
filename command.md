pnpm dlx eas-cli build --profile preview --platform android
"expo-dev-client": "~6.0.20",

🗳️ Laikipia E-Vote
Secure, Transparent, and Accessible Student Voting for Laikipia University.

📌 Overview
Laikipia E-Vote is a mobile application designed to modernize the student election process. Built with React Native and Expo, it aims to eliminate long queues and physical ballot constraints by providing a secure digital platform for students to cast their votes.

🚀 Development Quick Start
This project uses pnpm and Expo. Follow these steps to get your local environment running.

1. Prerequisites
Node.js: v20.x

pnpm: v10.x

Expo Go: Downloaded on your Android/iOS device.

2. Setup
Bash
# Install dependencies
pnpm install

# Start the development server (Expo Go Mode)
pnpm expo start --go --tunnel
3. Build for Production (APK)
To generate a standalone APK for final presentation:

Bash
pnpm dlx eas-cli build --profile preview --platform android
🛠️ Tech Stack
Frontend: React Native, Expo SDK 54

Navigation: Expo Router (File-based routing)

State Management: Redux Toolkit

Networking: Axios, Socket.io (Real-time updates)

Styling: Expo Blur, Linear Gradient, Reanimated

✨ Features
Biometric/Secure Login: Integrated with expo-secure-store.

Real-time Results: Live vote counting using WebSockets.

Offline Support: Local persistence with async-storage.

Professional UI: Custom splash screen and adaptive branding.

📁 Project Structure
Plaintext
.
├── assets/images/      # App Icon & Splash Screen (Laikipia Logo)
├── app/                # Main application screens (Expo Router)
├── components/         # Reusable UI widgets
├── store/              # Redux logic
├── eas.json            # Build configuration
└── app.json            # Native app identity & metadata
🎓 Academic Context
University: Laikipia University

Course: 4th Year Computer Science Project

Author: Gakenye