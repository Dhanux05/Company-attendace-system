# SN Info Systems – Smart Attendance & Leave Management System

A production-ready full-stack attendance management system for interns with face verification and geo-fencing.

---

## 🏗️ Project Structure

```
sn-info-systems/
├── backend/
│   ├── config/db.js
│   ├── models/         (User, Attendance, Leave, Team)
│   ├── controllers/    (auth, attendance, leave, user)
│   ├── routes/         (auth, attendance, leave, users)
│   ├── middleware/auth.js
│   ├── utils/          (geoFence, generateToken)
│   └── server.js
└── frontend/
    └── src/
        ├── pages/intern/     (Dashboard, MarkAttendance, LeaveApp, History)
        ├── pages/teamlead/   (TeamAttendance, LeaveApproval, Analytics)
        ├── pages/admin/      (Dashboard, Users, Teams, Attendance, Analytics)
        ├── components/       (Layout, Sidebar, Header, Badge, Card)
        ├── context/AuthContext.js
        └── services/api.js
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

---

### 1. Clone / Extract the project
```bash
cd sn-info-systems
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sn-info-systems
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
OFFICE_LAT=12.9716
OFFICE_LNG=77.5946
OFFICE_RADIUS=100
```

Start backend:
```bash
# Development
npm run dev

# Production
npm start
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` file (optional):
```env
REACT_APP_API_URL=http://localhost:5000
```

Start frontend:
```bash
npm start
```

The app opens at `http://localhost:3000`

---

## 🔐 Creating Admin Account

After starting the backend, register the first user then manually update their role to "admin" in MongoDB:

```bash
# Using MongoDB shell or Compass
db.users.updateOne(
  { email: "admin@company.com" },
  { $set: { role: "admin" } }
)
```

Or use the register API directly with role:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@company.com","password":"admin123","role":"admin"}'
```

---

## 🌍 Geo-Fence Configuration

Default office: Bangalore (Lat: 12.9716, Lng: 77.5946), Radius: 100m

Change in `.env`:
```env
OFFICE_LAT=your_latitude
OFFICE_LNG=your_longitude
OFFICE_RADIUS=100
```

---

## 📱 Features

### Intern
- Dashboard with today's status
- Mark Login/Logout (face + location required)
- Apply leave with type and dates
- View attendance history with monthly stats
- Track leave application status

### Team Leader
- View all team members' attendance
- Approve/reject leave applications with notes
- Team analytics with charts

### Admin
- Full user management (edit, activate/deactivate)
- Team creation and management
- Full attendance records across all employees
- Analytics dashboard (attendance trends, leave stats)

---

## 🔒 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| POST | /api/auth/face | Save face embedding |
| GET | /api/auth/face | Get face embedding |

### Attendance
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | /api/attendance/login | All | Mark login |
| POST | /api/attendance/logout | All | Mark logout |
| GET | /api/attendance/today | All | Today status |
| GET | /api/attendance/my | All | My history |
| GET | /api/attendance/team | TL/Admin | Team records |
| GET | /api/attendance/all | Admin | All records |
| GET | /api/attendance/analytics | TL/Admin | Analytics data |

### Leave
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | /api/leaves | All | Apply leave |
| GET | /api/leaves/my | All | My leaves |
| GET | /api/leaves/team | TL/Admin | Team leaves |
| GET | /api/leaves/all | Admin | All leaves |
| PATCH | /api/leaves/:id/review | TL/Admin | Approve/Reject |

### Users/Teams
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | /api/users | Admin | All users |
| PUT | /api/users/:id | Admin | Update user |
| DELETE | /api/users/:id | Admin | Deactivate user |
| POST | /api/users/teams | Admin | Create team |
| GET | /api/users/teams | All | List teams |
| PUT | /api/users/teams/:id | Admin | Update team |

---

## 🚢 Deployment Guide

### MongoDB Atlas
1. Create free cluster at mongodb.com/atlas
2. Get connection string
3. Set `MONGODB_URI=mongodb+srv://...` in env

### Backend on Railway / Render / Heroku
```bash
# Set env variables in dashboard
PORT=5000
MONGODB_URI=<atlas_connection_string>
JWT_SECRET=<strong_random_secret>
OFFICE_LAT=12.9716
OFFICE_LNG=77.5946
OFFICE_RADIUS=100
```

### Frontend on Vercel / Netlify
```bash
cd frontend
npm run build
# Deploy the build/ folder
# Set REACT_APP_API_URL=https://your-backend-url.com
```

Update `package.json` proxy or set `REACT_APP_API_URL` for production.

In `frontend/src/services/api.js` change:
```js
const API = axios.create({ 
  baseURL: process.env.REACT_APP_API_URL || '/api' 
});
```

---

## 🧪 Face Recognition Notes

The system uses browser-based face embedding generation. For production:

1. Download face-api.js models from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
2. Place in `frontend/public/models/`
3. Replace the mock verification in `MarkAttendance.js` with actual face-api.js detection:

```js
import * as faceapi from "face-api.js";

// Load models
await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
await faceapi.nets.faceRecognitionNet.loadFromUri("/models");

// Get embedding
const detections = await faceapi
  .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
  .withFaceLandmarks()
  .withFaceDescriptor();

const embedding = Array.from(detections.descriptor);
```

---

## 🏃 Quick Start (Development)

```bash
# Terminal 1 - Backend
cd backend && npm install && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm install && npm start
```

Open http://localhost:3000, register as admin, create teams and users!
