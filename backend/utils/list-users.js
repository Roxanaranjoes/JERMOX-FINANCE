// utils/list-users.js - Script para listar usuarios existentes
require('dotenv').config();
const pool = require('../db');

async function listUsers() {
  try {
    console.log('👥 Listando usuarios en la base de datos...');
    
    // Verificar conexión
    const { rows } = await pool.query('SELECT NOW() AS now');
    console.log('✅ Conexión a DB exitosa:', rows[0].now);
    
    // Listar usuarios existentes
    const users = await pool.query(`
      SELECT 
        user_id, 
        email, 
        first_name, 
        last_name,
        is_active,
        created_at 
      FROM user_account 
      ORDER BY created_at DESC
    `);
    
    console.log(`\n📊 Total de usuarios: ${users.rowCount}`);
    
    if (users.rowCount > 0) {
      console.log('\n📋 Lista de usuarios:');
      console.log('─'.repeat(80));
      console.log('ID\t| Email\t\t\t| Nombre\t\t| Estado\t| Creado');
      console.log('─'.repeat(80));
      
      users.rows.forEach(user => {
        const status = user.is_active ? '✅ Activo' : '❌ Inactivo';
        const created = new Date(user.created_at).toLocaleDateString('es-CO');
        console.log(`${user.user_id}\t| ${user.email.padEnd(20)}\t| ${(user.first_name + ' ' + user.last_name).padEnd(20)}\t| ${status}\t| ${created}`);
      });
      
      console.log('─'.repeat(80));
    } else {
      console.log('✅ No hay usuarios registrados');
    }
    
  } catch (err) {
    console.error('❌ Error al listar usuarios:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  listUsers();
}

module.exports = { listUsers };
