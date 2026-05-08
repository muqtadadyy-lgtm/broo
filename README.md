# نظام الأنشطة الطلابية | University Activities Management System

A comprehensive Django-based web application for managing university student activities, applications, and communications.

## Features

### Student Features
- 📝 Register and manage student accounts
- 🎯 Browse and register for various activities (sports, cultural, artistic, scientific, social, technical)
- 📋 Submit activity applications with file uploads
- 💬 Communicate with employees through messaging system
- 📱 Multi-language support (Arabic, English, French, Kurdish)

### Employee Features
- 👥 Manage student applications (approve/reject)
- 📊 View statistics and reports
- 📢 Create and manage announcements
- 💼 Employee management and messaging
- 🎨 Activity creation and management
- 📈 Real-time dashboard with statistics

### Technical Features
- 🔐 Custom JWT authentication system
- 🌐 Responsive web design with RTL support
- 🎨 Multiple theme options
- 📱 Mobile-friendly interface
- 🚀 Railway deployment ready
- 📝 Comprehensive logging and error handling

## Technology Stack

- **Backend**: Django 4.x with Python
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Database**: SQLite (configurable for PostgreSQL/MySQL)
- **Authentication**: Custom JWT implementation
- **Deployment**: Docker + Railway
- **Styling**: Custom CSS with animations and themes

## Installation

### Prerequisites
- Python 3.8+
- pip
- Git

### Local Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bro
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your settings
   ```

5. **Run migrations**
   ```bash
   cd backend
   python manage.py migrate
   ```

6. **Create superuser (optional)**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run the development server**
   ```bash
   python manage.py runserver
   ```

8. **Access the application**
   - Frontend: http://localhost:8080
   - API: http://localhost:8080/api/

## User Roles

### طالب (Student)
- Register for activities
- Submit applications
- View personal dashboard
- Communicate with employees

### موظف (Employee)
- Full administrative access
- Manage student applications
- Create and manage activities
- View statistics and reports
- Manage other employees

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `PUT /api/users/profile` - Update profile

### Activities
- `GET /api/activities` - List activities
- `POST /api/activities/<id>/register` - Register for activity
- `GET /api/activities/my-registrations` - My registrations

### Applications
- `POST /api/applications/submit` - Submit application
- `GET /api/applications/my-applications` - My applications
- `GET /api/applications/all` - All applications (employees)
- `PUT /api/applications/<id>/status` - Update status (employees)

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/thread` - Get message thread

## Deployment

### Railway Deployment
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically from GitHub

### Environment Variables
```
DJANGO_SECRET_KEY=your-secret-key
DB_ENGINE=sqlite
JWT_SECRET_KEY=your-jwt-secret
DEBUG=False
```

## Project Structure

```
bro/
├── backend/
│   ├── core/                 # Main Django app
│   │   ├── models.py       # Database models
│   │   ├── views.py        # API views
│   │   ├── urls.py         # URL routing
│   │   └── middleware.py   # Custom middleware
│   ├── university_activities/  # Django project settings
│   ├── manage.py           # Django management
│   └── requirements.txt    # Python dependencies
├── static/
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   └── favicon.ico        # Site icon
├── templates/
│   ├── index.html         # Login/Register page
│   ├── student-dashboard.html  # Student dashboard
│   └── employee-dashboard.html # Employee dashboard
├── Dockerfile             # Docker configuration
├── railway.toml          # Railway deployment config
└── README.md             # This file
```

## Recent Updates

### Version 3.0
- ✅ Removed super_employee role for simplified role management
- ✅ Fixed unauthorized login warnings with custom middleware
- ✅ Improved database initialization and error handling
- ✅ Enhanced logging configuration
- ✅ Updated messaging system for employee-to-employee communication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.

---

**Developed with ❤️ for University Activity Management**
