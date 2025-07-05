
# 🎓 SemMate – Online Study Platform

**SemMate** is an interactive online study platform designed to enhance collaborative learning. It allows users to create or join study rooms, access shared materials, chat with peers, utilize AI-powered help, and track progress. Whether you're preparing for exams, organizing study groups, or exploring new topics, SemMate offers the tools you need — all in one place.

---

## ✨ Features

- 🔐 **Authentication**: Login, Sign Up, Forgot Password, and Email Verification pages  
- 🏠 **Public Room System**: Join with code or create rooms with unique names  
- 🤖 **AI Helper**: Get topic-based solutions with Wikipedia results using AI integration  
- 📚 **Library Access**: Search and read books using Google Books API  
- 🚀 **Rocket Chat**: One-on-one chat with voice recording for Q&A sessions  
- 📂 **Material Upload**: Upload resources, study plans, and online links  
- 👥 **User Grid**: See room participants with info and interaction options  
- 📊 **User Stats & Certificate**: Track study hours and receive certificates for platforms like LinkedIn or Glassdoor  
- 🛠 **Report Issues**: Built-in form to submit feedback or problems  

---

## 🗂 Project Structure

```
online-study-platform/
├── client/                 # frontend
│   ├── components/
│   ├── pages/
│   ├── public/
│   └── ...
├── server/                 # Node.js + Express backend
│   ├── controllers/
│   ├── routes/
│   ├── utils/
│   └── ...
├── .env                    # Environment variables
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have **Node.js**, **npm**, and **PostgreSQL** installed.

### Clone and Run Locally

```bash
git clone https://github.com/rjayaprakashnarayanarao/online-study-platform.git
cd online-study-platform
npm install
npm run dev
```

### Environment Variables (`.env`)

Create a `.env` file in the root directory and add the following:

```env
PORT=3000
DB_NAME=semMate
DB_USER=
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=5432

EMAIL_USER=
EMAIL_PASSWORD=

JWT_SECRET=SEM-MATE
SALT_ROUND=10

BASEURL=
DEEPAI_API_KEY=
GEMINI_API_KEY=
GOOGLE_BOOKS_API_KEY=
GOOGLE_APPLICATION_CREDENTIALS=
```

---

## ⚙️ How It Works

1. User visits the homepage (index page) to explore public rooms.
2. They can **join** an existing room using a code or **create** one by providing a room name.
3. Inside the room:
   - View room details, copy/share room code.
   - Use the **AI Helper** to get topic-based answers and Wikipedia results.
   - Access the **Library** for book searches.
   - Use **Rocket Chat** with voice features to communicate.
   - Upload **materials**, **study plans**, and **resources**.
4. View other users in a grid, interact or view their info.
5. Submit feedback using the **Report Issues** page.
6. Users get a certificate showing levels, study time, and activity.

---

## 📘 Learn More

This project uses the following technologies:

- **Frontend**: HTML, CSS, JS  
- **Backend**: Node.js + Express.js  
- **Database**: PostgreSQL  
- **APIs**: Google Books API, DeepAI, Gemini  
- **Cloud Deployment**: AWS  
- **Communication**: WebSockets  
- **Version Control**: GitHub  

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute it.

---

## 📬 Contact

**Author**: Jaya Prakash Narayana Rao  
- GitHub: [rjayaprakashnarayanarao](https://github.com/rjayaprakashnarayanarao)  
- Email: [rjayaprakashnarayanarao@gmail.com](mailto:rjayaprakashnarayanarao@gmail.com)  
- Phone: +91 93908 66948  

---

> Made with ❤️ for collaborative learning!
