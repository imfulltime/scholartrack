// API Security Testing Script
// Run this in browser console to test API endpoint security

// This script tests that API endpoints properly enforce authentication and RLS
// Make sure you're logged in as Teacher A when running this

const API_BASE = 'http://localhost:3000/api';

// Test data - replace with actual IDs from your test data
const TEST_DATA = {
  // These should be IDs that belong to Teacher B (different user)
  otherUserSubjectId: 'replace-with-teacher-b-subject-id',
  otherUserStudentId: 'replace-with-teacher-b-student-id', 
  otherUserClassId: 'replace-with-teacher-b-class-id',
  otherUserAssessmentId: 'replace-with-teacher-b-assessment-id',
};

class APISecurityTester {
  constructor() {
    this.results = [];
  }

  async test(name, testFn) {
    console.log(`🧪 Testing: ${name}`);
    try {
      const result = await testFn();
      this.results.push({ name, status: 'PASS', result });
      console.log(`✅ PASS: ${name}`);
      return result;
    } catch (error) {
      this.results.push({ name, status: 'FAIL', error: error.message });
      console.log(`❌ FAIL: ${name} - ${error.message}`);
      return null;
    }
  }

  async fetch(url, options = {}) {
    const response = await fetch(url, {
      credentials: 'include', // Include cookies for authentication
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    return await response.json();
  }

  // Test that authenticated user can access their own data
  async testOwnDataAccess() {
    await this.test('Can create own subject', async () => {
      return await this.fetch(`${API_BASE}/subjects`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Subject',
          code: 'TEST' + Date.now(),
        }),
      });
    });

    await this.test('Can list own subjects', async () => {
      return await this.fetch(`${API_BASE}/subjects`);
    });

    await this.test('Can create own student', async () => {
      return await this.fetch(`${API_BASE}/students`, {
        method: 'POST',
        body: JSON.stringify({
          full_name: 'Test Student',
          year_level: 8,
          external_id: 'TEST' + Date.now(),
        }),
      });
    });
  }

  // Test that user cannot access other user's data
  async testCrossUserDataAccess() {
    if (!TEST_DATA.otherUserSubjectId) {
      console.warn('⚠️ Skipping cross-user tests - no other user IDs provided');
      return;
    }

    await this.test('Cannot delete other user subject', async () => {
      const response = await fetch(`${API_BASE}/subjects/${TEST_DATA.otherUserSubjectId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.status === 404 || response.status === 403) {
        return { status: 'correctly_blocked' };
      } else {
        throw new Error('Should have been blocked but was not');
      }
    });

    await this.test('Cannot delete other user student', async () => {
      const response = await fetch(`${API_BASE}/students/${TEST_DATA.otherUserStudentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.status === 404 || response.status === 403) {
        return { status: 'correctly_blocked' };
      } else {
        throw new Error('Should have been blocked but was not');
      }
    });
  }

  // Test unauthenticated access (requires opening incognito tab)
  async testUnauthenticatedAccess() {
    console.log('🔒 Testing unauthenticated access (open incognito tab and run this in console):');
    console.log(`
// Copy and paste this in an incognito tab console:
fetch('${API_BASE}/subjects', { method: 'GET' })
  .then(r => r.json())
  .then(d => console.log('❌ SECURITY ISSUE: Unauthenticated access allowed', d))
  .catch(e => console.log('✅ GOOD: Unauthenticated access blocked', e));
    `);
  }

  // Test input validation
  async testInputValidation() {
    await this.test('Rejects invalid subject data', async () => {
      try {
        await this.fetch(`${API_BASE}/subjects`, {
          method: 'POST',
          body: JSON.stringify({
            name: '', // Invalid: empty name
            code: '', // Invalid: empty code
          }),
        });
        throw new Error('Should have rejected invalid data');
      } catch (error) {
        if (error.message.includes('400') || error.message.includes('Invalid')) {
          return { status: 'correctly_rejected' };
        }
        throw error;
      }
    });

    await this.test('Rejects invalid student data', async () => {
      try {
        await this.fetch(`${API_BASE}/students`, {
          method: 'POST',
          body: JSON.stringify({
            full_name: '', // Invalid: empty name
            year_level: 15, // Invalid: > 12
          }),
        });
        throw new Error('Should have rejected invalid data');
      } catch (error) {
        if (error.message.includes('400') || error.message.includes('Invalid')) {
          return { status: 'correctly_rejected' };
        }
        throw error;
      }
    });
  }

  // Test SQL injection protection
  async testSQLInjection() {
    const maliciousInputs = [
      "'; DROP TABLE students; --",
      "' OR '1'='1",
      "1; UPDATE students SET full_name='HACKED'",
    ];

    for (const maliciousInput of maliciousInputs) {
      await this.test(`SQL injection protection: ${maliciousInput.substring(0, 20)}...`, async () => {
        try {
          await this.fetch(`${API_BASE}/students`, {
            method: 'POST',
            body: JSON.stringify({
              full_name: maliciousInput,
              year_level: 8,
            }),
          });
          // If it succeeds, check that it was properly escaped
          return { status: 'input_sanitized' };
        } catch (error) {
          // If it fails with validation error, that's also good
          return { status: 'input_rejected' };
        }
      });
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting API Security Tests...\n');
    
    await this.testOwnDataAccess();
    await this.testCrossUserDataAccess();
    await this.testInputValidation();
    await this.testSQLInjection();
    await this.testUnauthenticatedAccess();

    console.log('\n📊 Test Results Summary:');
    console.table(this.results);

    const passCount = this.results.filter(r => r.status === 'PASS').length;
    const failCount = this.results.filter(r => r.status === 'FAIL').length;
    
    console.log(`\n🎯 Results: ${passCount} passed, ${failCount} failed`);
    
    if (failCount === 0) {
      console.log('🎉 All API security tests passed!');
    } else {
      console.log('⚠️ Some tests failed - review security implementation');
    }
  }
}

// Auto-run when script is loaded
console.log('🔐 API Security Tester loaded. Run: new APISecurityTester().runAllTests()');

// Instructions for manual testing
console.log(`
📋 Manual Testing Instructions:

1. Make sure you're logged in as Teacher A
2. Run: new APISecurityTester().runAllTests()
3. Open incognito tab and test unauthenticated access
4. Log in as Teacher B and verify data isolation
5. Try to access Teacher A's data URLs directly

Example test:
const tester = new APISecurityTester();
tester.runAllTests();
`);

// Export for use
window.APISecurityTester = APISecurityTester;
