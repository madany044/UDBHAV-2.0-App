// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-V-jin4M1hu9Wnz7GPJnV7PuY54coeZo",
  authDomain: "mrit-udbhav.firebaseapp.com",
  projectId: "mrit-udbhav",
  storageBucket: "mrit-udbhav.firebasestorage.app",
  messagingSenderId: "677495378305",
  appId: "1:677495378305:web:a9cf7289ce2cc993715880",
  measurementId: "G-NF5X6YM7RE"

};


// Initialize Firebase
console.log('Initializing Firebase...');
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Global Variables
let currentUser = null;
let isAdmin = false;

// DOM Elements
const navAuth = document.getElementById('nav-auth');
const navUser = document.getElementById('nav-user');
const userName = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');

// Modals
const loginModal = document.getElementById('login-modal');
const registerModal = document.getElementById('register-modal');
const forgotModal = document.getElementById('forgot-password-modal');

// Forms
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const forgotForm = document.getElementById('forgot-password-form');
const contactForm = document.getElementById('contact-form');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    initializeApp();
    setupEventListeners();
    checkAuthState();
});

function initializeApp() {
    console.log('Initializing app...');

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href && href !== '#' && href.length > 1) {
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Mobile menu toggle
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (hamburger && navMenu) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    });

    setupPasswordValidation();
}

function setupEventListeners() {
    console.log('Setting up event listeners...');

    // Check if elements exist before adding listeners
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            console.log('Login button clicked');
            openModal('login');
        });
    } else {
        console.error('Login button not found');
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            console.log('Register button clicked');
            openModal('register');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Close modals
    const closeLogin = document.getElementById('close-login');
    const closeRegister = document.getElementById('close-register');
    const closeForgot = document.getElementById('close-forgot');

    if (closeLogin) closeLogin.addEventListener('click', () => closeModal('login'));
    if (closeRegister) closeRegister.addEventListener('click', () => closeModal('register'));
    if (closeForgot) closeForgot.addEventListener('click', () => closeModal('forgot'));

    // Switch between modals
    const switchToRegister = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const switchToLoginFromForgot = document.getElementById('switch-to-login-from-forgot');

    if (switchToRegister) {
        switchToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Switching to register modal');
            closeModal('login');
            openModal('register');
        });
    }

    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Switching to login modal');
            closeModal('register');
            openModal('login');
        });
    }

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Forgot password link clicked');
            closeModal('login');
            openModal('forgot');
        });
    } else {
        console.error('Forgot password link not found!');
    }

    if (switchToLoginFromForgot) {
        switchToLoginFromForgot.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Switching from forgot to login');
            closeModal('forgot');
            openModal('login');
        });
    }

    // Form submissions
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.error('Login form not found');
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    if (forgotForm) {
        console.log('Forgot password form found, adding listener');
        forgotForm.addEventListener('submit', handleForgotPassword);
    } else {
        console.error('Forgot password form not found!');
    }

    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }

    // Hero buttons
    const getStartedBtn = document.getElementById('get-started-btn');
    const learnMoreBtn = document.getElementById('learn-more-btn');

    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
            if (currentUser) {
                redirectBasedOnRole();
            } else {
                openModal('register');
            }
        });
    }

    if (learnMoreBtn) {
        learnMoreBtn.addEventListener('click', () => {
            document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });

    console.log('Event listeners setup complete');
}

function setupPasswordValidation() {
    const passwordField = document.getElementById('register-password');
    const confirmPasswordField = document.getElementById('register-confirm-password');

    if (confirmPasswordField && passwordField) {
        confirmPasswordField.addEventListener('input', () => {
            const password = passwordField.value;
            const confirmPassword = confirmPasswordField.value;

            if (confirmPassword && password !== confirmPassword) {
                confirmPasswordField.classList.add('error');
                showFieldError(confirmPasswordField, 'Passwords do not match');
            } else {
                confirmPasswordField.classList.remove('error');
                hideFieldError(confirmPasswordField);
            }
        });
    }
}

function showFieldError(field, message) {
    hideFieldError(field);
    field.classList.add('error');

    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.color = '#dc2626';
    errorElement.style.fontSize = '0.875rem';
    errorElement.style.marginTop = '0.25rem';

    field.parentNode.appendChild(errorElement);
}

function hideFieldError(field) {
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

function checkAuthState() {
    console.log('Checking auth state...');
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log('User is signed in:', user.email);
            currentUser = user;
            await checkUserRole();
            updateUI();
        } else {
            console.log('User is signed out');
            currentUser = null;
            isAdmin = false;
            updateUI();
        }
    });
}

function updateUI() {
    if (!navAuth || !navUser) return;

    if (currentUser) {
        navAuth.style.display = 'none';
        navUser.style.display = 'flex';
        if (userName) {
            userName.textContent = currentUser.displayName || currentUser.email;
        }
    } else {
        navAuth.style.display = 'flex';
        navUser.style.display = 'none';
    }
}

async function checkUserRole() {
    if (!currentUser) return;

    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            isAdmin = userData.role === 'admin';
        }
    } catch (error) {
        console.error('Error checking user role:', error);
        isAdmin = false;
    }
}

function redirectBasedOnRole() {
    if (isAdmin) {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'dashboard.html';
    }
}

function openModal(modalType) {
    console.log('Opening modal:', modalType);
    closeAllModals();

    if (modalType === 'login' && loginModal) {
        loginModal.style.display = 'block';
        if (loginForm) loginForm.reset();
    } else if (modalType === 'register' && registerModal) {
        registerModal.style.display = 'block';
        if (registerForm) registerForm.reset();
        document.querySelectorAll('.field-error').forEach(error => error.remove());
        document.querySelectorAll('.form-group input').forEach(input => input.classList.remove('error'));
    } else if (modalType === 'forgot' && forgotModal) {
        console.log('Displaying forgot password modal');
        forgotModal.style.display = 'block';
        if (forgotForm) forgotForm.reset();
    }
}

function closeModal(modalType) {
    console.log('Closing modal:', modalType);
    if (modalType === 'login' && loginModal) {
        loginModal.style.display = 'none';
    } else if (modalType === 'register' && registerModal) {
        registerModal.style.display = 'none';
    } else if (modalType === 'forgot' && forgotModal) {
        forgotModal.style.display = 'none';
    }
}

function closeAllModals() {
    if (loginModal) loginModal.style.display = 'none';
    if (registerModal) registerModal.style.display = 'none';
    if (forgotModal) forgotModal.style.display = 'none';
}

// FORGOT PASSWORD HANDLER - VERIFIED
async function handleForgotPassword(e) {
    e.preventDefault();
    console.log('Forgot password form submitted');

    const emailField = document.getElementById('forgot-email');
    if (!emailField) {
        console.error('Forgot email field not found');
        return;
    }

    const email = emailField.value.trim();
    const submitBtn = e.target.querySelector('button[type="submit"]');

    console.log('Email entered:', email);

    // Clear previous errors
    document.querySelectorAll('.field-error').forEach(error => error.remove());
    document.querySelectorAll('.form-group input').forEach(input => input.classList.remove('error'));

    // Validation
    if (!email) {
        showMessage('Please enter your email address', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showFieldError(emailField, 'Please enter a valid email address');
        return;
    }

    // Show loading state
    showButtonLoading(submitBtn, 'Sending...');
    console.log('Sending password reset email to:', email);

    try {
        // This is the key Firebase function
        await auth.sendPasswordResetEmail(email);

        console.log('✅ Password reset email sent successfully!');
        showMessage('Password reset email sent! Check your inbox and spam folder.', 'success');

        // Reset form and close modal
        if (forgotForm) forgotForm.reset();
        hideButtonLoading(submitBtn, 'Send Reset Link');

        // Close modal after delay
        setTimeout(() => {
            closeModal('forgot');
            openModal('login');
        }, 3000);

    } catch (error) {
        console.error('❌ Error sending password reset email:', error);
        hideButtonLoading(submitBtn, 'Send Reset Link');
        handleAuthError(error, 'forgot-password');
    }
}

// Login handler
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    // Clear previous errors
    document.querySelectorAll('.field-error').forEach(error => error.remove());
    document.querySelectorAll('.form-group input').forEach(input => input.classList.remove('error'));

    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showFieldError(document.getElementById('login-email'), 'Please enter a valid email address');
        return;
    }

    showButtonLoading(submitBtn, 'Logging in...');
    showLoadingOverlay('Logging in...');

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        await checkUserRole();
        showMessage('Login successful!', 'success');
        closeModal('login');

        setTimeout(() => {
            showLoadingOverlay('Redirecting...');
            setTimeout(() => {
                redirectBasedOnRole();
            }, 1500);
        }, 1000);
    } catch (error) {
        console.error('=== LOGIN ERROR CAUGHT ===');
        console.error('Error type:', typeof error);
        console.error('Error object:', error);
        console.error('Error string:', error.toString());
        console.error('Error JSON:', JSON.stringify(error, null, 2));
        console.error('=== END LOGIN ERROR ===');

        hideButtonLoading(submitBtn, 'Login');
        hideLoadingOverlay();
        handleAuthError(error, 'login');
    }
}

// Register handler
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    // Clear previous errors
    document.querySelectorAll('.field-error').forEach(error => error.remove());
    document.querySelectorAll('.form-group input').forEach(input => input.classList.remove('error'));

    if (!name || !email || !password || !confirmPassword) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showFieldError(document.getElementById('register-email'), 'Please enter a valid email address');
        return;
    }

    if (password !== confirmPassword) {
        showFieldError(document.getElementById('register-confirm-password'), 'Passwords do not match!');
        return;
    }

    if (password.length < 6) {
        showFieldError(document.getElementById('register-password'), 'Password should be at least 6 characters long');
        return;
    }

    showButtonLoading(submitBtn, 'Creating account...');
    showLoadingOverlay('Creating your account...');

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({
            displayName: name
        });

        await db.collection('users').doc(userCredential.user.uid).set({
            name: name,
            email: email,
            role: 'user',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showMessage('Registration successful!', 'success');
        closeModal('register');

        setTimeout(() => {
            showLoadingOverlay('Setting up your dashboard...');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        }, 1000);
    } catch (error) {
        hideButtonLoading(submitBtn, 'Register');
        hideLoadingOverlay();
        handleAuthError(error, 'register');
    }
}

// Contact form handler
async function handleContactSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('contact-name')?.value;
    const email = document.getElementById('contact-email')?.value;
    const message = document.getElementById('contact-message')?.value;

    if (!name || !email || !message) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    try {
        await db.collection('contact').add({
            name: name,
            email: email,
            message: message,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        showMessage('Message sent successfully!', 'success');
        if (contactForm) contactForm.reset();
    } catch (error) {
        showMessage('Failed to send message: ' + error.message, 'error');
    }
}

// Logout handler
function logout() {
    showLoadingOverlay('Logging out...');
    auth.signOut().then(() => {
        showMessage('Logged out successfully!', 'success');
        setTimeout(() => {
            showLoadingOverlay('Redirecting to homepage...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }, 1000);
    }).catch((error) => {
        hideLoadingOverlay();
        showMessage('Logout failed: ' + error.message, 'error');
    });
}

// Enhanced error handling
function handleAuthError(error, context = 'login') {
    console.log('Full error object:', error);
    console.log('Auth error details:', {
        code: error.code,
        message: error.message,
        context: context
    });

    let errorMessage = 'Authentication failed. Please try again.';
    let fieldId = '';

    // Extract error code from different possible structures
    let errorCode = '';

    // Method 1: Direct error code
    if (error.code) {
        errorCode = error.code;
    }
    // Method 2: From error message (for the new Firebase error format)
    else if (error.message && error.message.includes('INVALID_LOGIN_CREDENTIALS')) {
        errorCode = 'auth/invalid-login-credentials';
    }
    // Method 3: From the nested error structure in your screenshot
    else if (error.error && error.error.code === 400) {
        errorCode = 'auth/invalid-login-credentials';
    }
    // Method 4: From errors array
    else if (error.errors && error.errors[0] && error.errors[0].message === 'INVALID_LOGIN_CREDENTIALS') {
        errorCode = 'auth/invalid-login-credentials';
    }

    console.log('Extracted error code:', errorCode);

    // Handle all possible error code formats
    if (errorCode === 'auth/invalid-email' || errorCode.includes('invalid-email')) {
        errorMessage = 'Please enter a valid email address.';
        fieldId = context + '-email';
    }
    else if (errorCode === 'auth/user-disabled' || errorCode.includes('user-disabled')) {
        errorMessage = 'This account has been disabled. Please contact support.';
    }
    else if (errorCode === 'auth/user-not-found' ||
             errorCode === 'auth/wrong-password' ||
             errorCode === 'auth/invalid-login-credentials' ||
             errorCode.includes('invalid-login-credentials') ||
             errorCode.includes('INVALID_LOGIN_CREDENTIALS')) {
        // Security best practice: don't specify whether email or password is wrong
        errorMessage = 'Invalid email or password. Please try again.';
    }
    else if (errorCode === 'auth/email-already-in-use' || errorCode.includes('email-already-in-use')) {
        errorMessage = 'An account with this email already exists.';
        fieldId = 'register-email';
    }
    else if (errorCode === 'auth/weak-password' || errorCode.includes('weak-password')) {
        errorMessage = 'Password should be at least 6 characters long.';
        fieldId = 'register-password';
    }
    else if (errorCode === 'auth/network-request-failed' || errorCode.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.';
    }
    else if (errorCode === 'auth/too-many-requests' || errorCode.includes('too-many-requests')) {
        errorMessage = 'Too many failed attempts. Please try again later or reset your password.';
    }
    else {
        // Fallback: check the error message content
        const errorString = JSON.stringify(error).toLowerCase();
        if (errorString.includes('invalid') || errorString.includes('credential') || errorString.includes('login')) {
            errorMessage = 'Invalid email or password. Please try again.';
        } else {
            errorMessage = 'Authentication failed. Please check your credentials and try again.';
        }
    }

    // Show error message
    showMessage(errorMessage, 'error');
}

// Utility functions
function showMessage(message, type) {
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 10000;
        max-width: 90%;
        text-align: center;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    if (type === 'success') {
        messageDiv.style.backgroundColor = '#dcfce7';
        messageDiv.style.color = '#166534';
        messageDiv.style.border = '1px solid #bbf7d0';
    } else if (type === 'error') {
        messageDiv.style.backgroundColor = '#fee2e2';
        messageDiv.style.color = '#dc2626';
        messageDiv.style.border = '1px solid #fecaca';
    }

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showLoadingOverlay(text = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    if (overlay) {
        if (loadingText) loadingText.textContent = text;
        overlay.classList.add('active');
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('active');
}

function showButtonLoading(button, loadingText = 'Loading...') {
    if (!button) return;
    const originalText = button.textContent;
    button.disabled = true;
    button.innerHTML = `<span class="loading-spinner"></span> ${loadingText}`;
    button.setAttribute('data-original-text', originalText);
}

function hideButtonLoading(button, originalText = null) {
    if (!button) return;
    button.disabled = false;
    const textToRestore = originalText || button.getAttribute('data-original-text') || 'Submit';
    button.textContent = textToRestore;
    button.removeAttribute('data-original-text');
}

// Make functions globally available
window.auth = auth;
window.db = db;
window.currentUser = currentUser;
window.isAdmin = isAdmin;
window.showMessage = showMessage;
//window.formatDate = formatDate;
window.isValidEmail = isValidEmail;
//window.isValidPhone = isValidPhone;
window.showLoadingOverlay = showLoadingOverlay;
window.hideLoadingOverlay = hideLoadingOverlay;
window.showButtonLoading = showButtonLoading;
window.hideButtonLoading = hideButtonLoading;