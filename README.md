
# NHL Scores App

A full-stack application for fetching and displaying NHL game scores.

## Overview

This app fetches NHL game data from an external API, stores it in Firestore, and displays it in a Flutter mobile app. The backend is built with NestJS and uses Google Cloud Pub/Sub for scheduled data fetching.
API being used: https://nhl-score-api.herokuapp.com/

Credit: https://github.com/peruukki/nhl-score-api


## Architecture

**Backend (NestJS):**
- Fetches game data from the API
- Transforms and stores in Firestore - Real project created, could have been mocked the data too
- Handles schema changes automatically
- Ensures idempotency (no duplicate games) based on gameId (time+teamId1+teamId2)

**Frontend (Flutter):**
- Displays games in real-time
- Shows team details and records
- Works offline with Firestore caching (hopefully - will try to find time to integrate it)

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore enabled
- Google Cloud project (for Pub/Sub in production) - Not integrated

### Backend Setup

**1. Install dependencies:**
npm install

**2. Configure Firebase:**
Download your Firebase service account key and save as `serviceAccount.json` in the project root.

**3. Assumption:**
Assumption is GCP is set with a scheduled job that will trigger the flow, to test below is the endpoint exposed for demonstration purpose

# Make sure it's in .gitignore (it already is)
echo "serviceAccount.json" >> .gitignore

**3. Run the backend:**
# Development mode 
npm run start:dev

The API will be available at `http://localhost:3000`

Backfill is manual right now, can be tested by;

`[/pubsub/nhl-scores-fetch]` -> Endpoint GCP will pub to

`[/admin/backfill]` -> Temp endpoint for manual upload that will move to background job with outbox pattern later
---

## Testing

Tests for the core functionality. Run them with:

# Run all tests
npm test

# Run tests with coverage
npm run test:cov


