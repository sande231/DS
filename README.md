# Sales Capture App

A mobile application for photographing daily sales records, extracting cash/card payment totals via Claude Vision AI, and automatically emailing daily summaries.

## Architecture

```
/app       React Native (Expo) mobile app
/server    Node.js Express backend
```

## Quick Start

### 1. Backend Setup

```bash
cd server
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
```

**Required environment variables** (in `server/.env`):

| Variable           | Description                              |
|--------------------|------------------------------------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key                  |
| `SMTP_HOST`         | SMTP server host (e.g. smtp.gmail.com)  |
| `SMTP_PORT`         | SMTP port (587 for TLS, 465 for SSL)    |
| `SMTP_USER`         | Your email address                      |
| `SMTP_PASS`         | Your email app password                 |
| `PORT`              | Server port (default: 3001)             |

For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) (not your regular password).

### 2. Mobile App Setup

```bash
cd app
npm install
npx expo start
```

Scan the QR code with [Expo Go](https://expo.dev/go) on your iOS or Android device.

**Important:** In Settings, update the Server URL to your machine's local IP address (e.g., `http://192.168.1.100:3001`), not `localhost`, so your phone can reach the server.

### 3. Docker (Production)

```bash
# Create a .env file at the project root with your credentials
cp server/.env.example .env
docker-compose up -d
```

## How It Works

1. **Capture** — Open the Camera tab and photograph a sales record (receipt tape, handwritten ledger, spreadsheet printout, Z-report, etc.)
2. **Extract** — The image is sent to the backend, which calls Claude Vision API to identify and separate cash vs. card payments
3. **Review** — The app displays extracted payment entries, totals, and a confidence indicator
4. **Email** — Tap "Send Email Summary" to receive a formatted HTML email with all payment details

## App Screens

| Screen    | Description                                               |
|-----------|-----------------------------------------------------------|
| Home      | Dashboard showing today's totals and recent captures      |
| Camera    | Full-screen camera with document alignment guide          |
| Review    | Extracted data with payment breakdown and email button    |
| History   | All past captures grouped by date; long-press to delete   |
| Settings  | Email and server configuration with test email button     |

## API Endpoints

| Method | Endpoint                   | Description                          |
|--------|----------------------------|--------------------------------------|
| GET    | `/health`                  | Server health and configuration check|
| POST   | `/api/ocr/extract`         | Extract payments from base64 image   |
| POST   | `/api/email/send-summary`  | Send daily summary email             |

### POST `/api/ocr/extract`

**Request:**
```json
{
  "image": "<base64-encoded image string>",
  "mimeType": "image/jpeg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cashPayments": [{ "description": "Cash Sale", "amount": 150.00 }],
    "cardPayments": [{ "description": "Visa", "amount": 320.50 }],
    "cashTotal": 150.00,
    "cardTotal": 320.50,
    "confidence": "high",
    "notes": "Clear image, all values legible"
  }
}
```

### POST `/api/email/send-summary`

**Request:**
```json
{
  "date": "Monday, January 1, 2024",
  "recipientEmail": "manager@example.com",
  "senderName": "My Business",
  "cashPayments": [...],
  "cardPayments": [...],
  "cashTotal": 150.00,
  "cardTotal": 320.50,
  "confidence": "high",
  "notes": "optional notes"
}
```

## Supported Sales Record Formats

The Claude Vision extraction handles:
- POS/cash register receipt tapes
- Handwritten day books and sales ledgers
- Printed spreadsheet summaries
- Bank card terminal printouts (EFTPOS)
- End-of-day Z-reports

## Development

```bash
# Server - TypeScript watch mode
cd server && npm run dev

# App - Expo with live reload
cd app && npx expo start

# Type check both projects
cd server && npm run lint
cd app && npm run lint
```
