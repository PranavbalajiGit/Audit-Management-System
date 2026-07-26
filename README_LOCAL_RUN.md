# Local Run Guide for Audit Management System

This guide outlines how to run the application locally on Windows. The project consists of a **React + Vite Frontend (Client)** and a **Node.js + Express Backend (Server)**, which connects to a **MongoDB** database.

---

## Prerequisites

1. **Node.js** (LTS version) and **npm** (already verified on your system).
2. **MongoDB Database**: You can run this in one of three ways:
   - **Docker** (Recommended, uses the project's `docker-compose.yml`)
   - **Local MongoDB Installation** (Community Edition running as a Windows service)
   - **MongoDB Atlas** (Free cloud database)

---

## Step 1: Start MongoDB

### Option A: Using Docker (Recommended)
1. Open and start **Docker Desktop** on your Windows computer.
2. In your terminal, run the following command from the root of the cloned folder (`auditmanagement`):
   ```powershell
   docker compose up -d
   ```
   *Note: This will spin up a MongoDB container named `s7_mongodb` on port `27017`.*

### Option B: Using MongoDB Atlas (Cloud)
If you prefer not to use Docker:
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Get your connection string.
3. Open `server/.env` and update the `MONGO_URI` variable:
   ```env
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/smart_infrastructure_audit
   ```

---

## Step 2: Seed the Database

Once your MongoDB database is running, you need to populate it with default user roles, categories, and credentials.

1. Open a terminal and navigate to the `server` directory:
   ```powershell
   cd server
   ```
2. Run the seeding command:
   ```powershell
   npm run seed
   ```
   *This will seed the roles, categories, and generate default Admin and Auditor users.*

---

## Step 3: Run the Backend Server

1. From the `server` directory, run:
   ```powershell
   npm run dev
   ```
   The backend will start in development mode using `nodemon` on **port 5001** (as configured in `server/.env`).

---

## Step 4: Run the Frontend Client

1. Open a new terminal window.
2. Navigate to the `client` directory:
   ```powershell
   cd client
   ```
3. Run the development server:
   ```powershell
   npm run dev
   ```
   The client will compile and start, usually hosting the app on `http://localhost:5173`.

---

## Step 5: Log in to the Application

Open your browser and navigate to `http://localhost:5173`. You can log in using the following default credentials created by the seed script:

### Admin Dashboard (Full system access, manage audits and rooms)
* **Email:** `admin@s7.com`
* **Password:** `Password123!`

### Auditor Dashboard (Field auditor view, scan QR, submit checklists)
* **Email:** `auditor@s7.com`
* **Password:** `Password123!`

---

## AI & Storage Mock Configurations (Offline Mode)

The project has been configured in `server/.env` to run in **Mock Mode** for third-party services:
* **Gemini AI** will return mock room classification and analysis instead of making real API requests.
* **Cloudinary** will store uploaded audit images locally in the `server/uploads` folder instead of uploading to the cloud.

If you wish to enable the real features later, you can replace `mock_cloudinary` and `mock_gemini_key` with your actual credentials in the `server/.env` file.
