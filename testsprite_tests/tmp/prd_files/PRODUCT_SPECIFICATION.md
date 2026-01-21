# Product Specification Document
## Got Journey Thailand - Travel Booking Platform

**Version:** 1.0.0  
**Last Updated:** December 2024  
**Project Type:** Full-Stack Web Application

---

## 1. Executive Summary

Got Journey Thailand is a comprehensive travel booking platform that enables users to book hotel packages and car rentals in Chiang Rai, Thailand. The platform features a multi-vendor marketplace, integrated payment processing, multi-language support, and comprehensive admin management tools.

### Key Value Propositions
- **For Customers:** Easy booking experience for hotels and car rentals with secure payment processing
- **For Partners:** Multi-vendor marketplace with Stripe Connect integration for payment distribution
- **For Administrators:** Complete management dashboard for hotels, cars, bookings, and payments

---

## 2. Product Overview

### 2.1 Application Architecture

**Technology Stack:**
- **Frontend:** Next.js 14 (App Router), React 18, TailwindCSS
- **Backend:** Next.js API Routes (Server-side)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** NextAuth.js v5 (JWT-based), Google OAuth
- **Payment:** Stripe (Credit Cards, PayPal, PromptPay)
- **Email:** Resend API
- **Deployment:** Vercel

**Architecture Pattern:**
- Monorepo structure with separate frontend and backend apps
- API-first design with RESTful endpoints
- Server-side rendering (SSR) and client-side rendering (CSR) hybrid
- JWT-based authentication with HttpOnly cookies

### 2.2 User Roles

1. **Guest User** - Browse hotels/cars, view details (no authentication required)
2. **Registered User** - Create bookings, manage profile, view booking history
3. **Partner** - Hotel owners or car rental providers (multi-vendor support)
4. **Admin** - Full system management access

---

## 3. Core Features & User Flows

### 3.1 Hotel Booking Flow

**User Journey:**
1. **Browse Hotels** (`GET /api/hotels`)
   - View list of available hotels with pagination
   - Filter by location (e.g., "Chiang Rai")
   - View hotel cards with images, name, location, price

2. **View Hotel Details** (`GET /api/hotels/[id]`)
   - See full hotel information
   - View available room types with pricing
   - See amenities and descriptions

3. **Create Booking** (`POST /api/bookings`)
   - Select check-in and check-out dates
   - Choose room type
   - Enter guest information (name, email, phone)
   - System calculates total price based on nights
   - Generates unique booking code

4. **Payment** (`POST /api/checkout`)
   - Create Stripe Checkout session
   - Redirect to Stripe payment page
   - Support multiple payment methods (Credit Card, PayPal, PromptPay)
   - Multi-currency support (THB, USD, EUR, JPY, CNY, GBP)

5. **Booking Confirmation** (`GET /api/bookings/[code]`)
   - View booking details
   - Download invoice PDF
   - Receive email confirmation

**API Endpoints:**
- `GET /api/hotels` - List hotels (public)
- `GET /api/hotels/[id]` - Hotel details (public)
- `POST /api/bookings` - Create booking (authenticated)
- `POST /api/checkout` - Create payment session (authenticated)
- `GET /api/bookings/[code]` - Get booking by code (public)
- `GET /api/bookings/[code]/invoice` - Download invoice (public)

### 3.2 Car Rental Flow

**User Journey:**
1. **Browse Cars** (`GET /api/cars`)
   - View available rental cars
   - Filter by brand, model, price range
   - See car details with images and specifications

2. **View Car Details** (`GET /api/cars/[id]`)
   - Full car specifications
   - Pricing per day
   - Availability calendar

3. **Create Booking** (`POST /api/bookings`)
   - Select rental dates
   - Enter driver information
   - System calculates total price

4. **Payment & Confirmation** (Same as hotel flow)

**API Endpoints:**
- `GET /api/cars` - List cars (public)
- `GET /api/cars/[id]` - Car details (public)
- `POST /api/bookings` - Create car booking (authenticated)

### 3.3 Authentication Flow

**Registration:**
- `POST /api/auth/register` - Create new user account
- Email/password registration
- Email verification (optional in mock mode)

**Login:**
- `POST /api/auth/login` - Email/password login
- `GET /api/auth/signin/google` - Google OAuth login
- Returns JWT token stored in HttpOnly cookie
- Separate tokens for users (`user_token`) and admins (`admin_token`)

**Session Management:**
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout and clear cookies
- `GET /api/auth/csrf` - Get CSRF token for OAuth

**Password Reset:**
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/validate-reset-token` - Validate reset token

**API Endpoints:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User/Admin login
- `GET /api/auth/signin/google` - Initiate Google OAuth
- `GET /api/auth/callback/google` - Google OAuth callback (NextAuth)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### 3.4 Admin Dashboard Flow

**Admin Login:**
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/auth` - Verify admin session

**Dashboard Features:**
- View statistics (bookings, revenue, users)
- Manage hotels (CRUD operations)
- Manage cars (CRUD operations)
- Manage bookings (view, update status)
- View payment history and statistics
- Manage partners (multi-vendor)

**API Endpoints:**
- `POST /api/admin/login` - Admin login
- `GET /api/admin/auth` - Check admin auth
- `GET /api/dashboard/stats` - Dashboard statistics
- `POST /api/hotels` - Create hotel (admin only)
- `PUT /api/hotels/[id]` - Update hotel (admin only)
- `DELETE /api/hotels/[id]` - Delete hotel (admin only)
- `GET /api/payments` - Payment history (admin only)
- `GET /api/payments/stats` - Payment statistics (admin only)

### 3.5 Partner Dashboard Flow

**Partner Features:**
- View own hotels/cars
- View bookings for own properties
- Connect Stripe account (Stripe Connect)
- View earnings and payouts
- Manage room types for hotels

**API Endpoints:**
- `GET /api/partners/[id]` - Get partner info
- `POST /api/partners/[id]/connect-stripe` - Connect Stripe account
- `GET /api/partners/[id]/stripe-status` - Check Stripe connection status

### 3.6 Payment Processing Flow

**Stripe Integration:**
1. User creates booking
2. System creates Stripe Checkout session (`POST /api/checkout`)
3. User redirected to Stripe payment page
4. User completes payment
5. Stripe sends webhook to `POST /api/webhook/stripe`
6. System updates booking status to "PAID"
7. System sends confirmation email

**Payment Methods Supported:**
- Credit/Debit Cards (Visa, Mastercard, Amex)
- PayPal (via Stripe)
- PromptPay (Thai payment method)

**Multi-Currency:**
- Base currency: THB (Thai Baht)
- Supported: USD, EUR, JPY, CNY, GBP
- Exchange rates stored in database
- Automatic conversion at checkout

**Webhook Events Handled:**
- `checkout.session.completed` - Payment successful
- `checkout.session.async_payment_succeeded` - Async payment succeeded
- `checkout.session.async_payment_failed` - Async payment failed
- `checkout.session.expired` - Session expired

**API Endpoints:**
- `POST /api/checkout` - Create checkout session
- `POST /api/webhook/stripe` - Stripe webhook handler
- `GET /api/payments` - Payment history (admin)
- `GET /api/payments/stats` - Payment statistics (admin)

---

## 4. Technical Specifications

### 4.1 Database Schema

**Core Tables:**
- `users` - User accounts (email, password_hash, google_id, role)
- `admins` - Admin accounts (email, password_hash, role, is_active)
- `partners` - Partner/vendor accounts (Stripe Connect integration)
- `hotels` - Hotel listings (name, location, description, images)
- `room_types` - Room types for hotels (name, price_per_night, capacity)
- `cars` - Car rental listings (brand, model, price_per_day, images)
- `bookings` - Booking records (hotel_id/car_id, dates, guest_info, status, total_price)
- `payments` - Payment records (booking_id, stripe_session_id, amount, status, currency)
- `exchange_rates` - Currency exchange rates (from_currency, to_currency, rate, updated_at)

**Key Relationships:**
- Hotels → Room Types (one-to-many)
- Hotels → Partners (many-to-one)
- Bookings → Hotels/Cars (many-to-one)
- Bookings → Users (many-to-one)
- Payments → Bookings (one-to-one)

### 4.2 API Response Formats

**Success Response:**
```json
{
  "data": [...],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 100
  }
}
```

**Error Response:**
```json
{
  "error": "Error message in Thai or English",
  "code": "ERROR_CODE"
}
```

**Booking Response:**
```json
{
  "booking": {
    "id": "uuid",
    "code": "BOOK-XXXXXX",
    "hotel_id": "uuid",
    "room_type_id": "uuid",
    "check_in": "2024-12-25",
    "check_out": "2024-12-27",
    "guests": 2,
    "total_price": 5000,
    "status": "PENDING",
    "guest_name": "John Doe",
    "guest_email": "john@example.com",
    "guest_phone": "0812345678"
  }
}
```

### 4.3 Authentication & Authorization

**JWT Token Structure:**
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "name": "User Name",
  "role": "user" | "admin" | "partner",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Cookie Configuration:**
- `user_token` - For regular users (7 days expiry)
- `admin_token` - For admins (24 hours expiry)
- HttpOnly: true (prevents XSS)
- Secure: true (production only)
- SameSite: lax

**Authorization Levels:**
- **Public:** Hotels list, Cars list, Hotel/Car details
- **Authenticated:** Create bookings, View own bookings, Profile management
- **Admin:** All CRUD operations, Payment history, Statistics
- **Partner:** Manage own properties, View own bookings

### 4.4 Validation Rules

**Hotel Booking:**
- Check-in date must be in the future
- Check-out date must be after check-in
- Guests count must be positive
- Email must be valid format
- Phone must be valid Thai phone format (optional)

**Car Booking:**
- Rental start date must be in the future
- Rental end date must be after start date
- Driver must be 18+ years old (if applicable)

**User Registration:**
- Email must be unique
- Password minimum 8 characters
- Name is required

### 4.5 Error Handling

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

**Error Messages:**
- All error messages support Thai and English
- Error codes for programmatic handling
- Detailed error messages for debugging (development mode)

---

## 5. User Interface Specifications

### 5.1 Frontend Pages

**Public Pages:**
- `/` - Homepage (hotel/car highlights)
- `/hotels` - Hotels listing with filters
- `/hotels/[id]` - Hotel details page
- `/cars` - Cars listing
- `/cars/[id]` - Car details page
- `/contact` - Contact form
- `/login` - User login page
- `/register` - User registration page

**Authenticated Pages:**
- `/profile` - User profile management
- `/booking` - Booking form (hotel or car)
- `/checkout` - Payment checkout (redirects to Stripe)
- `/success` - Booking success confirmation

**Admin Pages:**
- `/admin/login` - Admin login
- `/admin/dashboard` - Admin dashboard with statistics
- `/admin/hotels` - Manage hotels (CRUD)
- `/admin/cars` - Manage cars (CRUD)
- `/admin/bookings` - Manage bookings
- `/admin/partners` - Manage partners
- `/admin/payments` - Payment history and statistics

**Partner Pages:**
- `/partner/dashboard` - Partner dashboard

### 5.2 UI Components

**Shared Components:**
- Navbar (with language switcher)
- Footer
- Hotel Card
- Car Card
- Button, Input, Card, Badge
- Date Picker
- Image Upload

**Admin Components:**
- Sidebar navigation
- Payment Table
- Status Select (for bookings)

### 5.3 Internationalization (i18n)

**Supported Languages:**
- Thai (th) - Default
- English (en)

**Localized Content:**
- All UI text
- Error messages
- Email templates
- Date formats
- Currency display

---

## 6. Security Specifications

### 6.1 Authentication Security
- Password hashing with bcrypt (10 rounds)
- JWT tokens with HS256 algorithm
- HttpOnly cookies prevent XSS attacks
- CSRF protection for OAuth flows
- Rate limiting on authentication endpoints

### 6.2 API Security
- Input validation with Zod schemas
- SQL injection prevention (parameterized queries via Supabase)
- Rate limiting middleware
- Security headers (CORS, XSS protection)
- Request size limits

### 6.3 Payment Security
- Stripe PCI-compliant payment processing
- Webhook signature verification
- Secure API key storage (environment variables)
- Payment amount validation
- Idempotency keys for payment operations

### 6.4 Data Protection
- Sensitive data encryption at rest (Supabase)
- HTTPS only in production
- Secure session management
- Password reset token expiration
- Account lockout after failed login attempts (configurable)

---

## 7. Testing Requirements

### 7.1 Test Scenarios

**Authentication Tests:**
- User registration with valid/invalid data
- User login with correct/incorrect credentials
- Admin login flow
- Google OAuth initiation and callback
- Password reset flow
- Session management (logout, token expiration)

**Hotel Booking Tests:**
- List hotels with pagination
- Filter hotels by location
- View hotel details
- Create booking with valid data
- Create booking with invalid dates
- Calculate price correctly (nights × price_per_night)
- Booking code generation uniqueness

**Car Rental Tests:**
- List cars with filters
- View car details
- Create car booking
- Validate rental dates

**Payment Tests:**
- Create checkout session
- Handle successful payment webhook
- Handle failed payment webhook
- Handle expired session
- Multi-currency conversion
- Payment history retrieval

**Admin Tests:**
- Admin authentication
- CRUD operations for hotels
- CRUD operations for cars
- Update booking status
- View payment statistics
- Manage partners

### 7.2 Test Data

**Mock Users:**
- Admin: `admin@gotjourneythailand.com` / `admin123`
- User: `user@example.com` / `user123`
- Partner: `hotel@example.com` / `user123`

**Mock Data IDs:**
- Hotel: `mock-hotel-1`
- Room Type: `mock-room-type-1`
- Car: `mock-car-1`

**Test Environment:**
- Backend URL: `http://localhost:3001`
- Frontend URL: `http://localhost:3000`
- Mock Mode: Enabled for testing without database

---

## 8. Performance Requirements

### 8.1 Response Times
- API endpoints: < 2 seconds (p95)
- Database queries: < 500ms
- Payment processing: < 5 seconds (Stripe)
- Page load: < 3 seconds (First Contentful Paint)

### 8.2 Scalability
- Support 1000+ concurrent users
- Handle 10,000+ bookings per day
- Database connection pooling
- CDN for static assets (Vercel)

### 8.3 Caching
- Hotel/Car listings cached (5 minutes)
- Exchange rates cached (1 hour)
- Static assets cached (1 year)

---

## 9. Integration Points

### 9.1 External Services

**Stripe:**
- Payment processing
- Webhook handling
- Stripe Connect (for partners)

**Google OAuth:**
- User authentication
- Profile information retrieval

**Resend:**
- Email notifications
- Booking confirmations
- Password reset emails

**Supabase:**
- PostgreSQL database
- Real-time subscriptions (optional)
- Storage for images

### 9.2 API Integrations

**Stripe API:**
- Create Checkout Session
- Retrieve Payment Intent
- Handle Webhooks
- Stripe Connect onboarding

**Google OAuth API:**
- Authorization endpoint
- Token exchange
- User info retrieval

---

## 10. Deployment & Environment

### 10.1 Environment Variables

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

**Optional:**
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### 10.2 Deployment Configuration

**Development:**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Mock Mode: Enabled

**Production:**
- Frontend: `https://www.gotjourneythailand.com`
- Backend: `https://api.gotjourneythailand.com`
- Mock Mode: Disabled
- Database: Production Supabase instance

---

## 11. Future Enhancements

### 11.1 Planned Features
- Real-time booking availability calendar
- Advanced search filters (price range, amenities)
- User reviews and ratings
- Wishlist functionality
- Mobile app (React Native)
- SMS notifications
- Multi-language expansion (Chinese, Japanese)

### 11.2 Technical Improvements
- GraphQL API (optional)
- Redis caching layer
- Elasticsearch for search
- Microservices architecture (if scaling)
- Automated testing suite expansion

---

## 12. Support & Maintenance

### 12.1 Monitoring
- Error tracking (Sentry or similar)
- Performance monitoring
- Payment failure alerts
- Database backup automation

### 12.2 Documentation
- API documentation (OpenAPI/Swagger)
- User guides
- Admin documentation
- Developer setup guides

---

## Appendix A: API Endpoint Summary

### Public Endpoints
- `GET /api/hotels` - List hotels
- `GET /api/hotels/[id]` - Hotel details
- `GET /api/cars` - List cars
- `GET /api/cars/[id]` - Car details
- `GET /api/bookings/[code]` - Get booking by code
- `GET /api/bookings/[code]/invoice` - Download invoice
- `POST /api/contact` - Submit contact form

### Authentication Endpoints
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user/admin
- `GET /api/auth/signin/google` - Google OAuth
- `GET /api/auth/callback/google` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Request reset
- `POST /api/auth/reset-password` - Reset password

### Booking Endpoints
- `POST /api/bookings` - Create booking (authenticated)
- `GET /api/bookings` - List bookings (admin)
- `GET /api/user/bookings` - User's bookings

### Payment Endpoints
- `POST /api/checkout` - Create checkout session
- `POST /api/webhook/stripe` - Stripe webhook
- `GET /api/payments` - Payment history (admin)
- `GET /api/payments/stats` - Payment stats (admin)

### Admin Endpoints
- `POST /api/admin/login` - Admin login
- `GET /api/admin/auth` - Check admin auth
- `POST /api/hotels` - Create hotel
- `PUT /api/hotels/[id]` - Update hotel
- `DELETE /api/hotels/[id]` - Delete hotel
- (Similar for cars, bookings, partners)

---

**Document Version:** 1.0.0  
**Last Updated:** December 2024  
**Maintained By:** Got Journey Thailand Development Team
