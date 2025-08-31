import { api } from "./api";
import { showSuccess, showError, showConfirm, showApiError } from "./ui.js";
const qs = (s) => document.querySelector(s);

const formLogin = document.getElementById("formLogin");
if (formLogin)
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const email = qs("#email").value.trim();
      const password = qs("#password").value;
      const data = await api.login({ email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      showSuccess("¡Bienvenido!");
      location.href = "dashboard.html";
    } catch (err) {
      showApiError(err, "Error de login");
    }
  });

const formReg = document.getElementById("formRegister");
if (formReg)
  formReg.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const payload = {
        first_name: qs("#first_name").value.trim(),
        last_name: qs("#last_name").value.trim(),
        email: qs("#reg_email").value.trim(),
        phone: qs("#phone").value.trim(),
        password: qs("#reg_password").value,
      };
      await api.register(payload);
      const login = await api.login({
        email: payload.email,
        password: payload.password,
      });
      localStorage.setItem("token", login.token);
      localStorage.setItem("user", JSON.stringify(login.user));
      const fp = {
        user_id: login.user.id,
        monthly_income: Number(qs("#monthly_income").value),
        monthly_expense: Number(qs("#monthly_expense").value),
        savings_percentage: Number(qs("#savings_percentage").value),
        goal: Number(qs("#goal").value),
        time_horizon: Number(qs("#time_horizon").value),
        risk_tolerance: Number(qs("#risk_tolerance").value),
        biggest_expense: qs("#biggest_expense").value,
        has_debt: qs("#has_debt").value === "true",
        debt_amount: Number(qs("#debt_amount").value || 0),
        debt_type: qs("#debt_type").value,
        tips_preference: Number(qs("#tips_preference").value),
      };
      await api.createFinancialProfile(fp);
      showSuccess("Registro completo. ¡Vamos al dashboard!");
      location.href = "dashboard.html";
    } catch (err) {
      console.error("Error completo:", err);

      if (err.status === 409) {
        // Mostrar confirmación para ir al login
        showConfirm(
          "Este email ya está registrado. ¿Quieres hacer login en su lugar?",
          () => (location.href = "login.html"),
          () => {} // No hacer nada si cancela
        );
      } else {
        showApiError(err, "Error al registrar");
      }
    }
  });
