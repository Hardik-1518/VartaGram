# VartaGram - AI Powered Social Media Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit-blue)](https://varta-gram.vercel.app/)

VartaGram is a modern full-stack AI-powered social media web application that enables users to connect, share content, communicate in real-time, and interact with an intelligent AI chatbot called **Varta AI**.

Built using the MERN stack and modern web technologies, the platform combines social networking, real-time messaging, media sharing, and AI interaction into a single seamless experience.

---

# 🚀 Features

## 🔐 Secure Authentication
- User login and registration using Clerk Authentication
- Secure session management
- Protected routes and APIs

## 👤 Profile Management
- Update user profile
- Upload profile and cover images
- Edit bio and location

## ✍️ Post Creation & Sharing
- Create text and image posts
- Share content with other users
- Dynamic social media feed

## 💬 Real-Time Messaging
- Instant messaging system
- Real-time updates using SSE
- Fast and responsive communication

## 🤖 Varta AI Chatbot
- AI-powered chatbot integration using Groq API
- Intelligent conversations
- Caption generation and suggestions

## 👥 User Connections
- Follow and connect with users
- Discover users

## 🖼️ Media Upload & Optimization
- Image uploads using ImageKit
- Optimized media delivery

## 📱 Responsive Design
- Mobile-friendly interface
- Responsive UI across devices

---

# 📸 Screenshots

## Home Feed
![Home](<Screenshot 2026-04-30 145634.png>)

## Real-Time Messaging
![Message](<Screenshot 2026-03-15 163318.png>)

## AI Chatbot
![VartaAI](<Screenshot 2026-04-30 150835.png>)

## User Profile
![User](<Screenshot 2026-04-30 145948.png>)

---

# 🛠 Tech Stack

## Frontend
- React.js
- Redux Toolkit
- Vite
- Tailwind CSS
- Axios
- React Router DOM

## Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Multer

## External Services
- Clerk Authentication
- ImageKit
- Groq API

---

# 📁 Project Structure

```bash
VartaGram/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── redux/
│   │   ├── pages/
│   │   ├── api/
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── configs/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.js
│
├── README.md
└── package.json
```

---

# 🔧 Setup & Installation

## Prerequisites

Install the following before starting:

- Node.js
- MongoDB
- Git

---

# 📥 Installation

## 1. Clone Repository

```bash
git clone <repository-url >
cd VartaGram
```

## 2. Install Frontend Dependencies

```bash
cd client
npm install
```

## 3. Install Backend Dependencies

```bash
cd ../server
npm install
```

---

# ⚙️ Environment Variables

## Client (.env)

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_BACKEND_URL=http://localhost:4000
```

## Server (.env)

```env
PORT=4000

MONGODB_URI=your_mongodb_connection_string

CLERK_SECRET_KEY=your_clerk_secret_key

IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint

GROQ_API_KEY=your_groq_api_key
```

---

# ▶️ Running the Application

## Start Backend

```bash
cd server
npm run server
```

## Start Frontend

```bash
cd client
npm run dev
```

---

# 🌐 Access Application

## Frontend
```bash
http://localhost:5173
```

## Backend
```bash
http://localhost:4000
```

---

# 🔑 Authentication Flow

1. User signs in using Clerk authentication.
2. Clerk generates authentication token.
3. Frontend sends token with API requests.
4. Backend validates token.
5. Authorized access is granted.

---

# 💬 Real-Time Messaging Flow

1. User sends message.
2. Backend stores message in MongoDB.
3. SSE sends instant updates.
4. Recipient receives message in real-time.

---

# 🤖 AI Chatbot Flow

1. User sends prompt to Varta AI.
2. Backend sends request to Groq API.
3. AI generates response.
4. Response appears in chat interface.

---

# 🧪 Testing

## Testing Methods
- Unit Testing
- Integration Testing
- System Testing
- User Acceptance Testing

## Manual Testing
- Authentication Testing
- Profile Update Testing
- Messaging Testing
- AI Chatbot Testing
- Responsive UI Testing

---

# 🚀 Deployment

## Frontend Deployment
- Vercel

```bash
npm run build
```

## Backend Deployment
- Vercel

---

# 🔮 Future Enhancements

- Video & Audio Calling
- Mobile Application
- Push Notifications
- Advanced AI Recommendations
- Story & Reel Features
- Multi-language Support

---

# 👨‍💻 Author

## Hardik Srivastava
## Ankit Kumar Tiwari
## Vaibhav Baishkhiyar
## Shikhar Gupta

---

# 📄 License

This project is licensed under the MIT License.

---

# 🙏 Acknowledgements

- React.js Documentation
- Node.js Documentation
- MongoDB Documentation
- Clerk Authentication
- ImageKit
- Groq API
- Open Source Community

---

# ⭐ Support

If you like this project, give it a ⭐ on GitHub!

---

# 📬 Contact

📧 hardiksatwik2004.com

---

# 🎉 Thank You

## VartaGram — Connect. Share. Varta.