// backend/openai.js
require("dotenv").config();
const OpenAI = require("openai");
const { supabase } = require("./db"); // Cliente de Supabase

// ✅ Crear un cliente OpenAI como Singleton
// Solo se inicializa una vez y se reutiliza en todas las llamadas
let client;
function getClient() {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log("✅ Cliente de OpenAI inicializado");
  }
  return client;
}

// ✅ Testear conexión con OpenAI
async function testOpenAIConnection() {
  try {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Test de conexión con OpenAI" }],
      max_tokens: 50,
    });

    console.log("✅ Conexión con OpenAI exitosa:", response.choices[0].message.content);
  } catch (error) {
    console.error("❌ Error en conexión con OpenAI:", error.message);
  }
}

// 🔍 Obtener perfil financiero desde Supabase
async function getPerfilFinanciero(usuario_ID) {
  try {
    const { data, error } = await supabase
      .from("perfil_financiero")
      .select("*")
      .eq("usuario_ID", usuario_ID)
      .single();

    if (error) {
      console.error("❌ Error al obtener perfil financiero:", error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error("❌ Error inesperado:", err.message);
    return null;
  }
}

// 🤖 Generar tips financieros personalizados con OpenAI
async function generarTipsFinancieros(usuario_ID) {
  try {
    const perfil = await getPerfilFinanciero(usuario_ID);

    if (!perfil) {
      return ["No se encontró perfil financiero para este usuario."];
    }

    // Prompt con los datos del perfil
    const prompt = `
Eres un asesor financiero profesional. 
Genera 3 tips financieros prácticos, claros y personalizados para el siguiente perfil:

Ingresos mensuales: ${perfil.ingresos_mensuales}
Egresos mensuales: ${perfil.egresos_mensuales}
Porcentaje de ahorro: ${perfil.porcentaje_ahorro}%
Objetivo financiero: ${perfil.objetivo}
Horizonte de inversión (años): ${perfil.horizonte}
Tolerancia al riesgo: ${perfil.tolerancia_riesgo}
Mayor gasto: ${perfil.mayor_gasto}
¿Tiene deudas?: ${perfil.deudas ? "Sí" : "No"}
Monto de deuda: ${perfil.monto_deuda || 0}
Tipo de deuda: ${perfil.tipo_deuda || "N/A"}
Preferencia de tips: ${perfil.preferencia_tips || "No especificada"}

Responde en formato de lista con recomendaciones claras.
    `;

    const client = getClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    });

    const tips = response.choices[0].message.content
      .split("\n")
      .filter((line) => line.trim() !== "");

    return tips;
  } catch (error) {
    console.error("❌ Error al generar tips:", error.message);
    return ["No se pudieron generar tips financieros en este momento."];
  }
}

module.exports = {
  testOpenAIConnection,
  generarTipsFinancieros,
};
