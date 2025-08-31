// utils/cleanup.js - Script para limpiar la base de datos
require('dotenv').config();
const pool = require('../db');

async function cleanupTestData() {
  try {
    console.log('🧹 Iniciando limpieza de datos de prueba...');
    
    // Verificar conexión
    const { rows } = await pool.query('SELECT NOW() AS now');
    console.log('✅ Conexión a DB exitosa:', rows[0].now);
    
    // Listar usuarios existentes
    const users = await pool.query('SELECT user_id, email, first_name, created_at FROM user_account ORDER BY created_at DESC');
    console.log(`📊 Usuarios encontrados: ${users.rowCount}`);
    
    if (users.rowCount > 0) {
      users.rows.forEach(user => {
        console.log(`  - ID: ${user.user_id}, Email: ${user.email}, Nombre: ${user.first_name}, Creado: ${user.created_at}`);
      });
      
      // Preguntar si limpiar
      console.log('\n⚠️  ¿Deseas eliminar todos los usuarios? (s/n)');
      process.stdin.once('data', async (data) => {
        const answer = data.toString().trim().toLowerCase();
        
        if (answer === 's' || answer === 'si' || answer === 'y' || answer === 'yes') {
          console.log('🗑️  Eliminando usuarios...');
          
          // Eliminar en orden correcto (por referencias)
          await pool.query('DELETE FROM transaction');
          await pool.query('DELETE FROM tax_info');
          await pool.query('DELETE FROM financial_profile');
          await pool.query('DELETE FROM expense');
          await pool.query('DELETE FROM income');
          await pool.query('DELETE FROM user_account');
          
          console.log('✅ Base de datos limpiada exitosamente');
        } else {
          console.log('❌ Operación cancelada');
        }
        
        await pool.end();
        process.exit(0);
      });
    } else {
      console.log('✅ No hay usuarios para limpiar');
      await pool.end();
      process.exit(0);
    }
    
  } catch (err) {
    console.error('❌ Error durante la limpieza:', err);
    await pool.end();
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanupTestData();
}

module.exports = { cleanupTestData };
