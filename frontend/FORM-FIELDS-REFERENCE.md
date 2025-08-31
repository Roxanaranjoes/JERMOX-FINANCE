# 📋 Referencia de Campos del Formulario de Registro

## 🎯 **Campos del Perfil Financiero**

### **Objetivo Principal (`goal`)**
- `1` = Ahorrar para emergencia
- `2` = Comprar vivienda  
- `3` = Invertir a largo plazo
- `4` = Reducir deudas
- `5` = Educación / formación
- `6` = Otro

### **Horizonte de Tiempo (`time_horizon`)**
- `1` = Corto plazo (0-2 años)
- `2` = Mediano plazo (3-5 años)
- `3` = Largo plazo (más de 5 años)

### **Tolerancia al Riesgo (`risk_tolerance`)**
- `1` = Baja
- `2` = Media
- `3` = Alta

### **¿Tienes Deudas? (`has_debt`)**
- `true` = Sí
- `false` = No

### **Preferencia de Tips (`tips_preference`)**
- `1` = Ahorro y control de gastos
- `2` = Inversión y crecimiento de capital
- `3` = Tributario / impuestos
- `4` = Educación financiera

## 🔧 **Campos Numéricos**

### **Ingresos y Gastos**
- `monthly_income`: Número entero (COP)
- `monthly_expense`: Número entero (COP)
- `savings_percentage`: Número entero (0-80)
- `debt_amount`: Número entero (COP, opcional)

### **Campos de Texto**
- `biggest_expense`: Texto libre
- `debt_type`: Texto libre (opcional)

## 📝 **Notas Importantes**

1. **Todos los campos de selección ahora envían valores numéricos** en lugar de texto
2. **El campo `has_debt` envía booleanos** (`true`/`false`) en lugar de strings
3. **Los campos numéricos se convierten** usando `Number()` antes de enviar
4. **Los campos opcionales** se manejan con valores por defecto apropiados

## 🚀 **Uso en el Código**

```javascript
const fp = {
  user_id: login.user.id,
  monthly_income: Number(qs('#monthly_income').value),
  monthly_expense: Number(qs('#monthly_expense').value),
  savings_percentage: Number(qs('#savings_percentage').value),
  goal: Number(qs('#goal').value),           // ✅ Ahora es número
  time_horizon: Number(qs('#time_horizon').value), // ✅ Ahora es número
  risk_tolerance: Number(qs('#risk_tolerance').value), // ✅ Ahora es número
  biggest_expense: qs('#biggest_expense').value,
  has_debt: qs('#has_debt').value === 'true', // ✅ Ahora es booleano
  debt_amount: Number(qs('#debt_amount').value || 0),
  debt_type: qs('#debt_type').value,
  tips_preference: Number(qs('#tips_preference').value) // ✅ Ahora es número
};
```

## 🔍 **Verificación en Base de Datos**

Los campos ahora se envían con los tipos correctos:
- ✅ `goal`: INTEGER
- ✅ `time_horizon`: INTEGER  
- ✅ `risk_tolerance`: INTEGER
- ✅ `has_debt`: BOOLEAN
- ✅ `tips_preference`: INTEGER
- ✅ `monthly_income`: INTEGER
- ✅ `monthly_expense`: INTEGER
- ✅ `savings_percentage`: INTEGER
- ✅ `debt_amount`: INTEGER
- ✅ `biggest_expense`: TEXT
- ✅ `debt_type`: TEXT
