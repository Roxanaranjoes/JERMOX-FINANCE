## Ingresos
+PK - ingresos_ID
tipo_ingreso (enum)
valor_ingreso
categoria
created_at
updated_at

## Egresos
+PK - egresos_ID
tipo_egreso (enum)
valor_egreso
categoria
created_at
updated_at

## usuario
+PF - usuario_ID
nombre
apellidos
email
edad
ocupacion
telefono
contraseña
FK - transaccion_ID
is_active
created_at
updated_at

## perfil_financiero
+PF - perfil_ID
FK - usuario_ID
ingresos_mensuales
egresos_mensuales
porcentaje_ahorro
objetivo
horizonte
tolerancia_riesgo
mayor_gasto
deudas(boolean)
monto_deuda
tipo_deuda
preferencia_tips

## tributaria
+PK - tributaria_ID
patrimonio_bruto
acumulado_ingreso
acumulado_egreso
cantidad_transacciones
created_at
updated_at

## Transacciones
+PK - transaccion_ID 
tipo ENUM('ingreso', 'egreso')
referencia_ID INT  -- FK genérica a ingresos o egresos según tipo
created_at
