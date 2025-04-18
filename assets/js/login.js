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
            handleAuthError(error);
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
        handleAuthError(error);
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
        let message = 'Error al enviar correo de recuperación';
        if (error.code === 'auth/user-not-found') {
            message = 'No existe una cuenta con este correo';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Correo electrónico inválido';
        }
        showCustomAlert(message, 'error');
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
        showCustomAlert('Error al enviar el correo de verificación: ' + error.message, 'error');
        return false;
    }
}

// Función para manejar errores de autenticación
function handleAuthError(error) {
    let message = 'Error de autenticación';
    let type = 'error';
    
    switch(error.code) {
        case 'auth/invalid-email':
            message = 'Por favor ingresa un correo electrónico válido';
            type = 'warning';
            break;
        case 'auth/user-disabled':
            message = 'Esta cuenta ha sido deshabilitada';
            break;
        case 'auth/user-not-found':
            message = 'No existe una cuenta con este correo';
            type = 'warning';
            break;
        case 'auth/wrong-password':
            message = 'Contraseña incorrecta';
            type = 'warning';
            break;
        case 'auth/email-already-in-use':
            message = 'Este correo electrónico ya está registrado';
            break;
        case 'auth/weak-password':
            message = 'La contraseña debe tener al menos 6 caracteres';
            type = 'warning';
            break;
        case 'auth/operation-not-allowed':
            message = 'Error de configuración. Contacta al administrador.';
            break;
        case 'auth/too-many-requests':
            message = 'Demasiados intentos. Por favor espera antes de intentar nuevamente.';
            break;
        case 'auth/network-request-failed':
            message = 'Error de conexión. Verifica tu internet.';
            break;
        default:
            message = error.message;
    }
    
    showCustomAlert(message, type);
}

// Función para alternar visibilidad de contraseña
function togglePasswordVisibility(icon) {
    const input = icon.previousElementSibling;
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
}

// Función para alternar entre formularios
function switchForm(activeTab, inactiveTab, activeForm, inactiveForms) {
    inactiveForms = Array.isArray(inactiveForms) ? inactiveForms : [inactiveForms];
    
    if (activeTab) activeTab.classList.add('active');
    if (inactiveTab) inactiveTab.classList.remove('active');
    
    activeForm.classList.add('active');
    inactiveForms.forEach(form => form.classList.remove('active'));
    
    document.querySelectorAll('.error-message, .success-message').forEach(el => {
        el.style.display = 'none';
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Toggle entre formularios principales
    document.getElementById('login-toggle').addEventListener('click', function(e) {
        e.preventDefault();
        switchForm(this, document.getElementById('register-toggle'), 
                   document.getElementById('login-form'), 
                   [document.getElementById('register-form'), document.getElementById('change-password-form')]);
    });
    
    document.getElementById('register-toggle').addEventListener('click', function(e) {
        e.preventDefault();
        switchForm(this, document.getElementById('login-toggle'), 
                   document.getElementById('register-form'), 
                   [document.getElementById('login-form'), document.getElementById('change-password-form')]);
    });
    
    document.getElementById('show-login').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('login-toggle').click();
    });
    
    // Mostrar formulario de recuperación de contraseña
    document.getElementById('show-change-password').addEventListener('click', function(e) {
        e.preventDefault();
        switchForm(null, null, 
                   document.getElementById('change-password-form'), 
                   [document.getElementById('login-form'), document.getElementById('register-form')]);
    });
    
    // Volver a login desde recuperación de contraseña
    document.getElementById('show-login-from-change').addEventListener('click', function(e) {
        e.preventDefault();
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