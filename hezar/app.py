from flask import Flask, request, jsonify, render_template_string, send_from_directory, session, redirect, url_for
import sqlite3
import os
from datetime import datetime
import json
from requests_oauthlib import OAuth2Session
from dotenv import load_dotenv
from functools import wraps

# Load environment variables
load_dotenv('.env.local')

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

# Twitter OAuth2 configuration
TWITTER_CLIENT_ID = os.getenv('TWITTER_CLIENT_ID')
TWITTER_CLIENT_SECRET = os.getenv('TWITTER_CLIENT_SECRET')
TWITTER_REDIRECT_URI = os.getenv('TWITTER_REDIRECT_URI', 'http://localhost:2345/auth/callback')
TWITTER_AUTHORIZATION_BASE_URL = 'https://x.com/i/oauth2/authorize'
TWITTER_TOKEN_URL = 'https://api.x.com/2/oauth2/token'
TWITTER_SCOPE = ['tweet.read', 'users.read', 'follows.read', 'offline.access']

# Database path
DB_PATH = 'data/website_stats.db'

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def increment_counter(counter_type):
    """Increment a specific counter in the database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Update the counter
    cursor.execute(f'UPDATE counters SET {counter_type} = {counter_type} + 1, last_updated = CURRENT_TIMESTAMP WHERE id = 1')
    
    # Log the action
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent', 'Unknown')
    
    if counter_type == 'visits':
        cursor.execute('''
            INSERT INTO visits_log (ip_address, user_agent) 
            VALUES (?, ?)
        ''', (ip_address, user_agent))
    elif counter_type == 'clicks':
        cursor.execute('''
            INSERT INTO clicks_log (action, ip_address, user_agent) 
            VALUES (?, ?, ?)
        ''', ('button_click', ip_address, user_agent))
    elif counter_type == 'payments':
        cursor.execute('''
            INSERT INTO payments_log (ip_address, user_agent) 
            VALUES (?, ?)
        ''', (ip_address, user_agent))
    
    conn.commit()
    conn.close()

def get_counters():
    """Get current counter values"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT clicks, payments, visits FROM counters WHERE id = 1')
    result = cursor.fetchone()
    conn.close()
    
    if result:
        return {
            'clicks': result['clicks'],
            'payments': result['payments'],
            'visits': result['visits']
        }
    return {'clicks': 0, 'payments': 0, 'visits': 0}

def login_required(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def get_twitter_oauth():
    """Create Twitter OAuth2 session"""
    return OAuth2Session(
        TWITTER_CLIENT_ID,
        scope=TWITTER_SCOPE,
        redirect_uri=TWITTER_REDIRECT_URI
    )

@app.route('/login')
def login():
    """Login page with X OAuth"""
    login_html = '''
    <!DOCTYPE html>
    <html lang="en" dir="ltr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login - Hezar</title>
        <style>
            @font-face {
                font-family: 'Bamdad';
                src: url('./static/fonts/Colak.ttf') format('truetype');
                font-weight: normal;
                font-style: normal;
            }
            
            body {
                font-family: 'Bamdad', 'Arial', sans-serif;
                background: linear-gradient(135deg, #050505 0%, #0a0a0a 25%, #0f0f0f 50%, #1a1a1a 75%, #2d2d2d 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0;
                color: white;
                position: relative;
                overflow: hidden;
            }
            
            body::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: 
                    radial-gradient(circle at 20% 80%, rgba(80, 80, 120, 0.2) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(120, 80, 120, 0.2) 0%, transparent 50%);
                animation: backgroundShift 30s ease-in-out infinite;
                z-index: -1;
            }
            
            @keyframes backgroundShift {
                0%, 100% { 
                    transform: scale(1) rotate(0deg); 
                    opacity: 0.8;
                }
                50% { 
                    transform: scale(1.02) rotate(0.2deg); 
                    opacity: 1;
                }
            }
            
            .login-container {
                text-align: center;
                background: rgba(0, 0, 0, 0.4);
                padding: 3rem;
                border-radius: 20px;
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                box-shadow: 
                    0 8px 32px rgba(0, 0, 0, 0.6),
                    inset 0 1px 0 rgba(255, 255, 255, 0.05);
                max-width: 400px;
                width: 90%;
                position: relative;
                z-index: 1;
            }
            
            .login-container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            }
            
            h1 {
                margin-bottom: 2rem;
                font-size: 2.5rem;
                color: #2a6a5a;
                text-shadow: 0 0 20px rgba(42, 106, 90, 0.4);
            }
            
            .oauth-button {
                font-family: 'Bamdad', 'Arial', sans-serif;
                background: linear-gradient(135deg, #1da1f2 0%, #0d8bd9 100%);
                color: white;
                border: none;
                padding: 1.2rem 2.5rem;
                font-size: 1.2rem;
                border-radius: 25px;
                cursor: pointer;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                text-decoration: none;
                display: inline-block;
                box-shadow: 
                    0 8px 25px rgba(0, 0, 0, 0.5),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.05);
                width: 100%;
                max-width: 280px;
            }
            
            .oauth-button:hover {
                transform: translateY(-3px) scale(1.02);
                box-shadow: 
                    0 15px 40px rgba(0, 0, 0, 0.6),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2),
                    0 0 20px rgba(29, 161, 242, 0.3);
                background: linear-gradient(135deg, #2db1ff 0%, #1d91e9 100%);
            }
            
            .oauth-button::before {
                content: "𝕏";
                margin-right: 10px;
                font-size: 1.4rem;
                font-weight: bold;
            }
            
            .description {
                margin: 1.5rem 0;
                color: #a0a0b0;
                line-height: 1.6;
            }
        </style>
    </head>
    <body>
        <div class="login-container">
            <h1>Hezar</h1>
            <p class="description">Please login with your X (Twitter) account to access the application.</p>
            <a href="/auth/login" class="oauth-button">Login with X</a>
        </div>
    </body>
    </html>
    '''
    return login_html

@app.route('/auth/login')
def auth_login():
    """Redirect to Twitter OAuth"""
    twitter = get_twitter_oauth()
    authorization_url, state = twitter.authorization_url(
        TWITTER_AUTHORIZATION_BASE_URL,
        code_challenge_method='plain',
        pkce=True
    )
    session['oauth_state'] = state
    return redirect(authorization_url)

@app.route('/auth/callback')
def auth_callback():
    """Handle OAuth callback"""
    twitter = get_twitter_oauth()
    
    try:
        # Get the token
        token = twitter.fetch_token(
            TWITTER_TOKEN_URL,
            client_secret=TWITTER_CLIENT_SECRET,
            authorization_response=request.url
        )
        
        # Get user info
        user_response = twitter.get('https://api.x.com/2/users/me')
        user_data = user_response.json()
        
        if 'data' in user_data:
            # Store user info in session
            session['user'] = {
                'id': user_data['data']['id'],
                'username': user_data['data']['username'],
                'name': user_data['data']['name']
            }
            session['oauth_token'] = token
            
            return redirect(url_for('index'))
        else:
            return redirect(url_for('login') + '?error=auth_failed')
            
    except Exception as e:
        print(f"OAuth error: {e}")
        return redirect(url_for('login') + '?error=oauth_error')

@app.route('/logout')
def logout():
    """Logout user"""
    session.clear()
    return redirect(url_for('login'))

@app.route('/')
@login_required
def index():
    """Serve the main page and increment visit counter"""
    increment_counter('visits')
    
    # Check if user is returning from valid payment
    from_valid_payment = request.args.get('from_valid_payment', 'false').lower() == 'true'
    
    # Read the HTML file and return it
    with open('index.html', 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    # Add user info and logout button
    user_info = session.get('user', {})
    user_greeting = f'''
    <div class="user-info">
        <div class="user-greeting">Welcome, {user_info.get('name', 'User')}!</div>
        <a href="/logout" class="logout-btn">Logout</a>
    </div>
    '''
    
    # Insert user info after the container div
    html_content = html_content.replace('<div class="container">', user_greeting + '<div class="container">')
    
    # If returning from valid payment, show payment count and set up button behavior
    if from_valid_payment:
        counters = get_counters()
        valid_payment_script = f'''
        <script>
            document.addEventListener('DOMContentLoaded', function() {{
                // Show payment count
                const container = document.querySelector('.container');
                const paymentCount = document.createElement('div');
                paymentCount.className = 'payment-count';
                paymentCount.innerHTML = `
                    <div class="payment-info">
                        <h3>تعداد پرداخت‌های انجام شده: {counters['payments']}</h3>
                        <p>شما از پرداخت موفق بازگشتید!</p>
                    </div>
                `;
                container.appendChild(paymentCount);
                
                // Set up the simplified button behavior
                setupSimplifiedButton();
            }});
            
            function setupSimplifiedButton() {{
                const mainButton = document.getElementById('mainButton');
                const progressCircle = document.querySelector('.progress-ring-circle');
                let pressTimer;
                let isHolding = false;
                let progressInterval;
                
                function startProgressAnimation() {{
                    const duration = 3000; // 3 seconds
                    const steps = 60; // 60 steps for smooth animation
                    const stepDuration = duration / steps;
                    const circumference = 2 * Math.PI * 100; // 2πr where r=100
                    
                    let currentStep = 0;
                    
                    progressInterval = setInterval(function() {{
                        currentStep++;
                        const progress = (currentStep / steps) * 100;
                        const dashOffset = circumference - (progress / 100) * circumference;
                        
                        progressCircle.style.strokeDashoffset = dashOffset;
                        
                        if (currentStep >= steps) {{
                            clearInterval(progressInterval);
                        }}
                    }}, stepDuration);
                }}
                
                function resetProgress() {{
                    if (progressInterval) {{
                        clearInterval(progressInterval);
                    }}
                    progressCircle.style.strokeDashoffset = '628.32'; // Reset to 0% progress
                }}
                
                mainButton.addEventListener('mousedown', function() {{
                    isHolding = true;
                    mainButton.classList.add('holding');
                    
                    // Start progress animation
                    startProgressAnimation();
                    
                    // Record button click
                    fetch('/api/click', {{
                        method: 'POST',
                        headers: {{
                            'Content-Type': 'application/json'
                        }}
                    }});
                    
                    pressTimer = setTimeout(function() {{
                        if (isHolding) {{
                            // Always go to payment page after 3 seconds
                            window.location.href = '/pay';
                        }}
                    }}, 3000);
                }});
                
                mainButton.addEventListener('mouseup', function() {{
                    isHolding = false;
                    mainButton.classList.remove('holding');
                    clearTimeout(pressTimer);
                    resetProgress();
                }});
                
                mainButton.addEventListener('mouseleave', function() {{
                    isHolding = false;
                    mainButton.classList.remove('holding');
                    clearTimeout(pressTimer);
                    resetProgress();
                }});
                
                // Handle touch events for mobile
                mainButton.addEventListener('touchstart', function(e) {{
                    e.preventDefault();
                    isHolding = true;
                    mainButton.classList.add('holding');
                    
                    // Start progress animation
                    startProgressAnimation();
                    
                    // Record button click
                    fetch('/api/click', {{
                        method: 'POST',
                        headers: {{
                            'Content-Type': 'application/json'
                        }}
                    }});
                    
                    pressTimer = setTimeout(function() {{
                        if (isHolding) {{
                            // Always go to payment page after 3 seconds
                            window.location.href = '/pay';
                        }}
                    }}, 3000);
                }});
                
                mainButton.addEventListener('touchend', function(e) {{
                    e.preventDefault();
                    isHolding = false;
                    mainButton.classList.remove('holding');
                    clearTimeout(pressTimer);
                    resetProgress();
                }});
            }}
        </script>
        '''
        html_content = html_content.replace('</body>', valid_payment_script + '</body>')
    
    return html_content

@app.route('/styles.css')
def styles():
    """Serve CSS file"""
    return send_from_directory('.', 'styles.css')

@app.route('/script.js')
def script():
    """Serve JavaScript file"""
    return send_from_directory('.', 'script.js')

@app.route('/api/click', methods=['POST'])
@login_required
def record_click():
    """Record a button click"""
    increment_counter('clicks')
    return jsonify({'success': True, 'message': 'Click recorded'})

@app.route('/api/payment', methods=['POST'])
@login_required
def record_payment():
    """Record a payment redirect"""
    increment_counter('payments')
    return jsonify({'success': True, 'message': 'Payment recorded'})

@app.route('/api/stats')
@login_required
def get_stats():
    """Get current statistics"""
    counters = get_counters()
    return jsonify(counters)

@app.route('/pay')
@login_required
def payment_page():
    """Payment page that records the payment redirect"""
    # Don't increment payment counter here - only when actually making a payment
    
    # Simple payment page
    payment_html = '''
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>صفحه پرداخت</title>
        <style>
            @font-face {
                font-family: 'Bamdad';
                src: url('./static/fonts/Colak.ttf') format('truetype');
                font-weight: normal;
                font-style: normal;
            }
            
            body {
                font-family: 'Bamdad', 'Arial', sans-serif;
                background: linear-gradient(135deg, #050505 0%, #0a0a0a 25%, #0f0f0f 50%, #1a1a1a 75%, #2d2d2d 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0;
                color: white;
                position: relative;
                overflow: hidden;
            }
            
            body::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: 
                    radial-gradient(circle at 20% 80%, rgba(80, 80, 120, 0.2) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(120, 80, 120, 0.2) 0%, transparent 50%);
                animation: backgroundShift 30s ease-in-out infinite;
                z-index: -1;
            }
            
            @keyframes backgroundShift {
                0%, 100% { 
                    transform: scale(1) rotate(0deg); 
                    opacity: 0.8;
                }
                50% { 
                    transform: scale(1.02) rotate(0.2deg); 
                    opacity: 1;
                }
            }
            
            .payment-container {
                text-align: center;
                background: rgba(0, 0, 0, 0.4);
                padding: 3rem;
                border-radius: 20px;
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                box-shadow: 
                    0 8px 32px rgba(0, 0, 0, 0.6),
                    inset 0 1px 0 rgba(255, 255, 255, 0.05);
                max-width: 500px;
                width: 90%;
                position: relative;
                z-index: 1;
            }
            
            .payment-container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            }
            
            .payment-buttons {
                display: flex;
                gap: 1rem;
                justify-content: center;
                margin: 2rem 0;
                flex-wrap: wrap;
            }
            
            .payment-button {
                font-family: 'Bamdad', 'Arial', sans-serif;
                background: linear-gradient(135deg, #2a6a5a 0%, #2a5a6a 100%);
                color: white;
                border: none;
                padding: 1.2rem 2.5rem;
                font-size: 1.2rem;
                border-radius: 25px;
                cursor: pointer;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                min-width: 140px;
                box-shadow: 
                    0 8px 25px rgba(0, 0, 0, 0.5),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.05);
            }
            
            .payment-button:hover {
                transform: translateY(-3px) scale(1.02);
                box-shadow: 
                    0 15px 40px rgba(0, 0, 0, 0.6),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2),
                    0 0 20px rgba(42, 106, 90, 0.3);
                background: linear-gradient(135deg, #3a7a6a 0%, #3a6a7a 100%);
            }
            
            .payment-button.invalid {
                background: linear-gradient(135deg, #8a4a6a 0%, #6a4a5a 100%);
            }
            
            .payment-button.invalid:hover {
                background: linear-gradient(135deg, #9a5a7a 0%, #7a5a6a 100%);
                box-shadow: 
                    0 15px 40px rgba(0, 0, 0, 0.6),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2),
                    0 0 20px rgba(138, 74, 106, 0.3);
            }
            
            .back-button {
                font-family: 'Bamdad', 'Arial', sans-serif;
                background: linear-gradient(135deg, #4a4a6a 0%, #5a4a7a 100%);
                color: white;
                border: none;
                padding: 1.2rem 2.5rem;
                font-size: 1.2rem;
                border-radius: 25px;
                cursor: pointer;
                margin-top: 2rem;
                text-decoration: none;
                display: inline-block;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                box-shadow: 
                    0 8px 25px rgba(0, 0, 0, 0.5),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.05);
            }
            
            .back-button:hover {
                transform: translateY(-3px) scale(1.02);
                box-shadow: 
                    0 15px 40px rgba(0, 0, 0, 0.6),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2),
                    0 0 20px rgba(74, 74, 106, 0.3);
                background: linear-gradient(135deg, #5a5a7a 0%, #6a5a8a 100%);
            }
            
            .payment-status {
                margin: 1.5rem 0;
                padding: 1.5rem;
                border-radius: 15px;
                font-weight: bold;
                font-family: 'Bamdad', 'Arial', sans-serif;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .payment-status.success {
                background: rgba(42, 106, 90, 0.2);
                border: 1px solid rgba(42, 106, 90, 0.3);
                color: #2a6a5a;
                box-shadow: 0 0 20px rgba(42, 106, 90, 0.2);
            }
            
            .payment-status.error {
                background: rgba(138, 74, 106, 0.2);
                border: 1px solid rgba(138, 74, 106, 0.3);
                color: #8a4a6a;
                box-shadow: 0 0 20px rgba(138, 74, 106, 0.2);
            }
        </style>
    </head>
    <body>
        <div class="payment-container">
            <h1>صفحه پرداخت</h1>
            <p>برای تست، یکی از دکمه‌های زیر را انتخاب کنید:</p>
            
            <div class="payment-buttons">
                <button class="payment-button" onclick="testPayment('valid')">پرداخت موفق</button>
                <button class="payment-button invalid" onclick="testPayment('invalid')">پرداخت ناموفق</button>
            </div>
            
            <div id="paymentStatus" class="payment-status" style="display: none;"></div>
            
            <a href="/?from_payment=true" class="back-button" id="backButton" style="display: none;">بازگشت به صفحه اصلی</a>
        </div>
        
        <script>
            function testPayment(type) {
                const statusDiv = document.getElementById('paymentStatus');
                const backButton = document.getElementById('backButton');
                
                if (type === 'valid') {
                    statusDiv.innerHTML = '✅ پرداخت با موفقیت انجام شد!';
                    statusDiv.className = 'payment-status success';
                    statusDiv.style.display = 'block';
                    
                    // Record successful payment
                    fetch('/api/payment', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(() => {
                        // Update back button to redirect with valid payment parameter
                        backButton.href = '/?from_valid_payment=true';
                    });
                } else {
                    statusDiv.innerHTML = '❌ پرداخت ناموفق بود. لطفاً دوباره تلاش کنید.';
                    statusDiv.className = 'payment-status error';
                    statusDiv.style.display = 'block';
                }
                
                // Show back button after a short delay
                setTimeout(() => {
                    backButton.style.display = 'inline-block';
                }, 1500);
            }
        </script>
    </body>
    </html>
    '''
    
    return payment_html

@app.route('/admin')
@login_required
def admin_page():
    """Admin page to view statistics"""
    counters = get_counters()
    
    admin_html = f'''
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>آمار وبسایت</title>
        <style>
            @font-face {{
                font-family: 'Bamdad';
                src: url('./static/fonts/Colak.ttf') format('truetype');
                font-weight: normal;
                font-style: normal;
            }}
            
            body {{
                font-family: 'Bamdad', 'Arial', sans-serif;
                background: linear-gradient(135deg, #050505 0%, #0a0a0a 25%, #0f0f0f 50%, #1a1a1a 75%, #2d2d2d 100%);
                min-height: 100vh;
                margin: 0;
                padding: 2rem;
                color: white;
                position: relative;
                overflow: hidden;
            }}
            
            body::before {{
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: 
                    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                    radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%);
                animation: backgroundShift 20s ease-in-out infinite;
                z-index: -1;
            }}
            
            @keyframes backgroundShift {{
                0%, 100% {{ transform: scale(1) rotate(0deg); }}
                33% {{ transform: scale(1.1) rotate(1deg); }}
                66% {{ transform: scale(0.9) rotate(-1deg); }}
            }}
            
            .stats-container {{
                max-width: 800px;
                margin: 0 auto;
                background: rgba(0, 0, 0, 0.4);
                padding: 2.5rem;
                border-radius: 20px;
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                box-shadow: 
                    0 8px 32px rgba(0, 0, 0, 0.6),
                    inset 0 1px 0 rgba(255, 255, 255, 0.05);
                position: relative;
                z-index: 1;
            }}
            
            .stats-container::before {{
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            }}
            
            .stat-item {{
                background: rgba(0, 0, 0, 0.3);
                margin: 1.5rem 0;
                padding: 2rem;
                border-radius: 20px;
                text-align: center;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.05);
                box-shadow: 
                    0 4px 16px rgba(0, 0, 0, 0.4),
                    inset 0 1px 0 rgba(255, 255, 255, 0.03);
                transition: all 0.3s ease;
            }}
            
            .stat-item:hover {{
                transform: translateY(-2px);
                box-shadow: 
                    0 8px 25px rgba(0, 0, 0, 0.5),
                    inset 0 1px 0 rgba(255, 255, 255, 0.08);
                background: rgba(0, 0, 0, 0.5);
            }}
            
            .stat-number {{
                font-size: 3.5rem;
                font-weight: bold;
                color: #2a6a5a;
                text-shadow: 0 0 20px rgba(42, 106, 90, 0.4);
                font-family: 'Bamdad', 'Arial', sans-serif;
            }}
            
            .stat-label {{
                font-size: 1.3rem;
                margin-top: 0.8rem;
                color: #a0a0b0;
                font-family: 'Bamdad', 'Arial', sans-serif;
            }}
            
            .back-button {{
                font-family: 'Bamdad', 'Arial', sans-serif;
                background: linear-gradient(135deg, #4a4a6a 0%, #5a4a7a 100%);
                color: white;
                border: none;
                padding: 1.2rem 2.5rem;
                font-size: 1.2rem;
                border-radius: 25px;
                cursor: pointer;
                margin-top: 2rem;
                text-decoration: none;
                display: inline-block;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                box-shadow: 
                    0 8px 25px rgba(0, 0, 0, 0.5),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.05);
            }}
            
            .back-button:hover {{
                transform: translateY(-3px) scale(1.02);
                box-shadow: 
                    0 15px 40px rgba(0, 0, 0, 0.6),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2),
                    0 0 20px rgba(74, 74, 106, 0.3);
                background: linear-gradient(135deg, #5a5a7a 0%, #6a5a8a 100%);
            }}
        </style>
    </head>
    <body>
        <div class="stats-container">
            <h1>آمار وبسایت</h1>
            
            <div class="stat-item">
                <div class="stat-number">{counters['visits']}</div>
                <div class="stat-label">تعداد بازدیدها</div>
            </div>
            
            <div class="stat-item">
                <div class="stat-number">{counters['clicks']}</div>
                <div class="stat-label">تعداد کلیک‌ها</div>
            </div>
            
            <div class="stat-item">
                <div class="stat-number">{counters['payments']}</div>
                <div class="stat-label">تعداد پرداخت‌ها</div>
            </div>
            
            <a href="/" class="back-button">بازگشت به صفحه اصلی</a>
        </div>
    </body>
    </html>
    '''
    
    return admin_html

if __name__ == '__main__':
    # Create database if it doesn't exist
    if not os.path.exists(DB_PATH):
        from database import create_database
        create_database()
    
    print("Starting Flask app...")
    print("Visit http://localhost:2345 to see the website")
    print("Visit http://localhost:2345/admin to see statistics")
    
    app.run(debug=True, host='0.0.0.0', port=2345) 