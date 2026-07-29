import sqlite3
import os

def create_database():
    """Create SQLite database and tables for tracking website statistics"""
    
    # Create database directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    
    # Connect to SQLite database (creates it if it doesn't exist)
    conn = sqlite3.connect('data/website_stats.db')
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS counters (
            id INTEGER PRIMARY KEY,
            clicks INTEGER DEFAULT 0,
            payments INTEGER DEFAULT 0,
            visits INTEGER DEFAULT 0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create a single row for counters if it doesn't exist
    cursor.execute('''
        INSERT OR IGNORE INTO counters (id, clicks, payments, visits) 
        VALUES (1, 0, 0, 0)
    ''')
    
    # Create visits log table for detailed tracking
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS visits_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            user_agent TEXT
        )
    ''')
    
    # Create clicks log table for detailed tracking
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS clicks_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            action TEXT,
            ip_address TEXT,
            user_agent TEXT
        )
    ''')
    
    # Create payments log table for detailed tracking
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS payments_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            user_agent TEXT
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database created successfully!")

if __name__ == "__main__":
    create_database() 