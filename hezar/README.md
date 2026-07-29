# Hezar - OAuth Protected Web Application

A Flask web application with X (Twitter) OAuth2 authentication that features an interactive button interface with payment simulation.

## Features

- **X (Twitter) OAuth2 Authentication**: Secure login using X OAuth2 API
- **Protected Routes**: All application functionality requires authentication
- **Interactive Button Interface**: Hold-to-activate button with progress animation
- **Payment Simulation**: Test payment flow with success/failure scenarios
- **Statistics Tracking**: Track visits, clicks, and payments
- **Admin Dashboard**: View application statistics
- **Session Management**: Secure user sessions with logout functionality

## Prerequisites

- Python 3.8+
- X (Twitter) Developer Account
- X OAuth2 App credentials

## Setup Instructions

### 1. X (Twitter) OAuth2 Setup

1. Go to the [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project and app (or use existing)
3. Navigate to your app settings
4. Under "User authentication settings":
   - Enable OAuth 2.0
   - Set Type of App to "Web App"
   - Add Callback URL: `http://localhost:2345/auth/callback`
   - Add Website URL: `http://localhost:2345`
5. Note down your:
   - Client ID
   - Client Secret

### 2. Environment Configuration

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your X OAuth2 credentials:
   ```bash
   # X (Twitter) OAuth2 Configuration
   TWITTER_CLIENT_ID=your_actual_client_id_here
   TWITTER_CLIENT_SECRET=your_actual_client_secret_here
   TWITTER_REDIRECT_URI=http://localhost:2345/auth/callback

   # Flask Secret Key for Sessions
   SECRET_KEY=your_secure_secret_key_here
   ```

### 3. Installation

1. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Initialize the database:
   ```bash
   python database.py
   ```

### 4. Running the Application

1. Activate the virtual environment (if not already active):
   ```bash
   source venv/bin/activate
   ```

2. Start the Flask application:
   ```bash
   python app.py
   ```

3. Open your browser and navigate to:
   - Main app: http://localhost:2345
   - Admin stats: http://localhost:2345/admin

## Database Structure

The SQLite database (`data/website_stats.db`) contains:

- **counters**: Main counter table with total counts
- **visits_log**: Detailed log of all visits
- **clicks_log**: Detailed log of all button clicks
- **payments_log**: Detailed log of all payment redirects

## API Endpoints

- `POST /api/click` - Record a button click
- `POST /api/payment` - Record a payment redirect
- `GET /api/stats` - Get current statistics

## How It Works

1. **Visit Tracking**: Automatically counts each page visit
2. **Click Tracking**: Records each button press (mouse or touch)
3. **Payment Tracking**: Records when users click on the payment text
4. **Real-time Updates**: Statistics are updated immediately in the database

## Files

- `app.py` - Main Flask application
- `database.py` - Database setup script
- `index.html` - Main webpage
- `styles.css` - Styling
- `script.js` - Frontend functionality
- `requirements.txt` - Python dependencies

## Database Setup

The database is automatically created when you first run the application. If you need to reset it, simply delete the `data/` folder and restart the app. 