# 📊 Sales Capture App

> A smart mobile application that photographs daily sales records, extracts cash & card payment totals using Claude AI Vision, and automatically emails professional daily summaries.

**Author:** Sandeep Shah

---

## ✨ Features

- 📷 **Camera Capture** — Full-screen camera with document alignment guide
- 🖼️ **Gallery Import** — Pick existing photos directly from your photo library
- 🤖 **AI Extraction** — Claude Vision API reads and separates cash vs. card payments instantly
- 📧 **Email Summary** — One-tap sends a professional HTML summary to any email address
- 📋 **History** — All past captures grouped by date with totals
- ⚙️ **Settings** — Configure recipient email and server URL

---

## 🏗️ Architecture

```
/app        React Native (Expo) — iOS & Android mobile app
/server     Node.js + Express — Backend API (deployed on Render)
```

**Tech Stack:**
| Layer | Technology |
|---|---|
| Mobile App | React Native, Expo SDK 52 |
| Navigation | React Navigation (Native Stack + Bottom Tabs) |
| Backend | Node.js, Express, TypeScript |
| AI / OCR | Anthropic Claude Vision API |
| Email | Resend API |
| Hosting | Render (auto-deploy from GitHub) |
| Storage | AsyncStorage (on-device) |

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd server
cp .env.example .env
# Fill in your credentials
npm install
npm run dev
```

**Required environment variables:**

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude Vision |
| `RESEND_API_KEY` | Resend API key for email sending |
| `PORT` | Server port (default: 3001) |

### 2. Mobile App Setup

```bash
cd app
npm install
npx expo start
```

Scan the QR code with [Expo Go](https://expo.dev/go) on your device, or press `i` to open in iOS Simulator.

> **Note:** In the app's Settings screen, update the Server URL to your deployed Render URL (e.g. `https://sales-capture-server.onrender.com`).

### 3. Production Deployment

The backend auto-deploys to [Render](https://render.com) on every push to GitHub via `render.yaml`.

```bash
# Docker (self-hosted)
cp server/.env.example .env
docker-compose up -d
```

---

## 📱 App Screens

| Screen | Description |
|---|---|
| **Home** | Dashboard with today's totals and recent captures |
| **Camera** | Full-screen camera with gallery import option |
| **Review** | Extracted payment breakdown with email button |
| **History** | All captures grouped by date; long-press to delete |
| **Settings** | Email recipient and server URL configuration |

---

## 🔌 API Reference

### `GET /health`
Returns server status and service availability.

```json
{
  "status": "ok",
  "services": {
    "anthropicKey": true,
    "smtp": true
  }
}
```

### `POST /api/ocr/extract`
Extracts payment data from a base64-encoded image.

**Request:**
```json
{
  "image": "<base64 string>",
  "mimeType": "image/jpeg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cashPayments": [{ "description": "Cash", "amount": 532.06 }],
    "cardPayments": [{ "description": "Credit", "amount": 2414.99 }],
    "cashTotal": 532.06,
    "cardTotal": 2414.99,
    "confidence": "high",
    "notes": "Clear image, all values legible"
  }
}
```

### `POST /api/email/send-summary`
Sends a formatted HTML sales summary email.

**Request:**
```json
{
  "date": "Monday, January 1, 2024",
  "recipientEmail": "manager@example.com",
  "senderName": "My Business",
  "cashPayments": [...],
  "cardPayments": [...],
  "cashTotal": 532.06,
  "cardTotal": 2414.99,
  "confidence": "high"
}
```

---

## 📄 Supported Sales Record Formats

- POS / cash register receipt tapes
- Handwritten day books and sales ledgers
- Printed spreadsheet summaries
- Bank card terminal printouts (EFTPOS)
- End-of-day Z-reports

---

## 🛠️ Development

```bash
# Server — TypeScript watch mode
cd server && npm run dev

# App — Expo with live reload
cd app && npx expo start

# Type check
cd server && npm run lint
cd app && npm run lint
```

---

## 📜 License

MIT © Sandeep Shah
