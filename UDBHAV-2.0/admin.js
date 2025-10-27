// Admin Dashboard functionality
class AdminDashboard {
    constructor() {
        this.applications = [];
        this.filteredApplications = [];
        this.currentApplicationId = null;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('Admin dashboard loaded');
            this.initializeAdminDashboard();
        });
    }

    initializeAdminDashboard() {
        console.log('Initializing admin dashboard...');

        if (!window.auth || !window.db) {
            console.error('Firebase not initialized');
            this.showMessage('Error: Firebase not initialized', 'error');
            return;
        }

        window.auth.onAuthStateChanged(async (user) => {
            console.log('Auth state changed:', user ? user.email : 'No user');
            if (!user) {
                this.redirectToIndex();
                return;
            }

            const isAdmin = await this.checkAdminRole(user);
            if (isAdmin) {
                this.setupAdminEventListeners();
                await this.loadApplications();
            }
        });
    }

    async checkAdminRole(user) {
        try {
            console.log('Checking admin role for user:', user.uid);
            const userDoc = await window.db.collection('users').doc(user.uid).get();

            if (!userDoc.exists) {
                this.showMessage('Access denied. Admin privileges required.', 'error');
                this.redirectToIndex();
                return false;
            }

            const userData = userDoc.data();

            if (userData.role !== 'admin') {
                this.showMessage('Access denied. Admin privileges required.', 'error');
                this.redirectToIndex();
                return false;
            }

            document.getElementById('admin-name').textContent = user.displayName || 'Admin';
            console.log('Admin access granted');
            return true;

        } catch (error) {
            console.error('Error checking admin role:', error);
            this.showMessage('Error verifying admin access: ' + error.message, 'error');
            this.redirectToIndex();
            return false;
        }
    }

    setupAdminEventListeners() {
        // Logout button
        document.getElementById('admin-logout-btn').addEventListener('click', () => this.handleAdminLogout());

        // Filters
        document.getElementById('status-filter').addEventListener('change', () => this.filterApplications());
        document.getElementById('search-input').addEventListener('input', () => this.filterApplications());

        // Modal controls
        document.getElementById('close-rejection').addEventListener('click', () => this.closeModal('rejection'));
        document.getElementById('cancel-rejection').addEventListener('click', () => this.closeModal('rejection'));
        document.getElementById('rejection-form').addEventListener('submit', (e) => this.handleRejection(e));
        document.getElementById('close-application').addEventListener('click', () => this.closeModal('application'));

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) this.closeAllModals();
        });

        console.log('Admin event listeners setup complete');
    }

    async loadApplications() {
        try {
            console.log('Loading applications...');
            this.showLoading();
            this.showMessage('Loading applications...', 'info');

            const usersSnapshot = await window.db.collection('users').get();

            this.applications = [];
            let usersWithApplications = 0;

            for (const userDoc of usersSnapshot.docs) {
                try {
                    const applicationsSnapshot = await window.db.collection('users')
                        .doc(userDoc.id)
                        .collection('applications')
                        .get();

                    if (applicationsSnapshot.size > 0) {
                        usersWithApplications++;
                    }

                    applicationsSnapshot.forEach(appDoc => {
                        const data = appDoc.data();
                        this.applications.push({
                            id: appDoc.id,
                            userId: userDoc.id,
                            ...data
                        });
                    });
                } catch (error) {
                    console.error(`Error loading applications for user ${userDoc.id}:`, error);
                }
            }

            // Sort by createdAt (descending)
            this.applications.sort((a, b) => {
                const timeA = a.createdAt ? a.createdAt.toDate().getTime() : 0;
                const timeB = b.createdAt ? b.createdAt.toDate().getTime() : 0;
                return timeB - timeA;
            });

            this.filteredApplications = [...this.applications];
            this.updateStatistics();
            this.renderApplications();

            this.hideLoading();

            if (this.applications.length === 0) {
                this.showMessage('No applications found in the system.', 'info');
            } else {
                this.showMessage(`Loaded ${this.applications.length} applications`, 'success');
            }

        } catch (error) {
            console.error('Error loading applications:', error);
            this.showMessage('Error loading applications: ' + error.message, 'error');
            this.hideLoading();
        }
    }

    updateStatistics() {
        const total = this.applications.length;
        const pending = this.applications.filter(app => app.status === 'pending' || !app.status).length;
        const accepted = this.applications.filter(app => app.status === 'accepted').length;
        const rejected = this.applications.filter(app => app.status === 'rejected').length;

        document.getElementById('total-applications').textContent = total;
        document.getElementById('pending-applications').textContent = pending;
        document.getElementById('accepted-applications').textContent = accepted;
        document.getElementById('rejected-applications').textContent = rejected;
    }

    filterApplications() {
        const statusFilter = document.getElementById('status-filter').value;
        const searchTerm = document.getElementById('search-input').value.toLowerCase();

        this.filteredApplications = this.applications.filter(app => {
            const appStatus = app.status || 'pending';
            const matchesStatus = statusFilter === 'all' || appStatus === statusFilter;
            const matchesSearch = !searchTerm ||
                (app.teamName && app.teamName.toLowerCase().includes(searchTerm)) ||
                (app.collegeName && app.collegeName.toLowerCase().includes(searchTerm)) ||
                (app.email && app.email.toLowerCase().includes(searchTerm)) ||
                (app.teamLeader && app.teamLeader.toLowerCase().includes(searchTerm));

            return matchesStatus && matchesSearch;
        });

        this.renderApplications();
    }

    renderApplications() {
        const grid = document.getElementById('applications-grid');
        const noApplications = document.getElementById('no-applications');

        if (this.filteredApplications.length === 0) {
            grid.style.display = 'none';
            noApplications.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        noApplications.style.display = 'none';
        grid.innerHTML = this.filteredApplications.map(app => this.createApplicationCard(app)).join('');
    }

    createApplicationCard(app) {
        const status = app.status || 'pending';
        const statusClass = `status-${status}`;
        const statusIcon = this.getStatusIcon(status);
        const createdAt = app.createdAt ? this.formatDate(app.createdAt) : 'N/A';

        return `
            <div class="admin-card">
                <div class="application-header">
                    <h3>${app.teamName || 'No Team Name'}</h3>
                    <span class="status-badge ${statusClass}">
                        <i class="${statusIcon}"></i>
                        ${status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                </div>
                <div class="application-info">
                    <p><strong>Leader:</strong> ${app.teamLeader || 'N/A'}</p>
                    <p><strong>College:</strong> ${app.collegeName || 'N/A'}</p>
                    <p><strong>Email:</strong> ${app.email || 'N/A'}</p>
                    <p><strong>Contact:</strong> ${app.contact || 'N/A'}</p>
                    <p><strong>Submitted:</strong> ${createdAt}</p>
                </div>
                <div class="application-actions">
                    <button class="btn-primary" onclick="adminDashboard.viewApplication('${app.userId}', '${app.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    ${status === 'pending' ? `
                        <button class="btn-verify" onclick="adminDashboard.verifyApplication('${app.userId}', '${app.id}')">
                            <i class="fas fa-check"></i> Accept
                        </button>
                        <button class="btn-reject" onclick="adminDashboard.rejectApplication('${app.userId}', '${app.id}')">
                            <i class="fas fa-times"></i> Reject
                        </button>` : ''}
                </div>
            </div>
        `;
    }

    getStatusIcon(status) {
        switch (status) {
            case 'pending': return 'fas fa-clock';
            case 'accepted': return 'fas fa-check-circle';
            case 'rejected': return 'fas fa-times-circle';
            default: return 'fas fa-question-circle';
        }
    }

    async viewApplication(userId, applicationId) {
        try {
            const applicationDoc = await window.db.collection('users')
                .doc(userId)
                .collection('applications')
                .doc(applicationId)
                .get();

            if (!applicationDoc.exists) {
                this.showMessage('Application not found', 'error');
                return;
            }

            const application = { id: applicationDoc.id, ...applicationDoc.data() };
            this.showApplicationDetails(application);

        } catch (error) {
            console.error('Error loading application details:', error);
            this.showMessage('Error loading application details: ' + error.message, 'error');
        }
    }

    showApplicationDetails(application) {
        const detailsHtml = `
            <div class="application-details">
                <div class="detail-section">
                    <h3>Team Information</h3>
                    <p><strong>Team Name:</strong> ${application.teamName || 'N/A'}</p>
                    <p><strong>Team Leader:</strong> ${application.teamLeader || 'N/A'}</p>
                    <p><strong>Member 1:</strong> ${application.member1 || 'Not specified'}</p>
                    <p><strong>Member 2:</strong> ${application.member2 || 'Not specified'}</p>
                    <p><strong>Member 3:</strong> ${application.member3 || 'Not specified'}</p>
                </div>

                <div class="detail-section">
                    <h3>Contact Information</h3>
                    <p><strong>College:</strong> ${application.collegeName || 'N/A'}</p>
                    <p><strong>Email:</strong> ${application.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${application.contact || 'N/A'}</p>
                    <p><strong>Alternate:</strong> ${application.alternateContact || 'Not provided'}</p>
                </div>

                ${application.projectIdea ? `
                <div class="detail-section">
                    <h3>Project Idea</h3>
                    <p><strong>File:</strong> ${application.projectIdea}</p>
                </div>
                ` : ''}

                ${application.utrNumber || application.paymentUserName ? `
                <div class="detail-section">
                    <h3>Payment Information</h3>
                    <p><strong>Payment User Name: </strong> ${application.paymentUserName || 'N/A'}</p>
                    <p><strong>UTR Number:</strong> ${application.utrNumber}</p>
                    <p><strong>Payment Screenshot:</strong> ${application.paymentScreenshot || 'Not provided'}</p>
                </div>
                ` : ''}

                <div class="detail-section">
                    <h3>Application Status</h3>
                    <p><strong>Status:</strong> <span class="status-badge status-${application.status || 'pending'}">${(application.status || 'pending').charAt(0).toUpperCase() + (application.status || 'pending').slice(1)}</span></p>
                    <p><strong>Created:</strong> ${application.createdAt ? this.formatDate(application.createdAt) : 'N/A'}</p>
                    <p><strong>Updated:</strong> ${application.updatedAt ? this.formatDate(application.updatedAt) : 'N/A'}</p>
                    ${application.rejectionReason ? `<p><strong>Rejection Reason:</strong> ${application.rejectionReason}</p>` : ''}
                </div>
            </div>
        `;

        document.getElementById('application-details').innerHTML = detailsHtml;
        this.openModal('application');
    }

    async verifyApplication(userId, applicationId) {
        if (!confirm('Are you sure you want to accept this application?')) return;

        try {
            await window.db.collection('users').doc(userId)
                .collection('applications').doc(applicationId)
                .update({
                    status: 'accepted',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            this.showMessage('Application accepted successfully!', 'success');
            await this.loadApplications();
        } catch (error) {
            console.error('Error accepting application:', error);
            this.showMessage('Error accepting application: ' + error.message, 'error');
        }
    }

    rejectApplication(userId, applicationId) {
        this.currentApplicationId = { userId, applicationId };
        this.openModal('rejection');
    }

    async handleRejection(e) {
        e.preventDefault();
        const reason = document.getElementById('rejection-reason').value.trim();

        if (!reason) {
            this.showMessage('Please provide a reason for rejection', 'error');
            return;
        }

        try {
            await window.db.collection('users').doc(this.currentApplicationId.userId)
                .collection('applications').doc(this.currentApplicationId.applicationId)
                .update({
                    status: 'rejected',
                    rejectionReason: reason,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            this.closeModal('rejection');
            this.showMessage('Application rejected successfully!', 'success');
            await this.loadApplications();
        } catch (error) {
            console.error('Error rejecting application:', error);
            this.showMessage('Error rejecting application: ' + error.message, 'error');
        }
    }

    handleAdminLogout() {
        this.showSmoothOverlay('Logging out...', 'logout');

        setTimeout(() => {
            window.auth.signOut().then(() => {
                this.updateSmoothOverlayText('Redirecting to homepage...');

                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }).catch((error) => {
                this.hideSmoothOverlay();
                this.showMessage('Logout failed: ' + error.message, 'error');
            });
        }, 1000);
    }

    // Modal Management
    openModal(modalType) {
        this.closeAllModals();
        if (modalType === 'rejection') {
            document.getElementById('rejection-modal').style.display = 'block';
        } else if (modalType === 'application') {
            document.getElementById('application-modal').style.display = 'block';
        }
    }

    closeModal(modalType) {
        if (modalType === 'rejection') {
            document.getElementById('rejection-modal').style.display = 'none';
            document.getElementById('rejection-form').reset();
            this.currentApplicationId = null;
        } else if (modalType === 'application') {
            document.getElementById('application-modal').style.display = 'none';
        }
    }

    closeAllModals() {
        document.getElementById('rejection-modal').style.display = 'none';
        document.getElementById('application-modal').style.display = 'none';
    }

    // Utility Methods
    showLoading() {
        const grid = document.querySelector('.admin-grid');
        if (grid) grid.classList.add('loading-state');
    }

    hideLoading() {
        const grid = document.querySelector('.admin-grid');
        if (grid) grid.classList.remove('loading-state');
    }

    showMessage(message, type) {
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        document.body.insertBefore(messageDiv, document.body.firstChild);

        setTimeout(() => messageDiv.remove(), 5000);
    }

    redirectToIndex() {
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }

    formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        try {
            const date = timestamp.toDate();
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        } catch (error) {
            return 'Invalid Date';
        }
    }

    // Smooth Overlay Methods
    showSmoothOverlay(text = 'Loading...', type = 'default') {
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
        }

        overlay.className = `smooth-overlay ${type}-overlay`;
        overlay.querySelector('.smooth-overlay-text').textContent = text;
        setTimeout(() => overlay.classList.add('active'), 10);
    }

    updateSmoothOverlayText(text) {
        const overlay = document.getElementById('smooth-overlay');
        if (overlay) {
            overlay.querySelector('.smooth-overlay-text').textContent = text;
        }
    }

    hideSmoothOverlay() {
        const overlay = document.getElementById('smooth-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 500);
        }
    }
}

// Initialize Admin Dashboard
const adminDashboard = new AdminDashboard();


