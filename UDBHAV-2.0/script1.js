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

// Forms
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const contactForm = document.getElementById('contact-form');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkAuthState();
});

function initializeApp() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Mobile menu toggle
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
    setupPasswordValidation();
}

function setupEventListeners() {
    // Modal controls
    loginBtn.addEventListener('click', () => openModal('login'));
    registerBtn.addEventListener('click', () => openModal('register'));
    logoutBtn.addEventListener('click', logout);

    // Close modals
    document.getElementById('close-login').addEventListener('click', () => closeModal('login'));
    document.getElementById('close-register').addEventListener('click', () => closeModal('register'));

    // Switch between login and register
    document.getElementById('switch-to-register').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('login');
        openModal('register');
    });

    document.getElementById('switch-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('register');
        openModal('login');
    });

    // Form submissions
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    contactForm.addEventListener('submit', handleContactSubmit);

    addForgotPasswordFeature();

    // Hero buttons
    document.getElementById('get-started-btn').addEventListener('click', () => {
        if (currentUser) {
            redirectBasedOnRole();
        } else {
            openModal('register');
        }
    });

    document.getElementById('learn-more-btn').addEventListener('click', () => {
        document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await checkUserRole(); // Check role first
            updateUI();
        } else {
            currentUser = null;
            isAdmin = false;
            updateUI();
        }
    });
}

function updateUI() {
    if (currentUser) {
        navAuth.style.display = 'none';
        navUser.style.display = 'flex';
        userName.textContent = currentUser.displayName || currentUser.email;

        // Add admin button if user is admin
        if (isAdmin) {
            const existingAdminBtn = document.getElementById('admin-btn');
            if (!existingAdminBtn) {
                const adminBtn = document.createElement('button');
                adminBtn.id = 'admin-btn';
                adminBtn.textContent = 'Admin';
                adminBtn.className = 'btn-secondary';
                adminBtn.style.marginLeft = '10px';
                adminBtn.addEventListener('click', () => {
                    window.location.href = 'admin.html';
                });
                navUser.appendChild(adminBtn);
            }
        } else {
            const adminBtn = document.getElementById('admin-btn');
            if (adminBtn) {
                adminBtn.remove();
            }
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
    closeAllModals();
    if (modalType === 'login') {
        loginModal.style.display = 'block';
    } else if (modalType === 'register') {
        registerModal.style.display = 'block';
    }
}

function closeModal(modalType) {
    if (modalType === 'login') {
        loginModal.style.display = 'none';
    } else if (modalType === 'register') {
        registerModal.style.display = 'none';
    }
}

function closeAllModals() {
    loginModal.style.display = 'none';
    registerModal.style.display = 'none';
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    // Basic validation
    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    // Show loading state
    showButtonLoading(submitBtn, 'Logging in...');
    showLoadingOverlay('Logging in...');

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);

        // Check user role after login
        await checkUserRole();

        showMessage('Login successful!', 'success');
        closeModal('login');

        // Show success animation
        setTimeout(() => {
            showLoadingOverlay('Redirecting...');

            // Redirect based on role
            setTimeout(() => {
                redirectBasedOnRole();
            }, 1500);
        }, 1000);
    } catch (error) {
        hideButtonLoading(submitBtn, 'Login');
        hideLoadingOverlay();
        handleAuthError(error, 'login');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    // Enhanced validation
    if (!name || !email || !password || !confirmPassword) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showMessage('Passwords do not match!', 'error');
        // Highlight the confirm password field
        document.getElementById('register-confirm-password').classList.add('error');
        return;
    } else {
        document.getElementById('register-confirm-password').classList.remove('error');
    }

    if (password.length < 6) {
        showMessage('Password should be at least 6 characters long', 'error');
        return;
    }

    // Show loading state
    showButtonLoading(submitBtn, 'Creating account...');
    showLoadingOverlay('Creating your account...');

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({
            displayName: name
        });

        // Save user data to Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            name: name,
            email: email,
            role: 'user', // Default role
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showMessage('Registration successful!', 'success');
        closeModal('register');

        // Show success animation
        setTimeout(() => {
            showLoadingOverlay('Setting up your dashboard...');

            // Redirect to dashboard (new users are always regular users)
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


async function handleContactSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const message = document.getElementById('contact-message').value;

    try {
        await db.collection('contact').add({
            name: name,
            email: email,
            message: message,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        showMessage('Message sent successfully!', 'success');
        contactForm.reset();
    } catch (error) {
        showMessage('Failed to send message: ' + error.message, 'error');
    }
}

// Handle Forgot Password
async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!email) {
        showMessage('Please enter your email address', 'error');
        return;
    }

    // Show loading state
    showButtonLoading(submitBtn, 'Sending...');

    try {
        await auth.sendPasswordResetEmail(email);
        showMessage('Password reset email sent! Check your inbox.', 'success');

        // Close modal after success
        const forgotModal = document.getElementById('forgot-password-modal');
        if (forgotModal) {
            setTimeout(() => {
                forgotModal.remove();
            }, 2000);
        }
    } catch (error) {
        hideButtonLoading(submitBtn, 'Send Reset Link');
        handleAuthError(error, 'forgot-password');
    }
}


// Add real-time password confirmation validation
function setupPasswordValidation() {
    const passwordField = document.getElementById('register-password');
    const confirmPasswordField = document.getElementById('register-confirm-password');

    if (confirmPasswordField) {
        confirmPasswordField.addEventListener('input', () => {
            const password = passwordField.value;
            const confirmPassword = confirmPasswordField.value;

            if (confirmPassword && password !== confirmPassword) {
                confirmPasswordField.classList.add('error');
            } else {
                confirmPasswordField.classList.remove('error');
            }
        });
    }
}
// Forgot Password Modal
function showForgotPasswordModal() {
    // Create forgot password modal
    const forgotModal = document.createElement('div');
    forgotModal.id = 'forgot-password-modal';
    forgotModal.className = 'modal';
    forgotModal.innerHTML = `
        <div class="modal-content">
            <span class="close" id="close-forgot">&times;</span>
            <h2>Reset Password</h2>
            <p>Enter your email address and we'll send you a link to reset your password.</p>
            <form id="forgot-password-form">
                <div class="form-group">
                    <input type="email" id="forgot-email" placeholder="Enter your email" required>
                </div>
                <button type="submit" class="btn-primary">Send Reset Link</button>
            </form>
        </div>
    `;

    document.body.appendChild(forgotModal);

    // Show modal
    forgotModal.style.display = 'block';

    // Close modal events
    document.getElementById('close-forgot').addEventListener('click', () => {
        forgotModal.remove();
    });

    // Close when clicking outside
    forgotModal.addEventListener('click', (e) => {
        if (e.target === forgotModal) {
            forgotModal.remove();
        }
    });

    // Form submission
    document.getElementById('forgot-password-form').addEventListener('submit', handleForgotPassword);
}

function logout() {
    // Show loading overlay
    showLoadingOverlay('Logging out...');

    auth.signOut().then(() => {
        showMessage('Logged out successfully!', 'success');

        // Show success animation before redirect
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

function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    // Insert at the top of the body
    document.body.insertBefore(messageDiv, document.body.firstChild);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

// Enhanced error handling for authentication
function handleAuthError(error, context = 'login') {
    let errorMessage = 'An error occurred. Please try again.';

    switch (error.code) {
        case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
        case 'auth/user-disabled':
            errorMessage = 'This account has been disabled.';
            break;
        case 'auth/user-not-found':
            if (context === 'login') {
                errorMessage = 'No account found with this email address.';
            } else {
                errorMessage = 'No account found with this email address.';
            }
            break;
        case 'auth/wrong-password':
            errorMessage = 'Invalid password. Please try again.';
            break;
        case 'auth/email-already-in-use':
            errorMessage = 'An account with this email already exists.';
            break;
        case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters long.';
            break;
        case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection.';
            break;
        case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later.';
            break;
        case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password.';
            break;
        default:
            errorMessage = error.message || 'An unexpected error occurred.';
    }

    showMessage(errorMessage, 'error');
}


// Utility function to format date
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Utility function to validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Utility function to validate phone number
function isValidPhone(phone) {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
}

// Loading utility functions
function showLoadingOverlay(text = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');

    if (overlay) {
        if (loadingText) {
            loadingText.textContent = text;
        }
        overlay.classList.add('active');
    }
}

// Add forgot password functionality to login modal
function addForgotPasswordFeature() {
    // Add forgot password link to login form
    const loginForm = document.getElementById('login-form');
    const forgotPasswordLink = document.createElement('p');
    forgotPasswordLink.className = 'modal-switch';
    forgotPasswordLink.innerHTML = '<a href="#" id="forgot-password-link">Forgot your password?</a>';

    // Insert after the password field and before the submit button
    const passwordGroup = loginForm.querySelector('.form-group:last-child');
    passwordGroup.parentNode.insertBefore(forgotPasswordLink, passwordGroup.nextSibling);

    // Add event listener for forgot password
    document.getElementById('forgot-password-link').addEventListener('click', (e) => {
        e.preventDefault();
        showForgotPasswordModal();
    });
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

function showButtonLoading(button, loadingText = 'Loading...') {
    if (!button) return;

    const originalText = button.textContent;
    button.classList.add('btn-loading');
    button.disabled = true;

    // Store original text for restoration
    button.setAttribute('data-original-text', originalText);

    // Add loading spinner
    const spinner = document.createElement('span');
    spinner.className = 'loading';
    button.appendChild(spinner);

    // Update text
    const textSpan = button.querySelector('.btn-text') || button;
    if (textSpan) {
        textSpan.textContent = loadingText;
    }
}

function hideButtonLoading(button, originalText = null) {
    if (!button) return;

    button.classList.remove('btn-loading');
    button.disabled = false;

    // Remove loading spinner
    const spinner = button.querySelector('.loading');
    if (spinner) {
        spinner.remove();
    }

    // Restore original text
    const textToRestore = originalText || button.getAttribute('data-original-text') || 'Submit';
    button.textContent = textToRestore;
    button.removeAttribute('data-original-text');
}

// Export functions for use in other files
window.auth = auth;
window.db = db;
window.currentUser = currentUser;
window.isAdmin = isAdmin;
window.showMessage = showMessage;
window.formatDate = formatDate;
window.isValidEmail = isValidEmail;
window.isValidPhone = isValidPhone;
window.showLoadingOverlay = showLoadingOverlay;
window.hideLoadingOverlay = hideLoadingOverlay;
window.showButtonLoading = showButtonLoading;
window.hideButtonLoading = hideButtonLoading;