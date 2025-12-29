
# Next.js 14 Project Structure (App Router)

### `/app` (Routes & Pages)
- `layout.tsx`: Root layout with Navbar and Footer.
- `page.tsx`: Home page.
- `(frontend)/hotels/page.tsx`: Hotel listing.
- `(frontend)/hotels/[id]/page.tsx`: Hotel details.
- `(frontend)/cars/page.tsx`: Car listing.
- `(frontend)/booking/page.tsx`: Booking form.
- `(frontend)/payment/success/page.tsx`: Booking success.
- `(admin)/admin/login/page.tsx`: Login page.
- `(admin)/admin/dashboard/page.tsx`: Main dashboard.
- `(admin)/admin/hotels/page.tsx`: Hotel management.
- `(admin)/admin/bookings/page.tsx`: Booking management.

### `/api` (Backend Routes)
- `api/hotels/route.ts`: Get all hotels.
- `api/bookings/route.ts`: Create new booking & trigger Line Notify.
- `api/checkout/route.ts`: Create Stripe Checkout Session.
- `api/webhook/stripe/route.ts`: Handle payment confirmation.

### `/components` (Reusable UI)
- `ui/`: Buttons, Inputs, Cards (Tailwind + Lucide).
- `forms/`: BookingForm, SearchForm.
- `admin/`: Sidebar, StatsCard, RevenueChart (Recharts).

### `/lib` (Utilities)
- `supabase.ts`: Client/Server Supabase configuration.
- `stripe.ts`: Stripe SDK initialization.
- `utils.ts`: Date formatting, currency formatting.

### `/services` (Business Logic)
- `notification.ts`: Resend and Line Notify logic.
- `booking.ts`: Pricing calculations.
