# Market Connect

![Market Connect Banner](./docs/assets/banner.png)

Market Connect is a production-ready full-stack marketplace application for buyers and sellers that supports browsing, listing, purchasing, and managing products at scale. The project is implemented with a Node.js + Express backend, MongoDB (Mongoose) data layer, and a modern React front-end (Vite). It includes authentication (email/password + Google OAuth), role-based access, shopping cart and order flows, image uploads, email notifications, and seller analytics.

Live demo: (deployed) — replace this with your live URL: https://YOUR_DEPLOYMENT_URL

One-line pitch: a secure, extensible marketplace web app with buyer and seller workflows, production-ready features, and developer-friendly structure.

*Quick Features*
- Buyer and seller roles with role-based protected routes.
- JWT-based authentication (Authorization header) and Google OAuth integration.
- Product CRUD (seller-protected), product browsing and pagination.
- Cart management, orders, coupons, reviews.
- Image upload via Cloudinary.
- Password reset via email.

*Getting Started (Local development)*

Prerequisites:
- Node.js (>= 18 recommended) and npm
- MongoDB access (Atlas or local)
- Cloudinary account (for product images)

1. Clone the repository

powershell
git clone <your-repo-url>
cd Market_Connect/Market_Connect


2. Backend setup

powershell
cd Backend
npm install
# copy or create a .env file with required environment variables (see below)
node app.js


3. Frontend setup

powershell
cd ../Frontend
npm install
npm run dev


Open http://localhost:3000 (frontend) and the backend runs at http://localhost:8080 by default.

If you want, I can add:
- A docker-compose.yml for local development (MongoDB + backend)
- A Postman collection for all endpoints
- Full API reference section with request/response examples
# Market Connect

Market Connect is a full-stack marketplace application (buyer & seller) built with Node.js/Express, MongoDB, and a React frontend using Vite. It implements user authentication (email/password and Google OAuth), product listing, shopping cart, orders, reviews, and seller features.

*This README* covers project structure, local setup, running the app, environment variables, development notes, and troubleshooting tips.

*Repository layout:*
- **Backend/**: Express API, routes, controllers, models, authentication, and server configuration.
- **Frontend/**: React (Vite) single-page application, components, contexts, and API wrappers.
- **Documents/**: Requirements, user stories, and sprint artifacts.
- **market_connect/**: (project-specific or deployment assets)

*Tech stack:*
- Backend: Node.js, Express, Mongoose (MongoDB), Passport (Google OAuth), Cloudinary for image uploads, Nodemailer for emails.
- Frontend: React + Vite, Axios for API calls, React Router, FontAwesome.

*Quick Features*
- Buyer and seller roles with role-based protected routes.
- JWT-based authentication (Authorization header) and Google OAuth integration.
- Product CRUD (seller-protected), product browsing and pagination.
- Cart management, orders, coupons, reviews.
- Image upload via Cloudinary.
- Password reset via email.

*Getting Started (Local development)*

Prerequisites:
- Node.js (>= 18 recommended) and npm
- MongoDB access (Atlas or local)
- Cloudinary account (for product images)

1. Clone the repository

powershell
git clone <your-repo-url>
cd Market_Connect/Market_Connect


2. Backend setup

powershell
cd Backend
npm install
# copy or create a .env file with required environment variables (see below)
node app.js


3. Frontend setup

powershell
cd ../Frontend
npm install
npm run dev


Open http://localhost:3000 (frontend) and the backend runs at http://localhost:8080 by default.

*Environment variables (example .env entries)*
- PORT — backend port (default 8080)
- ATLASDB_URL — MongoDB connection string
- JWT_SECRET — secret used to sign JWTs
- FRONTEND_URL — allowed origin (e.g., http://localhost:3000)
- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET — for image upload
- EMAIL_USER, EMAIL_PASSWORD — for Nodemailer (password reset emails)

*Development notes & conventions*
- The frontend uses a single shared Axios instance at Frontend/api/axios.js. It injects the Authorization: Bearer <token> header from localStorage for authenticated requests.
- Backend CORS is configured in Backend/app.js to allow the frontend origin and credentials.
- Routes are namespaced under /api (e.g., GET /api/products, POST /api/login).
- Protected backend routes use middleware protect (JWT verification) and role checks like isSeller.

*Common commands*
- Backend (run):
	- node app.js or nodemon app.js
- Frontend:
	- npm run dev (start Vite dev server)
	- npm run build (build production bundle)

*Troubleshooting*
- If product requests fail after login, check:
	- Browser DevTools → Network: verify Authorization header is present and request goes to http://localhost:8080/api/products.
	- Backend console for CORS or server errors.
	- Ensure FRONTEND_URL environment variable matches the frontend origin and CORS is configured before route registration in Backend/app.js.
- Email not sending: verify EMAIL_USER and EMAIL_PASSWORD and that the provider allows SMTP access.

*Testing*
- Frontend contains unit tests under Frontend/src/__tests__ and Frontend/src/components/*/__tests__. Run tests with your test runner (if configured).

*Deployment notes*
- For production, set FRONTEND_URL to your deployed frontend origin, set PORT, use a secure JWT_SECRET, and ensure secure Cloudinary/Email credentials.
- Build the frontend (npm run build) and serve static files via a CDN or your preferred hosting. Configure the backend to serve the built frontend (optional) or keep them as separate services.

*Contributing*
- Follow existing code patterns: controllers in Backend/controllers, routes in Backend/routes, and shared validation schemas in Backend/validations.
- Create branches per feature/bugfix and open pull requests to main.

*Contact & Support*
- For questions about this codebase, contact the project owner or the contributor listed in the repo metadata.

---

If you want, I can also:
- Add more detailed API documentation (endpoints and request/response examples) to this README.
- Add a minimal docker-compose file for local development (MongoDB + backend).
- Generate an API Postman collection for quick testing.

Tell me which of the above additions you'd like and I will add them.
