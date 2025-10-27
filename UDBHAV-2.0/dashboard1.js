let currentApplication = null;
let applicationStep = 1;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function () {
    // Firebase authentication listener
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            // Redirect if not logged in
            showSmoothRedirect('index.html', 'Redirecting to homepage...');
            return;
        }

        // Store logged-in user
        currentUser = user;
        console.log("Logged in as:", user.email);

        // Setup logout button and mobile menu
        setupLogoutButton();
        setupMobileMenu();

        // Initialize dashboard features
        initializeDashboard();
        setupDashboardEventListeners();
        await loadUserData();

        // Once data is loaded, start listening for live updates
        if (currentApplication) {
            setupStatusListener();
        }
    });
});

function setupMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link, .btn-logout').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

function initializeDashboard() {
    // Setup navigation
    const navLinks = document.querySelectorAll('.dashboard-nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            showPage(page);

            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Show application page by default
    showPage('application');
    initializePipeline();
}

function setupDashboardEventListeners() {
    // Registration form
    const registrationForm = document.getElementById('registration-form-element');
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleRegistrationSubmit);
    }

    // Payment done button
    const paymentDoneBtn = document.getElementById('payment-done-btn');
    if (paymentDoneBtn) {
        paymentDoneBtn.addEventListener('click', handlePaymentDone);
    }

    // Payment details form
    const paymentDetailsForm = document.getElementById('payment-details-form');
    if (paymentDetailsForm) {
        paymentDetailsForm.addEventListener('submit', handlePaymentDetailsSubmit);
    }

    // Edit team button
    const editTeamBtn = document.getElementById('edit-team-btn');
    if (editTeamBtn) {
        editTeamBtn.addEventListener('click', handleEditTeam);
    }

    // View status button
    const viewStatusBtn = document.getElementById('view-status-btn');
    if (viewStatusBtn) {
        viewStatusBtn.addEventListener('click', () => {
            showPage('status');
            // Update navigation
            document.querySelectorAll('.dashboard-nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-page') === 'status') {
                    link.classList.add('active');
                }
            });
        });
    }
}

// ✅ Setup logout button with smooth overlay
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Update user name in dashboard
    const userNameElement = document.getElementById('user-name');
    if (userNameElement && currentUser) {
        userNameElement.textContent = currentUser.displayName || currentUser.email;
    }
}

// ✅ Enhanced logout handler with smooth overlay
function handleLogout() {
    showSmoothOverlay('Logging out...', 'logout');

    // Add a small delay for better UX
    setTimeout(() => {
        auth.signOut().then(() => {
            updateSmoothOverlayText('Redirecting to homepage...');

            setTimeout(() => {
                showSmoothRedirect('index.html', 'Welcome to UDBHAV-2.0');
            }, 1500);
        }).catch((error) => {
            hideSmoothOverlay();
            showMessage('Logout failed: ' + error.message, 'error');
        });
    }, 1000);
}

// ✅ Load user data
async function loadUserData() {
    try {
        const applicationQuery = await db.collection('users')
            .doc(currentUser.uid)
            .collection('applications')
            .get();

        if (!applicationQuery.empty) {
            currentApplication = applicationQuery.docs[0].data();
            currentApplication.id = applicationQuery.docs[0].id;

            // Show already registered message
            document.getElementById('registration-form').style.display = 'none';
            document.getElementById('already-registered').style.display = 'block';

            // Update pipeline based on actual progress
            updatePipelineStatus();
            loadTeamDetails();
            loadStatus();

            // Set application step based on progress
            if (currentApplication.paymentDetailsCompleted) {
                applicationStep = 3;
            } else if (currentApplication.paymentCompleted) {
                applicationStep = 2;
            } else if (currentApplication.registrationCompleted) {
                applicationStep = 1;
            }
        } else {
            document.getElementById('registration-form').style.display = 'block';
            applicationStep = 1;
        }

        // Initialize pipeline with correct step
        initializePipeline();
    } catch (error) {
        console.error('Error loading user data:', error);
        showMessage('Error loading data: ' + error.message, 'error');
    }
}

function updatePipelineStatus() {
    if (!currentApplication) return;

    const steps = document.querySelectorAll('.pipeline-step');
    const progressLine = document.getElementById('pipeline-progress');

    // Reset all steps
    steps.forEach(step => {
        step.classList.remove('completed', 'active');
    });

    // Mark completed steps and update progress
    let completedSteps = 0;

    if (currentApplication.registrationCompleted) {
        steps[0].classList.add('completed');
        completedSteps = 1;
        applicationStep = Math.max(applicationStep, 2);
    }

    if (currentApplication.paymentCompleted) {
        steps[1].classList.add('completed');
        completedSteps = 2;
        applicationStep = Math.max(applicationStep, 3);
    }

    if (currentApplication.paymentDetailsCompleted) {
        steps[2].classList.add('completed');
        completedSteps = 3;
    }

    // Set active step
    if (completedSteps < 3) {
        steps[completedSteps].classList.add('active');
    }

    // Update progress line
    if (progressLine) {
        const progressWidth = (completedSteps / 3) * 80;
        progressLine.style.width = `${progressWidth}%`;
    }
}

// ✅ Handle Registration Submit
async function handleRegistrationSubmit(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');

    showButtonLoading(submitBtn, 'Submitting...');
    showLoadingOverlay('Submitting registration...');

    const formData = {
        teamName: document.getElementById('team-name').value,
        teamLeader: document.getElementById('team-leader').value,
        member1: document.getElementById('member-1').value,
        member2: document.getElementById('member-2').value,
        member3: document.getElementById('member-3').value,
        collegeName: document.getElementById('college-name').value,
        email: document.getElementById('email').value,
        contact: document.getElementById('contact').value,
        alternateContact: document.getElementById('alternate-contact').value,
        projectIdea: null
    };

    try {
        const applicationData = {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            ...formData,
            registrationCompleted: true,
            paymentCompleted: false,
            paymentDetailsCompleted: false,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('users')
            .doc(currentUser.uid)
            .collection('applications')
            .add(applicationData);

        currentApplication = { id: docRef.id, ...applicationData };

        hideButtonLoading(submitBtn, 'Submit Registration');
        hideLoadingOverlay();
        showMessage('Registration submitted successfully!', 'success');

        setTimeout(() => {
            animateStepCompletion(1);
            document.getElementById('registration-form').style.display = 'none';
            document.getElementById('payment-section').style.display = 'block';
            applicationStep = 2;
            updatePipelineStatus();
        }, 1000);
    } catch (error) {
        console.error('Error submitting registration:', error);
        hideButtonLoading(submitBtn, 'Submit Registration');
        hideLoadingOverlay();
        showMessage('Error submitting registration: ' + error.message, 'error');
    }
}

function handlePaymentDone() {
    if (!currentApplication) {
        showMessage('Please complete registration first.', 'error');
        return;
    }

    showLoadingOverlay('Updating payment status...');

    // Update payment status in database
    db.collection('users')
        .doc(currentUser.uid)
        .collection('applications')
        .doc(currentApplication.id)
        .update({
            paymentCompleted: true,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            hideLoadingOverlay();

            // Update local application data
            currentApplication.paymentCompleted = true;

            // Animate pipeline progression
            animateStepCompletion(2);

            // Move to payment details step
            setTimeout(() => {
                document.getElementById('payment-section').style.display = 'none';
                document.getElementById('payment-details-section').style.display = 'block';
                applicationStep = 3;
                updatePipelineStatus();
            }, 1000);
        })
        .catch((error) => {
            hideLoadingOverlay();
            console.error('Error updating payment status:', error);
            showMessage('Error updating payment status: ' + error.message, 'error');
        });
}

// ✅ Update payment details with new field
// ✅ Update payment details - Modified to work without file upload
// ✅ Update payment details
async function handlePaymentDetailsSubmit(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');

    showButtonLoading(submitBtn, 'Submitting...');
    showLoadingOverlay('Submitting payment details...');

    const paymentUserName = document.getElementById('payment-user-name').value;
    const utrNumber = document.getElementById('utr-number').value;
    const paymentScreenshot = document.getElementById('payment-screenshot').files[0];
    const confirmationCheckbox = document.getElementById('confirmation-checkbox').checked;

    try {
        await db.collection('users')
            .doc(currentUser.uid)
            .collection('applications')
            .doc(currentApplication.id)
            .update({
                paymentUserName: paymentUserName,
                utrNumber: utrNumber,
                paymentScreenshot: paymentScreenshot.name,
                paymentDetailsCompleted: true,
                status: 'pending',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

        hideButtonLoading(submitBtn, 'Final Submit');
        hideLoadingOverlay();
        showMessage('Application submitted successfully!', 'success');
        animateStepCompletion(3);

        setTimeout(() => {
            document.getElementById('payment-details-section').style.display = 'none';
            document.getElementById('already-registered').style.display = 'block';
            sendConfirmationEmail();
            setTimeout(() => showPage('status'), 2000);
        }, 1000);
    } catch (error) {
        console.error('Error submitting payment details:', error);
        hideButtonLoading(submitBtn, 'Final Submit');
        hideLoadingOverlay();
        showMessage('Error submitting payment details: ' + error.message, 'error');
    }
}

async function loadTeamDetails() {
    if (!currentApplication) return;

    const teamInfoContent = document.getElementById('team-info-content');
    teamInfoContent.innerHTML = `
        <div class="team-item">
            <h4>Team Name</h4>
            <p id="display-team-name">${currentApplication.teamName}</p>
        </div>
        <div class="team-item">
            <h4>Team Leader</h4>
            <p>${currentApplication.teamLeader}</p>
        </div>
        <div class="team-item">
            <h4>Team Members</h4>
            <p>${currentApplication.member1 || 'Not specified'}</p>
            <p>${currentApplication.member2 || 'Not specified'}</p>
            <p>${currentApplication.member3 || 'Not specified'}</p>
        </div>
        <div class="team-item">
            <h4>College</h4>
            <p>${currentApplication.collegeName}</p>
        </div>
        <div class="team-item">
            <h4>Contact Information</h4>
            <p><strong>Email:</strong> ${currentApplication.email}</p>
            <p><strong>Phone:</strong> ${currentApplication.contact}</p>
            ${currentApplication.alternateContact ? `<p><strong>Alternate:</strong> ${currentApplication.alternateContact}</p>` : ''}
        </div>
        ${currentApplication.paymentUserName ? `
        <div class="team-item">
            <h4>Payment Information</h4>
            <p><strong>Payment By:</strong> ${currentApplication.paymentUserName}</p>
            ${currentApplication.utrNumber ? `<p><strong>UTR Number:</strong> ${currentApplication.utrNumber}</p>` : ''}
        </div>
        ` : ''}
        ${currentApplication.projectIdea ? `
        <div class="team-item">
            <h4>Project Idea</h4>
            <p>${currentApplication.projectIdea}</p>
        </div>
        ` : ''}
    `;

    // Show edit button if application is still pending
    if (currentApplication.status === 'pending') {
        document.getElementById('edit-team-btn').style.display = 'block';
    }
}

function handleEditTeam() {
    const currentTeamName = currentApplication.teamName;
    const newTeamName = prompt('Enter new team name:', currentTeamName);

    if (newTeamName && newTeamName !== currentTeamName) {
        updateTeamName(newTeamName);
    }
}

async function updateTeamName(newTeamName) {
    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('applications').doc(currentApplication.id).update({
                teamName: newTeamName,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

        currentApplication.teamName = newTeamName;
        document.getElementById('display-team-name').textContent = newTeamName;

        showMessage('Team name updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating team name:', error);
        showMessage('Error updating team name: ' + error.message, 'error');
    }
}

async function loadStatus() {
    if (!currentApplication) return;

    const statusCard = document.getElementById('status-card');
    const statusIcon = document.getElementById('status-icon');
    const statusTitle = document.getElementById('status-title');
    const statusMessage = document.getElementById('status-message');
    const rejectionReason = document.getElementById('rejection-reason');
    const rejectionText = document.getElementById('rejection-text');

    // Reset classes
    statusCard.className = 'status-card';
    statusIcon.className = 'status-icon';

    switch (currentApplication.status) {
        case 'pending':
            statusCard.classList.add('status-pending');
            statusIcon.innerHTML = '<i class="fas fa-clock"></i>';
            statusTitle.textContent = 'Pending';
            statusMessage.textContent = 'Your application is under review.';
            rejectionReason.style.display = 'none';
            break;

        case 'accepted':
            statusCard.classList.add('status-accepted');
            statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
            statusTitle.textContent = 'Accepted';
            statusMessage.textContent = 'Congratulations! Your application has been accepted.';
            rejectionReason.style.display = 'none';
            break;

        case 'rejected':
            statusCard.classList.add('status-rejected');
            statusIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
            statusTitle.textContent = 'Rejected';
            statusMessage.textContent = 'Unfortunately, your application has been rejected.';
            if (currentApplication.rejectionReason) {
                rejectionText.textContent = currentApplication.rejectionReason;
                rejectionReason.style.display = 'block';
            }
            break;

        default:
            statusCard.classList.add('status-pending');
            statusIcon.innerHTML = '<i class="fas fa-question-circle"></i>';
            statusTitle.textContent = 'Unknown';
            statusMessage.textContent = 'Status unknown.';
            rejectionReason.style.display = 'none';
    }
}

function showPage(pageName) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.style.display = 'none');

    // Show selected page
    const targetPage = document.getElementById(pageName + '-page');
    if (targetPage) {
        targetPage.style.display = 'block';

        // Load page-specific data
        if (pageName === 'team-details') {
            loadTeamDetails();
        } else if (pageName === 'status') {
            loadStatus();
        }
    }
}

async function sendConfirmationEmail() {
    console.log('Confirmation email should be sent to:', currentUser.email);
    showMessage('Confirmation email will be sent to your registered email address.', 'info');
}

// ✅ Realtime listener
function setupStatusListener() {
    if (!currentApplication) return;

    db.collection('users')
        .doc(currentUser.uid)
        .collection('applications')
        .doc(currentApplication.id)
        .onSnapshot((doc) => {
            if (doc.exists) {
                const updatedData = doc.data();
                currentApplication = { id: doc.id, ...updatedData };

                if (document.getElementById('status-page').style.display !== 'none') {
                    loadStatus();
                }
                if (document.getElementById('team-details-page').style.display !== 'none') {
                    loadTeamDetails();
                }

                // Update pipeline status if needed
                updatePipelineStatus();
            }
        });
}

// Animation and step management functions
function animateStepCompletion(stepNumber) {
    const step = document.getElementById(`step-${stepNumber}`);
    const progressLine = document.getElementById('pipeline-progress');

    if (step) {
        // Add completion animation
        step.classList.add('completed');

        // Add checkmark animation
        setTimeout(() => {
            step.style.transform = 'scale(1.05)';
            setTimeout(() => {
                step.style.transform = 'scale(1)';
            }, 200);
        }, 300);
    }

    // Update progress line
    if (progressLine) {
        const progressWidth = (stepNumber / 3) * 80;
        progressLine.style.width = `${progressWidth}%`;
    }

    // Activate next step
    if (stepNumber < 3) {
        const nextStep = document.getElementById(`step-${stepNumber + 1}`);
        if (nextStep) {
            nextStep.classList.add('active');
        }
    }
}

function showStepForm(stepNumber) {
    // Hide all forms
    document.getElementById('registration-form').style.display = 'none';
    document.getElementById('payment-section').style.display = 'none';
    document.getElementById('payment-details-section').style.display = 'none';
    document.getElementById('already-registered').style.display = 'none';

    // Show appropriate form based on step
    switch (stepNumber) {
        case 1:
            document.getElementById('registration-form').style.display = 'block';
            break;
        case 2:
            document.getElementById('payment-section').style.display = 'block';
            break;
        case 3:
            document.getElementById('payment-details-section').style.display = 'block';
            break;
    }

    // Update active step in pipeline
    const steps = document.querySelectorAll('.pipeline-step');
    steps.forEach((step, index) => {
        step.classList.remove('active');
        if (index + 1 === stepNumber) {
            step.classList.add('active');
        }
    });
}

// Initialize pipeline on page load
function initializePipeline() {
    const steps = document.querySelectorAll('.pipeline-step');
    steps.forEach((step, index) => {
        step.addEventListener('click', () => {
            if (index + 1 <= applicationStep) {
                showStepForm(index + 1);
            } else {
                showMessage('Please complete the previous steps first.', 'info');
            }
        });
    });

    // Set initial active step
    if (applicationStep >= 1) {
        showStepForm(applicationStep);
    }
}

// Keep all the existing smooth overlay functions from your original code
// ... (all the smooth overlay functions remain the same)

// Message function for dashboard
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

// Add smooth scrolling for form sections
function scrollToForm() {
    const formSection = document.querySelector('.form-section');
    if (formSection) {
        formSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// ✅ Smooth overlay functions
function showSmoothOverlay(text = 'Loading...', type = 'default') {
    // Create overlay if it doesn't exist
    let overlay = document.getElementById('smooth-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'smooth-overlay';
        overlay.className = 'smooth-overlay';
        overlay.innerHTML = `
            <div class="smooth-overlay-content">
                <div class="smooth-spinner"></div>
                <div class="smooth-overlay-text">${text}</div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Add styles if not already present
        addSmoothOverlayStyles();
    }

    // Add type-specific class
    overlay.className = `smooth-overlay ${type}-overlay`;
    overlay.querySelector('.smooth-overlay-text').textContent = text;

    // Show overlay with animation
    setTimeout(() => {
        overlay.classList.add('active');
    }, 10);
}

function updateSmoothOverlayText(text) {
    const overlay = document.getElementById('smooth-overlay');
    if (overlay) {
        const textElement = overlay.querySelector('.smooth-overlay-text');
        if (textElement) {
            textElement.textContent = text;
        }
    }
}

function hideSmoothOverlay() {
    const overlay = document.getElementById('smooth-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
            }
        }, 500);
    }
}

function showSmoothRedirect(url, message = 'Redirecting...') {
    showSmoothOverlay(message, 'redirect');

    // Add completion animation
    setTimeout(() => {
        updateSmoothOverlayText('Success!');

        // Brief pause to show success
        setTimeout(() => {
            window.location.href = url;
        }, 800);
    }, 1000);
}

function addSmoothOverlayStyles() {
    // Check if styles already exist
    if (document.getElementById('smooth-overlay-styles')) return;

    const styles = `
        <style id="smooth-overlay-styles">
            .smooth-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                opacity: 0;
                visibility: hidden;
                transition: all 0.5s ease-in-out;
            }

            .smooth-overlay.active {
                opacity: 1;
                visibility: visible;
            }

            .smooth-overlay-content {
                text-align: center;
                color: white;
                transform: translateY(20px);
                transition: transform 0.5s ease-in-out;
            }

            .smooth-overlay.active .smooth-overlay-content {
                transform: translateY(0);
            }

            .smooth-spinner {
                width: 60px;
                height: 60px;
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-top: 4px solid white;
                border-radius: 50%;
                margin: 0 auto 20px;
                animation: smooth-spin 1s linear infinite;
            }

            .logout-overlay .smooth-spinner {
                border-top: 4px solid #ff6b6b;
            }

            .redirect-overlay .smooth-spinner {
                border-top: 4px solid #51cf66;
            }

            .smooth-overlay-text {
                font-size: 1.2rem;
                font-weight: 500;
                margin-bottom: 10px;
                font-family: 'Inter', sans-serif;
            }

            @keyframes smooth-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Pulse animation for success state */
            .smooth-overlay.redirect-overlay.active .smooth-spinner {
                animation: smooth-pulse 0.6s ease-in-out 3;
                border: 4px solid rgba(255, 255, 255, 0.8);
                border-top: 4px solid transparent;
            }

            @keyframes smooth-pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
            }
        </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
}