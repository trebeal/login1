// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB66gvws1L8DskwnAoFeasVrSZc6Qg-IfY",
    authDomain: "trebeal.github.io",
    projectId: "trebealgame",
    storageBucket: "trebealgame.appspot.com",
    messagingSenderId: "908782066246",
    appId: "1:908782066246:web:ee3b4772e44c2572c10847"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Sistema de notificaciones
function showCustomAlert(message, type = 'error', duration = 5000) {
    const container = document.getElementById('custom-alert-container');
    const alert = document.createElement('div');
    alert.className = `custom-alert ${type}`;
    let icon = '';
    switch(type) {
        case 'error': icon = '<i class="fas fa-exclamation-circle"></i>'; break;
        case 'warning': icon = '<i class="fas fa-exclamation-triangle"></i>'; break;
        case 'success': icon = '<i class="fas fa-check-circle"></i>'; break;
        default: icon = '<i class="fas fa-info-circle"></i>';
    }
    alert.innerHTML = `${icon}<span>${message}</span>`;
    container.appendChild(alert);
    setTimeout(() => alert.classList.add('show'), 10);
    if (duration > 0) {
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 300);
        }, duration);
    }
}

// Función para obtener mensajes amigables de error
function getFriendlyAuthError(error, context = 'general') {
    const errorMessages = {
        'login': {
            'auth/invalid-login-credentials': 'Correo o contraseña incorrectos. Por favor verifica tus datos.',
            'auth/user-not-found': 'No existe una cuenta con este correo electrónico.',
            'auth/wrong-password': 'La contraseña es incorrecta.',
            'auth/too-many-requests': 'Demasiados intentos fallidos. Por favor intenta más tarde.',
            'auth/user-disabled': 'Tu cuenta ha sido desactivada. Contacta al administrador.'
        },
        'password-change': {
            'auth/invalid-login-credentials': 'La contraseña actual es incorrecta.',
            'auth/wrong-password': 'La contraseña actual es incorrecta.',
            'auth/weak-password': 'La nueva contraseña debe tener al menos 6 caracteres.',
            'auth/requires-recent-login': 'Tu sesión ha expirado. Por favor vuelve a iniciar sesión.'
        },
        'registration': {
            'auth/email-already-in-use': 'Este correo electrónico ya está registrado.',
            'auth/invalid-email': 'Por favor ingresa un correo electrónico válido.',
            'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.'
        },
        'general': {
            'auth/network-request-failed': 'Error de conexión. Verifica tu internet e intenta nuevamente.',
            'default': 'Ocurrió un error inesperado. Por favor intenta nuevamente.'
        }
    };

    // Buscar mensaje específico para el contexto
    const contextMessages = errorMessages[context] || errorMessages['general'];
    return contextMessages[error.code] || errorMessages['general']['default'] || error.message;
}

// Función para alternar entre formularios (VERSIÓN CORREGIDA)
function switchForm(showFormId, hideFormIds) {
    // Ocultar todos los formularios primero
    hideFormIds.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) form.classList.remove('active');
    });
    
    // Mostrar el formulario solicitado
    const showForm = document.getElementById(showFormId);
    if (showForm) showForm.classList.add('active');
    
    // Actualizar estado de los botones de toggle
    if (showFormId === 'login-form') {
        document.getElementById('login-toggle').classList.add('active');
        document.getElementById('register-toggle').classList.remove('active');
    } else if (showFormId === 'register-form') {
        document.getElementById('register-toggle').classList.add('active');
        document.getElementById('login-toggle').classList.remove('active');
    }
    
    // Limpiar mensajes de error
    document.querySelectorAll('.error-message, .success-message').forEach(el => {
        el.style.display = 'none';
    });
}

// Función para validar contraseña
function validatePassword(password) {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    let strength = 0;
    if (requirements.length) strength += 25;
    if (requirements.uppercase) strength += 25;
    if (requirements.number) strength += 25;
    if (requirements.special) strength += 25;

    return {
        valid: Object.values(requirements).every(Boolean),
        strength: strength,
        requirements: requirements
    };
}

// Función para manejar login
const MAX_LOGIN_ATTEMPTS = 3;
const LOGIN_TIMEOUT = 30 * 1000;
let loginAttempts = 0;
let lastAttemptTime = 0;

async function handleLogin() {
    const now = Date.now();
    const timeSinceLastAttempt = now - lastAttemptTime;
    
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS && timeSinceLastAttempt < LOGIN_TIMEOUT) {
        const remainingTime = Math.ceil((LOGIN_TIMEOUT - timeSinceLastAttempt) / 1000);
        showCustomAlert(`Demasiados intentos. Por favor espera ${remainingTime} segundos.`, 'error');
        return;
    }

    const btn = document.querySelector('#login-form .btn');
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    if (!email || !password) {
        showCustomAlert('Por favor completa todos los campos', 'warning');
        return;
    }

    try {
        const persistence = rememberMe ? 
            firebase.auth.Auth.Persistence.LOCAL : 
            firebase.auth.Auth.Persistence.SESSION;
        
        await auth.setPersistence(persistence);
        
        btn.classList.add('loading');
        btn.disabled = true;
        
        await auth.signInWithEmailAndPassword(email, password);
        
        loginAttempts = 0;
        lastAttemptTime = 0;
        window.location.replace('home.html');
    } catch (error) {
        btn.classList.remove('loading');
        btn.disabled = false;
        
        loginAttempts++;
        lastAttemptTime = Date.now();
        
        if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
            showCustomAlert(`Demasiados intentos fallidos. Por favor espera 30 segundos.`, 'error');
        } else {
            const friendlyMessage = getFriendlyAuthError(error, 'login');
            showCustomAlert(friendlyMessage, 'error');
        }
    }
}

// Función para manejar registro
async function handleRegistration() {
    const btn = document.getElementById('register-btn');
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    
    if (!name || !email || !password || !confirmPassword) {
        showCustomAlert('Por favor completa todos los campos', 'warning');
        return;
    }
    
    if (password !== confirmPassword) {
        showCustomAlert('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (!document.getElementById('accept-terms').checked) {
        showCustomAlert('Debes aceptar los términos y condiciones para continuar', 'warning');
        const termsCheckbox = document.getElementById('accept-terms').parentElement;
        termsCheckbox.style.animation = 'none';
        setTimeout(() => {
            termsCheckbox.style.animation = 'pulse 0.5s';
        }, 10);
        return;
    }

    try {
        btn.classList.add('loading');
        btn.disabled = true;
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        await userCredential.user.updateProfile({
            displayName: name
        });
        
        await sendVerificationEmail(userCredential.user);
        
        showCustomAlert(`¡Registro exitoso! Se ha enviado un email de verificación a ${email}.`, 'success', 10000);
        
        await auth.signOut();
        
    } catch (error) {
        btn.classList.remove('loading');
        btn.disabled = false;
        const friendlyMessage = getFriendlyAuthError(error, 'registration');
        showCustomAlert(friendlyMessage, 'error');
    }
}

// Función para manejar recuperación de contraseña
async function handlePasswordRecovery() {
    const btn = document.querySelector('#change-password-form .btn');
    const email = document.getElementById('change-email').value;
    
    if (!email) {
        showCustomAlert('Por favor ingresa tu correo electrónico', 'warning');
        return;
    }

    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        
        await auth.sendPasswordResetEmail(email);
        
        showCustomAlert('Se ha enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.', 'success', 8000);
        
        document.getElementById('change-password-form').reset();
        document.getElementById('login-toggle').click();
        
    } catch (error) {
        const friendlyMessage = getFriendlyAuthError(error, 'general');
        showCustomAlert(friendlyMessage, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Correo';
    }
}

// Función para enviar correo de verificación
async function sendVerificationEmail(user) {
    try {
        await user.sendEmailVerification();
        return true;
    } catch (error) {
        const friendlyMessage = getFriendlyAuthError(error, 'general');
        showCustomAlert('Error al enviar el correo de verificación: ' + friendlyMessage, 'error');
        return false;
    }
}

// Función para alternar visibilidad de contraseña
function togglePasswordVisibility(icon) {
    const input = icon.previousElementSibling;
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Toggle entre formularios principales
    document.getElementById('login-toggle').addEventListener('click', function(e) {
        e.preventDefault();
        switchForm('login-form', ['register-form', 'change-password-form']);
    });
    
    document.getElementById('register-toggle').addEventListener('click', function(e) {
        e.preventDefault();
        switchForm('register-form', ['login-form', 'change-password-form']);
    });
    
    // Mostrar formulario de login desde otros lugares
    document.getElementById('show-login').addEventListener('click', function(e) {
        e.preventDefault();
        switchForm('login-form', ['register-form', 'change-password-form']);
        document.getElementById('login-toggle').click();
    });
    
    // Mostrar formulario de recuperación de contraseña
    document.getElementById('show-change-password').addEventListener('click', function(e) {
        e.preventDefault();
        switchForm('change-password-form', ['login-form', 'register-form']);
    });
    
    // Volver a login desde recuperación de contraseña
    document.getElementById('show-login-from-change').addEventListener('click', function(e) {
        e.preventDefault();
        switchForm('login-form', ['register-form', 'change-password-form']);
        document.getElementById('login-toggle').click();
    });

    // Mostrar/ocultar contraseña
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', function() {
            togglePasswordVisibility(this);
        });
    });
    
    // Validación de contraseña en tiempo real
    document.getElementById('register-password').addEventListener('input', function(e) {
        const validation = validatePassword(e.target.value);
        const strengthBar = document.getElementById('password-strength-bar');
        const strengthLabel = document.getElementById('password-strength-label');
        const registerBtn = document.getElementById('register-btn');

        strengthBar.style.width = `${validation.strength}%`;
        
        if (validation.strength < 50) {
            strengthBar.style.backgroundColor = '#ff4757';
            strengthLabel.textContent = 'Débil';
            strengthLabel.style.color = '#ff4757';
        } else if (validation.strength < 75) {
            strengthBar.style.backgroundColor = '#ffa502';
            strengthLabel.textContent = 'Moderada';
            strengthLabel.style.color = '#ffa502';
        } else {
            strengthBar.style.backgroundColor = '#2ed573';
            strengthLabel.textContent = 'Fuerte';
            strengthLabel.style.color = '#2ed573';
        }

        document.getElementById('req-length').classList.toggle('valid', validation.requirements.length);
        document.getElementById('req-uppercase').classList.toggle('valid', validation.requirements.uppercase);
        document.getElementById('req-number').classList.toggle('valid', validation.requirements.number);
        document.getElementById('req-special').classList.toggle('valid', validation.requirements.special);

        registerBtn.disabled = !validation.valid;
    });
    
    // Enviar formularios
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });
    
    document.getElementById('register-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleRegistration();
    });
    
    document.getElementById('change-password-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handlePasswordRecovery();
    });
    
    // Verificar estado de autenticación
    auth.onAuthStateChanged(user => {
        if (user && !user.emailVerified) {
            auth.signOut();
            window.location.href = '/sing-up/';
        } else if (user && user.emailVerified) {
            window.location.replace('home.html');
        }
    });
});

// Animación para términos
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);