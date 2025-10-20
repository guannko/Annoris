#!/usr/bin/env python3
"""
Apply Annoris API Database Schema
Applies schema.sql to Railway PostgreSQL database
"""

import os
import psycopg2
from pathlib import Path

# Database URL from Railway environment variable
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:yYYYQKUEKnVGPQVXzvFApzktTlAetPnD@postgres.railway.internal:5432/railway"
)

def apply_schema():
    """Apply database schema from schema.sql file"""
    
    # Read schema file
    schema_path = Path(__file__).parent / "schema.sql"
    with open(schema_path, "r") as f:
        schema_sql = f.read()
    
    # Connect to database
    print("🔗 Connecting to PostgreSQL...")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    
    try:
        # Execute schema
        print("📊 Applying schema...")
        cursor.execute(schema_sql)
        
        # Verify tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        tables = cursor.fetchall()
        
        print("\n✅ Schema applied successfully!")
        print(f"\n📋 Created tables: {len(tables)}")
        for table in tables:
            print(f"   - {table[0]}")
        
        # Verify indexes
        cursor.execute("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE schemaname = 'public'
            ORDER BY indexname;
        """)
        indexes = cursor.fetchall()
        
        print(f"\n🔍 Created indexes: {len(indexes)}")
        for index in indexes:
            print(f"   - {index[0]}")
        
        # Verify views
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        views = cursor.fetchall()
        
        print(f"\n👁️ Created views: {len(views)}")
        for view in views:
            print(f"   - {view[0]}")
        
        # Check initial data
        cursor.execute("SELECT COUNT(*) FROM projects;")
        project_count = cursor.fetchone()[0]
        print(f"\n🎯 Projects initialized: {project_count}")
        
        cursor.execute("SELECT name, status, target_revenue FROM projects ORDER BY priority;")
        projects = cursor.fetchall()
        for name, status, target in projects:
            print(f"   - {name}: {status} (€{target:,.2f} target)")
        
        print("\n🎉 Database ready!")
        
    except Exception as e:
        print(f"\n❌ Error applying schema: {e}")
        raise
    
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    apply_schema()
