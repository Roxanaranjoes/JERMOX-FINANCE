/**
 * Sistema de notificaciones para Jermox (toasts).
 * Crea un contenedor fijo si no existe y pinta una tarjeta con icono/colores por tipo.
 * Se auto-cierra pasado `duration` ms (si es > 0) o se puede cerrar manualmente.
 * @param {string} message - contenido del mensaje (puede incluir HTML simple)
 * @param {'success'|'error'|'warning'|'info'} type - severidad/estilo del mensaje
 * @param {number} duration - tiempo de vida en ms (0 = no se cierra solo)
 * @returns {HTMLDivElement} elemento de la notificación inyectado en el DOM
 */
export function showNotification(message, type = 'info', duration = 5000) {
  // Crear contenedor de notificaciones si no existe
  let notificationContainer = document.getElementById('notification-container');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    `;
    document.body.appendChild(notificationContainer);
  }

  // Crear notificación individual (tarjeta)
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  // Iconos según el tipo
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  // Colores según el tipo (fondo, borde y texto)
  const colors = {
    success: { bg: 'rgba(0,232,169,0.95)', border: 'rgba(0,232,169,0.8)', text: '#002' },
    error: { bg: 'rgba(255,80,80,0.95)', border: 'rgba(255,80,80,0.8)', text: '#fff' },
    warning: { bg: 'rgba(255,193,7,0.95)', border: 'rgba(255,193,7,0.8)', text: '#002' },
    info: { bg: 'rgba(33,113,255,0.95)', border: 'rgba(33,113,255,0.8)', text: '#fff' }
  };

  notification.style.cssText = `
    background: ${colors[type].bg};
    border: 1px solid ${colors[type].border};
    color: ${colors[type].text};
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    backdrop-filter: blur(10px);
    font-size: 14px;
    line-height: 1.4;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease;
    max-width: 100%;
    word-wrap: break-word;
  `;

  notification.innerHTML = `
    <span style="font-size: 18px; flex-shrink: 0;">${icons[type]}</span>
    <div style="flex: 1;">
      <div style="font-weight: 600; margin-bottom: 4px;">${getTitle(type)}</div>
      <div>${message}</div>
    </div>
    <button class="notification-close" style="
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      font-size: 18px;
      padding: 0;
      margin-left: 8px;
      opacity: 0.7;
      transition: opacity 0.2s;
    ">×</button>
  `;

  // Agregar al contenedor (stack de toasts)
  notificationContainer.appendChild(notification);

  // Animación de entrada
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
    notification.style.opacity = '1';
  }, 100);

  // Botón de cerrar
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => removeNotification(notification));
  closeBtn.addEventListener('mouseenter', () => closeBtn.style.opacity = '1');
  closeBtn.addEventListener('mouseleave', () => closeBtn.style.opacity = '0.7');

  // Auto-remover después del tiempo especificado (si aplica)
  if (duration > 0) {
    setTimeout(() => removeNotification(notification), duration);
  }

  return notification;
}

/**
 * Anima salida y remueve la notificación del DOM.
 */
function removeNotification(notification) {
  notification.style.transform = 'translateX(100%)';
  notification.style.opacity = '0';
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}

/**
 * Título por tipo de notificación.
 */
function getTitle(type) {
  const titles = {
    success: 'Éxito',
    error: 'Error',
    warning: 'Advertencia',
    info: 'Información'
  };
  return titles[type] || 'Notificación';
}

// Funciones de conveniencia (atajos tipados)
export function showSuccess(message, duration) {
  return showNotification(message, 'success', duration);
}

export function showError(message, duration) {
  return showNotification(message, 'error', duration);
}

export function showWarning(message, duration) {
  return showNotification(message, 'warning', duration);
}

export function showInfo(message, duration) {
  return showNotification(message, 'info', duration);
}

// Función para mostrar errores de API de forma amigable (traduce códigos comunes)
export function showApiError(error, context = '') {
  let message = 'Ha ocurrido un error';
  
  if (error.status === 409) {
    message = 'Este email ya está registrado. ¿Quieres hacer login en su lugar?';
  } else if (error.status === 400) {
    message = 'Datos incompletos o inválidos. Revisa la información ingresada.';
  } else if (error.status === 401) {
    message = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
  } else if (error.status === 403) {
    message = 'No tienes permisos para realizar esta acción.';
  } else if (error.status === 404) {
    message = 'El recurso solicitado no fue encontrado.';
  } else if (error.status === 500) {
    message = 'Error del servidor. Intenta más tarde.';
  } else if (error.message) {
    message = error.message;
  }
  
  if (context) {
    message = `${context}: ${message}`;
  }
  
  return showError(message, 8000); // Más tiempo para errores importantes
}

// Función para mostrar confirmaciones (con botones Confirmar/Cancelar)
export function showConfirm(message, onConfirm, onCancel) {
  const notification = showNotification(message, 'info', 0); // Sin auto-remover
  
  // Agregar botones de confirmación
  const content = notification.querySelector('div');
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = `
    display: flex;
    gap: 10px;
    margin-top: 12px;
  `;
  
  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = 'Confirmar';
  confirmBtn.style.cssText = `
    background: rgba(0,232,169,0.8);
    border: 1px solid rgba(0,232,169,0.9);
    color: #002;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s;
  `;
  
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.style.cssText = `
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.3);
    color: inherit;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
  `;
  
  // Eventos de clic para confirmar/cancelar
  confirmBtn.addEventListener('click', () => {
    removeNotification(notification);
    if (onConfirm) onConfirm();
  });
  
  cancelBtn.addEventListener('click', () => {
    removeNotification(notification);
    if (onCancel) onCancel();
  });
  
  // Hover effects (feedback visual)
  confirmBtn.addEventListener('mouseenter', () => {
    confirmBtn.style.background = 'rgba(0,232,169,1)';
    confirmBtn.style.transform = 'translateY(-1px)';
  });
  confirmBtn.addEventListener('mouseleave', () => {
    confirmBtn.style.background = 'rgba(0,232,169,0.8)';
    confirmBtn.style.transform = 'translateY(0)';
  });
  
  cancelBtn.addEventListener('mouseenter', () => {
    cancelBtn.style.background = 'rgba(255,255,255,0.3)';
    cancelBtn.style.transform = 'translateY(-1px)';
  });
  cancelBtn.addEventListener('mouseleave', () => {
    cancelBtn.style.background = 'rgba(255,255,255,0.2)';
    cancelBtn.style.transform = 'translateY(0)';
  });
  
  buttonsContainer.appendChild(confirmBtn);
  buttonsContainer.appendChild(cancelBtn);
  content.appendChild(buttonsContainer);
  
  return notification;
}

// Función para limpiar todas las notificaciones en pantalla
export function clearAllNotifications() {
  const container = document.getElementById('notification-container');
  if (container) {
    container.innerHTML = '';
  }
}
  
  
