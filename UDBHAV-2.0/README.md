# UDBHAV-2.0 Project Expo

A comprehensive event registration system for the UDBHAV-2.0 Project Expo organized by Mysuru Royal Institute of Technology.

## Features

### User Features
- **Responsive Homepage** with Rewards, About, and Contact sections
- **User Authentication** with email/password login and registration
- **Animated Pipeline Application Process** with 3 steps:
  1. Registration Details
  2. Payment Integration
  3. Payment Confirmation
- **User Dashboard** with Application, Team Details, and Status pages
- **Real-time Status Updates** with email notifications
- **Team Management** with edit capabilities

### Admin Features
- **Admin Dashboard** with application management
- **Application Verification** with accept/reject functionality
- **Statistics Overview** with application counts
- **Search and Filter** capabilities
- **Email Notifications** for status updates

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Google Firebase (Authentication, Firestore, Storage)
- **Email**: SMTP integration
- **Deployment**: Netlify
- **Design**: Responsive, Mobile-first approach

## Color Palette

```css
:root {
  --bg: #2B2A33;
  --text: #EDEDF1;
  --muted: #B8B8C3;
  --green: #22c55e;
  --green-600: #16a34a;
  --card: #34323e;
  --card-600: #2f2d38;
  --shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}
```

## Setup Instructions

### 1. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password provider
3. Create a Firestore database
4. Set up Firebase Storage for file uploads
5. Update `firebase-config.js` with your project credentials:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

### 2. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Applications - users can read/write their own, admins can read all
    match /applications/{applicationId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Contact messages - authenticated users can write, admins can read
    match /contact/{messageId} {
      allow write: if request.auth != null;
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 3. Admin User Setup

1. Register a regular user account
2. In Firebase Console, go to Firestore Database
3. Find the user document in the `users` collection
4. Update the `role` field to `"admin"`

### 4. Email Configuration

For email notifications, you'll need to set up one of the following:

#### Option A: EmailJS (Recommended for static sites)
1. Sign up at [EmailJS](https://www.emailjs.com/)
2. Configure your email service
3. Update the email sending functions in the JavaScript files

#### Option B: Firebase Functions with Nodemailer
1. Set up Firebase Functions
2. Install nodemailer
3. Configure SMTP settings
4. Deploy the functions

### 5. Local Development

```bash
# Install dependencies
npm install

# Start local server
npm start

# Open http://localhost:3000
```

### 6. Deployment to Netlify

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.` (root directory)
4. Deploy!

## File Structure

```
├── index.html              # Homepage
├── dashboard.html          # User dashboard
├── admin.html             # Admin dashboard
├── styles.css             # Main stylesheet
├── script.js              # Main JavaScript
├── dashboard.js           # Dashboard functionality
├── admin.js               # Admin functionality
├── firebase-config.js     # Firebase configuration
├── package.json           # Project dependencies
└── README.md              # This file
```

## Features Breakdown

### Application Process

1. **Registration Details**
   - Team information
   - Contact details
   - Project idea upload (optional, 2MB limit)

2. **Payment**
   - QR code display
   - Account details
   - Payment confirmation

3. **Payment Details**
   - UTR number submission
   - Payment screenshot upload
   - Final confirmation

### Admin Workflow

1. **View Applications** in card format
2. **Filter and Search** applications
3. **Verify or Reject** with reason
4. **Send Email Notifications** automatically

## Customization

### Adding New Fields
1. Update the HTML forms
2. Modify the JavaScript form handlers
3. Update Firestore security rules if needed

### Styling Changes
1. Modify CSS variables in `:root`
2. Update component styles in `styles.css`

### Email Templates
1. Customize email content in the notification functions
2. Add HTML email templates for better formatting

## Security Considerations

- All user data is validated on the client side
- Firestore security rules prevent unauthorized access
- File uploads are validated for type and size
- Admin access is controlled through role-based authentication

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - See LICENSE file for details

## Support

For technical support or questions:
- Email: udbhav@mrit.edu.in
- Phone: +91 9876543210

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**UDBHAV-2.0** - Showcasing Innovation Across All Domains
