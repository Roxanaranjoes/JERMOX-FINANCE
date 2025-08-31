# 🧾 Sistema de Impuestos - Explicación

## 📋 **¿Por qué aparece "No disponible" en el resumen tributario?**

El resumen tributario en el dashboard muestra "No disponible" cuando el usuario **no ha completado su información fiscal**. Esto es normal y esperado para usuarios nuevos.

## 🔄 **Flujo para ver el resumen tributario:**

### **1. Registro del usuario** ✅
- Usuario se registra con email y contraseña
- Se crea automáticamente su `financial_profile`

### **2. Información fiscal** ❌ (FALTA)
- Usuario debe ir a **"Ir a Declaración de impuestos"**
- Completar el formulario con:
  - Bienes brutos totales
  - Ingresos totales del año
  - Gastos totales del año

### **3. Resumen tributario** ✅ (APARECE)
- Una vez completada la información fiscal
- El dashboard mostrará:
  - Base gravable estimada
  - Impuesto estimado

## 🚨 **Errores comunes y soluciones:**

### **Error 404: "Sin tax_info para el usuario"**
- **Causa**: El usuario no ha completado su información fiscal
- **Solución**: Ir a la página de impuestos y completar el formulario

### **Error 500: Error interno del servidor**
- **Causa**: Problema en el backend o base de datos
- **Solución**: Verificar que el backend esté funcionando

## 🎯 **Cómo completar la información fiscal:**

1. **En el dashboard**, hacer clic en **"Ir a Declaración de impuestos"**
2. **Completar el formulario** con datos reales o de prueba
3. **Guardar** la información
4. **Volver al dashboard** - el resumen tributario aparecerá automáticamente

## 📊 **Campos requeridos en el formulario fiscal:**

- **Bienes brutos totales**: Valor total de todos los bienes
- **Ingresos totales del año**: Suma de todos los ingresos anuales
- **Gastos totales del año**: Suma de todos los gastos anuales

## 🔧 **Configuración del sistema:**

El sistema de impuestos se configura con variables de entorno en el backend:

```env
# Valor de la UVT en COP (Unidad de Valor Tributario)
CO_UVT=47065

# Escalas progresivas de impuestos (opcional)
TAX_BRACKETS_JSON=[{"max_uvt":95,"rate":0.0,"marginal_uvt":0},{"max_uvt":150,"rate":0.19,"marginal_uvt":0}]
```

## 💡 **Tips para usuarios:**

1. **No te preocupes** si ves "No disponible" al principio
2. **Completa tu información fiscal** cuando tengas los datos
3. **Los cálculos son estimaciones** basadas en la información proporcionada
4. **Puedes actualizar** la información fiscal en cualquier momento

## 🚀 **Próximas mejoras:**

- [ ] Validación de datos en el frontend
- [ ] Historial de declaraciones fiscales
- [ ] Cálculos más precisos con más deducciones
- [ ] Integración con sistemas tributarios oficiales
