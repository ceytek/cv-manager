"""
Script to clear specific tables while keeping:
- users, roles, companies, departments, jobs
- subscription_plans, company_subscriptions, action_types
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import text
from app.core.database import engine, SessionLocal

# Tables to clear (in order - child tables first due to foreign keys)
TABLES_TO_CLEAR = [
    # History (depends on applications)
    "application_history",
    
    # Interview module (depends on candidates, jobs)
    "interview_answers",
    "interview_sessions", 
    "interview_questions",
    "interview_templates",
    
    # Likert module (depends on candidates, jobs)
    "likert_answers",
    "likert_sessions",
    "likert_questions", 
    "likert_templates",
    
    # Applications (depends on candidates, jobs)
    "applications",
    
    # Candidates (depends on companies)
    "candidates",
    
    # Templates (depends on companies/jobs)
    "agreement_templates",
    "rejection_templates",
    "job_intro_templates",
    "job_outro_templates",
    
    # Subscription related
    "usage_tracking",
    
    # Transactions
    "transactions",
]

# Tables to KEEP (for reference)
TABLES_TO_KEEP = [
    "users",
    "roles", 
    "companies",
    "departments",
    "jobs",
    "subscription_plans",
    "company_subscriptions",
    "action_types",
]

def clear_tables():
    """Clear all specified tables"""
    db = SessionLocal()
    
    try:
        print("=" * 50)
        print("🗑️  TABLE CLEARING SCRIPT")
        print("=" * 50)
        print("\n📌 Tables to KEEP:")
        for table in TABLES_TO_KEEP:
            print(f"   ✓ {table}")
        
        print("\n🗑️  Tables to CLEAR:")
        for table in TABLES_TO_CLEAR:
            print(f"   ✗ {table}")
        
        print("\n" + "-" * 50)
        
        # Confirm before proceeding
        confirm = input("\n⚠️  Are you sure you want to clear these tables? (yes/no): ")
        if confirm.lower() != 'yes':
            print("❌ Operation cancelled.")
            return
        
        print("\n🔄 Clearing tables...\n")
        
        cleared_count = 0
        for table in TABLES_TO_CLEAR:
            try:
                # First check if table exists
                check_query = text(f"""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = '{table}'
                    )
                """)
                result = db.execute(check_query).scalar()
                
                if result:
                    # Get row count before delete
                    count_query = text(f"SELECT COUNT(*) FROM {table}")
                    row_count = db.execute(count_query).scalar()
                    
                    # Delete all rows
                    delete_query = text(f"DELETE FROM {table}")
                    db.execute(delete_query)
                    
                    print(f"   ✓ {table}: {row_count} rows deleted")
                    cleared_count += 1
                else:
                    print(f"   ⚠ {table}: table not found, skipping")
                    
            except Exception as e:
                print(f"   ✗ {table}: ERROR - {str(e)}")
                db.rollback()
                continue
        
        # Commit all changes
        db.commit()
        
        print("\n" + "=" * 50)
        print(f"✅ DONE! Cleared {cleared_count} tables.")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ Fatal error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    clear_tables()
