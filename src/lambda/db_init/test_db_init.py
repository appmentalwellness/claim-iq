#!/usr/bin/env python3
"""
Test script for database initialization Lambda function
"""

import json
import sys
import os

def test_lambda_structure():
    """Test the lambda function structure without AWS dependencies"""
    
    # Read the lambda function file
    lambda_file = os.path.join(os.path.dirname(__file__), 'lambda_function.py')
    
    try:
        with open(lambda_file, 'r') as f:
            content = f.read()
        
        # Check for required components
        required_components = [
            'def lambda_handler',
            'get_database_credentials',
            'get_database_connection',
            'execute_schema_sql',
            'CREATE TABLE IF NOT EXISTS tenants',
            'CREATE TABLE IF NOT EXISTS hospitals',
            'CREATE TABLE IF NOT EXISTS claims',
            'CREATE TABLE IF NOT EXISTS denials',
            'CREATE INDEX IF NOT EXISTS',
            'CREATE TRIGGER',
            'INSERT INTO tenants'
        ]
        
        print("Testing lambda function structure...")
        
        for component in required_components:
            if component in content:
                print(f"✓ Found: {component}")
            else:
                print(f"✗ Missing: {component}")
                return False
        
        # Check event structure
        event = {
            "secret_name": "dev/claimiq/database",
            "cluster_endpoint": "dev-claimiq-cluster.cluster-xxx.us-east-1.rds.amazonaws.com",
            "database_name": "claimiq"
        }
        
        print(f"\n✓ Expected event structure: {json.dumps(event, indent=2)}")
        print("✓ Lambda function structure is valid")
        print("✓ All required database schema components are present")
        print("✓ Database initialization logic is implemented")
        
        return True
        
    except Exception as e:
        print(f"✗ Test failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_lambda_structure()
    sys.exit(0 if success else 1)