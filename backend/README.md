# PFE Rapport Builder - Backend

This is the Node.js/Express backend for the **PFE Rapport Builder**, an end-to-end platform that transforms the unstructured process of writing a final internship report into a guided, structured, mobile-first experience.

## Project Functionality
- **Authentication & Roles**: Secure JWT-based authentication for Students, Supervisors, Faculty, and Admins.
- **Rapport Wizard Engine**: API endpoints to support a 9-step guided process, complete with a 30-second debounce auto-save endpoint (`PATCH /api/rapports/:id/autosave`).
- **Template Management**: Admins and Faculty can submit university-specific JSON schemas (formatting, sections, rules).
- **Supervisor Review Mode**: Students can generate unique, 7-day shareable links (`/api/reviews/generate`) that grant anonymous, read-only access where Reviewers can leave section-level threaded comments.
- **Knowledge Base (KB)**: Smart suggestions engine offering methodology explainers and templates based on project tags/sectors, with plagiarism-awareness tracking.
- **PDF Export**: Headless browser rendering (Puppeteer) to seamlessly export the HTML layout, including pagination and exact margins, into a standard A4 PDF.
- **Image Handling**: Cloudinary integration for 800x800 auto-resizing and hosting of diagram placeholders.

## Tech Stack
- **Node.js + Express** (REST API)
- **MongoDB + Mongoose** (Database Schemas)
- **JWT (JSON Web Tokens)** (Role-based auth via cookies)
- **Multer + Cloudinary** (Image management)
- **Puppeteer** (PDF Rendering)

## Running the Server
```bash
# Install dependencies
npm install

# Start development server (requires MongoDB running on localhost:27017)
npm run dev
```

## Environment Variables (.env)
Ensure your `.env` file is set up in the `backend` folder:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/pfe_rapport_builder
JWT_SECRET=supersecretjtwkey123
FRONTEND_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
