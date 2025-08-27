// Elemento raíz
const app = document.getElementById("app");

// Estado de usuarios guardados en localStorage
let users = JSON.parse(localStorage.getItem("users")) || [];

function funcionfech(ruta, raiz, callback) {
    fetch(ruta)
        .then(res => res.text())
        .then(html => {
            if (!raiz) return;
            raiz.innerHTML = html;
            if (callback) callback(); // <- ejecutar lógica después de renderizar

        })
        .catch(err => console.error('Error cargando plantilla:', ruta, err));
}

// Renderizar vistas
function renderLogin() {
    funcionfech('./pages/login.html', app);
}

function renderRegister() {
    funcionfech('./pages/register.html', app);
    //cargar perfil financiero después de registrarse

}

function renderDashboard() {
    funcionfech('./pages/dashboard.html', app, () => {
        const session = JSON.parse(localStorage.getItem("session"));
        if (session) {
            const name = session.name;
            const welcomeEl = document.querySelector('.dashboard__welcome');
            if (welcomeEl) welcomeEl.innerHTML = `Bienvenido, ${name} 🎉`;
        }

        // Al inyectar el HTML, los elementos del sidebar existen ahora. Enlazamos botones.
        const dashboardRoot = document.getElementById('dashboard');
        const buttons = document.querySelectorAll('.dashboard__button');
        if (buttons && buttons.length) {
            // Asumimos el orden: Home, Declaración de impuestos, Panel Tributario Avanzado, Perfil del Usuario
            buttons[0].addEventListener('click', renderHome);
            buttons[1].addEventListener('click', renderDeclaracionDeImpuestos);
            buttons[2].addEventListener('click', renderPanelTributarioAvanzado);
            buttons[3].addEventListener('click', renderPerfilDelUsuario);
        }

        // Cargar contenido por defecto
        renderHome();
    });
}

// Funciones de autenticación
function register() {
    const form = document.querySelector('.auth__form');
    if (!form) {
        alert("Formulario no encontrado");
        return;
    }

    const name = form.querySelector('input[name="name"]')?.value?.trim();
    const birthday = form.querySelector('input[name="birthday"]')?.value;
    const email = form.querySelector('input[name="Email"]')?.value;
    const password = form.querySelector('input[name="password"]')?.value;

    if (!name || !birthday || !email || !password) {
        alert("Por favor completa todos los campos");
        return;
    }

    // Validar que sea mayor o igual a 18 años
    const dob = new Date(birthday);
    if (Number.isNaN(dob.getTime())) {
        alert("Fecha de nacimiento inválida");
        return;
    }
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }

    if (age < 18) {
        alert("Debes ser mayor de 18 años para registrarte");
        return;
    }

    if (users.find(u => u.email === email)) {
        alert("El usuario ya existe");
        return;
    }

    const newUser = { name, birthday, email, password };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    alert("Registro exitoso.");
    // Cargar perfil financiero después de registrarse
    fetch('./pages/dashboard-pages/perfil_del_usuario.html')
        .then(res => res.text())
        .then(html => {
            if (!app) return;
            app.innerHTML = html;

            initPerfilFinanciero(); // Inicializar lógica del perfil financiero

            // Agregar evento al botón guardar del perfil
            const saveBtn = document.querySelector('#btn-guardar-perfil');
            if (saveBtn) {
                saveBtn.addEventListener('click', (e) => {
                    e.preventDefault();

                    // Aquí podrías guardar datos extra del perfil si es necesario
                    alert("Perfil guardado correctamente");

                    // Volver a la vista de login
                    renderLogin();
                });
            }
        })
        .catch(err => console.error('Error cargando plantilla:', err));
}

function login() {
    const form = document.querySelector('.auth__form');
    if (!form) {
        alert("Formulario no encontrado");
        return;
    }

    const email = form.querySelector('input[type="email"]')?.value;
    const password = form.querySelector('input[type="password"]')?.value;

    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        alert("Credenciales incorrectas");
        return;
    }

    localStorage.setItem("session", JSON.stringify(user));
    renderDashboard(user.name || user.email);
}

function logout() {
    localStorage.removeItem("session");
    renderLogin();
}

// Verificar si hay sesión activa
const session = JSON.parse(localStorage.getItem("session"));
session ? renderDashboard(session.name) : renderLogin();

// -----------------------------------------------------------------------
// DASHBOARD.JS - Renderizar vistas dentro del dashboard (obtienen la raíz dinámicamente)
function renderHome() {
    const dashboardRoot = document.getElementById('dashboard');
    if (!dashboardRoot) return;
    funcionfech('./pages/dashboard-pages/home.html', dashboardRoot);
}

function renderDeclaracionDeImpuestos() {
    const dashboardRoot = document.getElementById('dashboard');
    if (!dashboardRoot) return;
    funcionfech('./pages/dashboard-pages/declaracion_de_impuestos.html', dashboardRoot);
}

function renderPanelTributarioAvanzado() {
    const dashboardRoot = document.getElementById('dashboard');
    if (!dashboardRoot) return;
    funcionfech('./pages/dashboard-pages/panel_tributario_avanzado.html', dashboardRoot);
}

function renderPerfilDelUsuario() {
    const dashboardRoot = document.getElementById('dashboard');
    fetch('./pages/dashboard-pages/perfil_del_usuario.html')
        .then(res => res.text())
        .then(html => {
            if (!dashboardRoot) return;
            dashboardRoot.innerHTML = html;
            initPerfilFinanciero(); // Inicializar lógica del perfil financiero
        })
        .catch(err => console.error('Error cargando plantilla:', err));
}

// -----------------------------------------------------------------------
// PERFIL DEL USUARIO - Renderizar datos del usuario en el perfil
function initPerfilFinanciero() {
    // Sincronizar range y número
    const range = document.getElementById('ahorroRange');
    const number = document.getElementById('ahorroNumber');
    range.addEventListener('input', () => { number.value = range.value; });
    number.addEventListener('input', () => { if (number.value < 0) number.value = 0; if (number.value > 100) number.value = 100; range.value = number.value; });

    // Mostrar campo 'otro' para objetivo
    const objetivos = document.querySelectorAll('input[name="objetivo"]');
    const objetivoOtro = document.getElementById('objetivo_otro');
    objetivos.forEach(r => r.addEventListener('change', () => {
        objetivoOtro.style.display = (document.querySelector('input[name="objetivo"]:checked').value === 'otro') ? 'block' : 'none';
    }));

    // Mostrar detalles de deuda
    const deudaRadios = document.querySelectorAll('input[name="tieneDeudas"]');
    const deudasDetalle = document.getElementById('deudas_detalle');
    deudaRadios.forEach(r => r.addEventListener('change', () => {
        deudasDetalle.style.display = (document.querySelector('input[name="tieneDeudas"]:checked').value === 'si') ? 'block' : 'none';
    }));

    // Guardar en localStorage al enviar
    const form = document.getElementById('perfilFinancieroForm');
    const status = document.getElementById('saveStatus');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = new FormData(form);
        const obj = {};
        for (const [k, v] of data.entries()) {
            // Agrupar checkboxes 'gastos' en array
            if (k === 'gastos') {
                if (!obj.gastos) obj.gastos = [];
                obj.gastos.push(v);
            } else {
                obj[k] = v;
            }
        }
        // Asegurar campos numéricos como números
        obj.ingresos = parseFloat(obj.ingresos || 0);
        obj.egresos = parseFloat(obj.egresos || 0);
        obj.ahorro = parseFloat(obj.ahorroNumber || obj.ahorroRange || 0);
        if (!obj.gastos) obj.gastos = [];

        localStorage.setItem('perfilFinanciero', JSON.stringify(obj));
        status.style.display = 'inline';
        setTimeout(() => status.style.display = 'none', 2500);
    });

    // Cargar valores guardados al abrir
    (function loadSaved() {
        try {
            const raw = localStorage.getItem('perfilFinanciero');
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (saved.ingresos !== undefined) document.getElementById('ingresos').value = saved.ingresos;
            if (saved.egresos !== undefined) document.getElementById('egresos').value = saved.egresos;
            if (saved.ahorro !== undefined) { range.value = saved.ahorro; number.value = saved.ahorro; }
            if (saved.objetivo) {
                const opt = document.querySelector(`input[name="objetivo"][value="${saved.objetivo}"]`);
                if (opt) opt.checked = true;
                else { document.querySelector('input[name="objetivo"][value="otro"]').checked = true; objetivoOtro.style.display = 'block'; objetivoOtro.value = saved.objetivo_otro || '' }
            }
            if (saved.horizonte) document.getElementById('horizonte').value = saved.horizonte;
            if (saved.riesgo) document.getElementById('riesgo').value = saved.riesgo;
            if (Array.isArray(saved.gastos)) {
                saved.gastos.forEach(g => { const cb = document.querySelector(`input[name="gastos"][value="${g}"]`); if (cb) cb.checked = true; });
            }
            if (saved.tieneDeudas === 'si') { document.querySelector('input[name="tieneDeudas"][value="si"]').checked = true; deudasDetalle.style.display = 'block'; }
            if (saved.deuda_monto !== undefined) document.getElementById('deuda_monto').value = saved.deuda_monto;
            if (saved.deuda_tipo) document.getElementById('deuda_tipo').value = saved.deuda_tipo;
            if (saved.preferencia_tips) document.getElementById('preferencia_tips').value = saved.preferencia_tips;
        } catch (e) {
            // ignore
        }
    })();
}