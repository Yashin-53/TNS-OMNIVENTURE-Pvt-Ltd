# TNS OMNIVENTURE Pvt. Ltd.

TNS OMNIVENTURE Pvt. Ltd. is a property marketplace that connects sellers with buyers. MERN stack, frontend and backend are separate apps.

- `backend/`  Express 5 + MongoDB (Mongoose), MVC, REST API, JWT + bcrypt, Cloudinary uploads
- `frontend/` React + Vite + Tailwind CSS

## Quick start

You need Node 18+ and a MongoDB instance (local or Atlas).

```bash
# 1. backend
cd backend
npm install
cp .env.example .env        # then fill in JWT_SECRET and the Cloudinary keys
npm run seed:demo           # optional: admin + demo seller/buyer + 6 sample properties
nodemon server.js           # or: npm run dev   (nodemon is a devDependency)

# 2. frontend (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev                 # http://localhost:5173
```

Demo logins after `npm run seed:demo`

| Role   | Phone      | Password  |
|--------|------------|-----------|
| Admin  | 9000000001 | Admin@123 |
| Seller | 9000000002 | Demo@123  |
| Buyer  | 9000000003 | Demo@123  |

`npm run seed:admin` creates only the admin (values come from `.env`). **Change the admin password before deploying.**

## Environment variables

`backend/.env`: `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL` (comma separated allowed origins),
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NODE_ENV`.

`frontend/.env`: `VITE_API_URL` (default `http://localhost:5000/api`).

## Folder structure

```
backend/
  server.js                 app setup, middleware, route mounting
  seed.js                   admin / demo data
  config/                   db.js, cloudinary.js
  models/                   User, Property, Review
  controllers/              auth, user, property, review, admin  (all logic lives here)
  routes/                   one file per controller
  middleware/               auth.js (protect, optionalAuth, sellerOnly, adminOnly), upload.js (multer), errorHandler.js
  utils/                    cloudinaryUpload, removeUser, sendOtp, generateToken, httpError

frontend/src/
  main.jsx, App.jsx         entry and routes
  api/axios.js              axios instance (adds the token automatically)
  context/AuthContext.jsx   login state
  pages/                    Home, PropertyDetail, Login, Register, PostProperty (create + edit), Profile, Admin, NotFound
  components/               Navbar, HeroSlider, PropertyCard, Gallery, Reviews, StarRating, Footer, ...
  data/constants.js         property types, amenities, hero slides
  utils/                    format.js (price/date/tax), units.js (area conversion)
```

## API overview

| Method | Route | Access |
|---|---|---|
| POST | `/api/auth/register`, `/login`, `/send-otp`, `/verify-otp` | public |
| GET | `/api/auth/me` | logged in |
| PUT / DELETE | `/api/users/me`, PUT `/api/users/me/password` | logged in |
| GET | `/api/properties?q=&type=&listingType=&sort=&page=&limit=` | public |
| GET | `/api/properties/:id` | public (dealer phone/email only for logged-in users) |
| GET | `/api/properties/mine` | logged in |
| POST | `/api/properties` (multipart: fields + `images` + `videos`) | seller / admin |
| PUT / DELETE | `/api/properties/:id` | owner / admin |
| GET / POST | `/api/properties/:id/reviews` | public / logged in (not own property, one per user) |
| DELETE | `/api/reviews/:id` | author / admin |
| GET | `/api/admin/stats`, `/users`, `/properties` | admin |
| PATCH / DELETE | `/api/admin/users/:id/status`, `/users/:id` | admin |

Errors are always `{ "message": "..." }`.

## Behaviour worth knowing

- **Roles:** `buyer`, `seller`, `admin`. Users pick buyer/seller at registration and can switch in their profile. Only sellers/admin can post. Everyone logged in can review (except on their own property). Admin can edit/delete any property and deactivate/delete any user.
- **Deactivating a user** blocks login (existing tokens stop working too) and hides their listings. Reactivating restores them.
- **OTP login:** the OTP is hashed, valid 5 minutes, single use, 5 wrong tries max. There is **no SMS/email provider yet**: `utils/sendOtp.js` only logs to the server console, and outside `NODE_ENV=production` the API also returns `devOtp` so the login page can show it. Plug your provider into `sendOtp.js` before going live.
- **Price and taxes:** a property stores a base `price` plus `stampDuty`, `registration`, `gst` percentages. The detail page lists each tax line and the total. For rent listings the price is per month.
- **Dimension:** stored as `area` + `unit`; the detail page lets visitors switch units (sq ft, sq m, sq yd, acre, hectare). Conversion factors are in `frontend/src/utils/units.js`.
- **Hero banner:** slides are in `frontend/src/data/constants.js` (placeholder Unsplash images). Replace with your own ad images.
- **Media:** images/videos go to Cloudinary (folder `tns-omniventure/properties`), up to 10 images and 3 videos, 50 MB each. Files are removed from Cloudinary when a property/user is deleted or a file is removed while editing.
- Auth endpoints are rate limited (100 requests / 15 min / IP).

## Conventions (handy when editing with an AI agent)

- Backend is plain CommonJS. Controllers throw `httpError(status, message)`; Express 5 forwards async errors to `middleware/errorHandler.js`, so there are no try/catch blocks in controllers.
- Validation lives in the Mongoose schemas, with friendly messages.
- Frontend uses Tailwind with custom colours (`ink`, `river`, `marigold`, `mist`, `line`) defined in `tailwind.config.js` and shared classes (`btn`, `input`, `card`, `label`) in `src/index.css`. Change the theme there.
- Keep pages simple: state with `useState`, data with `api.get/post/...`, toasts with `react-hot-toast`.
