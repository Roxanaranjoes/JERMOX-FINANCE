const axios = require('axios');
const BASE_URL = 'http://localhost:3000';

// Test colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Test results tracking
let testResults = {
    passed: 0,
    failed: 0,
    total: 0
};

// Helper function to log test results
function logTest(testName, passed, details = '') {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        console.log(`${colors.green}✅ PASS${colors.reset} - ${testName}`);
    } else {
        testResults.failed++;
        console.log(`${colors.red}❌ FAIL${colors.reset} - ${testName}`);
        if (details) {
            console.log(`   ${colors.yellow}${details}${colors.reset}`);
        }
    }
}

// Test 1: Health Check
async function testHealthCheck() {
    try {
        const response = await axios.get(`${BASE_URL}/health`);
        const passed = response.status === 200 && response.data.status === 'OK';
        logTest('Health Check', passed);
        return passed;
    } catch (error) {
        logTest('Health Check', false, error.message);
        return false;
    }
}

// Test 2: Root Endpoint
async function testRootEndpoint() {
    try {
        const response = await axios.get(`${BASE_URL}/`);
        const passed = response.status === 200 && response.data.message;
        logTest('Root Endpoint', passed);
        return passed;
    } catch (error) {
        logTest('Root Endpoint', false, error.message);
        return false;
    }
}

// Test 3: Database Connection Test
async function testDatabaseConnection() {
    try {
        const response = await axios.get(`${BASE_URL}/api/db/test`);
        const passed = response.status === 200 && response.data.success;
        logTest('Database Connection', passed);
        return passed;
    } catch (error) {
        logTest('Database Connection', false, error.message);
        return false;
    }
}

// Test 4: User Registration
async function testUserRegistration() {
    try {
        const userData = {
            nombre: 'Dieguiño',
            apellidos: 'Test',
            email: 'diego.test@jermox.com',
            ocupacion: 'QA/Integración',
            telefono: '3001234567',
            contraseña: 'TestPassword123!'
        };
        
        const response = await axios.post(`${BASE_URL}/api/auth/register`, userData);
        const passed = response.status === 201 && response.data.success;
        logTest('User Registration', passed);
        return passed;
    } catch (error) {
        logTest('User Registration', false, error.message);
        return false;
    }
}

// Test 5: User Login
async function testUserLogin() {
    try {
        const loginData = {
            email: 'diego.test@jermox.com',
            contraseña: 'TestPassword123!'
        };
        
        const response = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
        const passed = response.status === 200 && response.data.token;
        logTest('User Login', passed);
        return passed;
    } catch (error) {
        logTest('User Login', false, error.message);
        return false;
    }
}

// Test 6: Financial Summary
async function testFinancialSummary() {
    try {
        // First login to get token
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'diego.test@jermox.com',
            contraseña: 'TestPassword123!'
        });
        
        const token = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        
        const response = await axios.get(`${BASE_URL}/api/dashboard/summary`, { headers });
        const passed = response.status === 200 && response.data.success;
        logTest('Financial Summary', passed);
        return passed;
    } catch (error) {
        logTest('Financial Summary', false, error.message);
        return false;
    }
}

// Test 7: Tax Summary
async function testTaxSummary() {
    try {
        // First login to get token
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'diego.test@jermox.com',
            contraseña: 'TestPassword123!'
        });
        
        const token = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        
        const response = await axios.get(`${BASE_URL}/api/tax/summary`, { headers });
        const passed = response.status === 200 && response.data.success;
        logTest('Tax Summary', passed);
        return passed;
    } catch (error) {
        logTest('Tax Summary', false, error.message);
        return false;
    }
}

// Test 8: Spending Analysis
async function testSpendingAnalysis() {
    try {
        // First login to get token
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'diego.test@jermox.com',
            contraseña: 'TestPassword123!'
        });
        
        const token = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        
        const response = await axios.get(`${BASE_URL}/api/dashboard/analysis`, { headers });
        const passed = response.status === 200 && response.data.success;
        logTest('Spending Analysis', passed);
        return passed;
    } catch (error) {
        logTest('Spending Analysis', false, error.message);
        return false;
    }
}

// Test 9: Database Views Test
async function testDatabaseViews() {
    try {
        const response = await axios.get(`${BASE_URL}/api/db/views`);
        const passed = response.status === 200 && response.data.views;
        logTest('Database Views', passed);
        return passed;
    } catch (error) {
        logTest('Database Views', false, error.message);
        return false;
    }
}

// Test 10: Database Schema Test
async function testDatabaseSchema() {
    try {
        const response = await axios.get(`${BASE_URL}/api/db/schema`);
        const passed = response.status === 200 && response.data.tables;
        logTest('Database Schema', passed);
        return passed;
    } catch (error) {
        logTest('Database Schema', false, error.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log(`${colors.bright}${colors.blue} INICIANDO PRUEBAS DE INTEGRACIÓN JERMOX FINANCE${colors.reset}`);
    console.log(`${colors.cyan}Base URL: ${BASE_URL}${colors.reset}\n`);
    
    console.log(`${colors.yellow} Ejecutando pruebas de conectividad y funcionalidad...${colors.reset}\n`);
    
    // Run tests in sequence
    await testHealthCheck();
    await testRootEndpoint();
    await testDatabaseConnection();
    await testUserRegistration();
    await testUserLogin();
    await testFinancialSummary();
    await testTaxSummary();
    await testSpendingAnalysis();
    await testDatabaseViews();
    await testDatabaseSchema();
    
    // Print summary
    console.log(`\n${colors.bright}${colors.blue}RESUMEN DE PRUEBAS${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}Exitosas: ${testResults.passed}${colors.reset}`);
    console.log(`${colors.red}Fallidas: ${testResults.failed}${colors.reset}`);
    console.log(`${colors.yellow}Total: ${testResults.total}${colors.reset}`);
    
    const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
    console.log(`${colors.cyan} Tasa de éxito: ${successRate}%${colors.reset}`);
    
    if (testResults.failed === 0) {
        console.log(`\n${colors.bright}${colors.green} ¡Todas las pruebas pasaron exitosamente!${colors.reset}`);
    } else {
        console.log(`\n${colors.bright}${colors.yellow}  Algunas pruebas fallaron. Revisa los logs arriba.${colors.reset}`);
    }
    
    console.log(`\n${colors.cyan}🔧 Próximos pasos:${colors.reset}`);
    console.log(`   • Revisar logs de errores si hay fallas`);
    console.log(`   • Verificar que el servidor esté ejecutándose en ${BASE_URL}`);
    console.log(`   • Verificar que la base de datos esté configurada correctamente`);
    console.log(`   • Revisar variables de entorno en backend/.env`);
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(error => {
        console.error(`\n${colors.red}💥 Error ejecutando las pruebas:${colors.reset}`, error.message);
        process.exit(1);
    });
}

module.exports = {
    runAllTests,
    testHealthCheck,
    testRootEndpoint,
    testDatabaseConnection,
    testUserRegistration,
    testUserLogin,
    testFinancialSummary,
    testTaxSummary,
    testSpendingAnalysis,
    testDatabaseViews,
    testDatabaseSchema
};
