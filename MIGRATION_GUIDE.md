# Next.js Migration Guide

## Completed

1. ✅ Updated `package.json` with Next.js dependencies
2. ✅ Created `next.config.js` and `jsconfig.json`
3. ✅ Updated Tailwind config for Next.js
4. ✅ Created app directory structure
5. ✅ Converted root layout (`app/layout.jsx`)
6. ✅ Updated Supabase client to use `NEXT_PUBLIC_` env vars
7. ✅ Converted AuthContext to client component
8. ✅ Updated components (Navbar, BottomNav, MatchModal, ProtectedRoute)
9. ✅ Converted pages:
   - ✅ Landing (`app/page.jsx`)
   - ✅ Login (`app/login/page.jsx`)
   - ✅ SignUp (`app/signup/page.jsx`)
   - ✅ AuthCallback (`app/auth/callback/page.jsx`)
   - ✅ Discover (`app/discover/page.jsx`)

## Remaining Pages to Convert

All pages in `src/pages/` need to be converted to Next.js app router format. Here's the conversion pattern:

### Conversion Steps for Each Page:

1. **Add 'use client' directive** at the top
2. **Replace imports:**
   - `import { useNavigate } from 'react-router-dom'` → `import { useRouter } from 'next/navigation'`
   - `import { useParams } from 'react-router-dom'` → `import { useParams } from 'next/navigation'` (Note: Next.js params are different)
   - `import { Link } from 'react-router-dom'` → `import Link from 'next/link'`
   - Update relative imports to use `@/` alias (e.g., `'../context/AuthContext'` → `'@/src/context/AuthContext'`)
3. **Replace navigation:**
   - `const navigate = useNavigate()` → `const router = useRouter()`
   - `navigate('/path')` → `router.push('/path')`
   - `navigate(-1)` → `router.back()`
4. **Replace Link components:**
   - `<Link to="/path">` → `<Link href="/path">`
5. **For dynamic routes:**
   - `useParams()` in Next.js returns params directly (no `.matchId`, just access `params.matchId`)
   - For `chat/[matchId]`, create `app/chat/[matchId]/page.jsx`
6. **Wrap with ProtectedRoute** where needed

### Page Route Mapping:

- `Onboarding.jsx` → `app/onboarding/page.jsx`
- `Matches.jsx` → `app/matches/page.jsx`
- `Chat.jsx` → `app/chat/[matchId]/page.jsx`
- `Profile.jsx` → `app/profile/page.jsx`
- `Settings.jsx` → `app/settings/page.jsx`
- `Premium.jsx` → `app/premium/page.jsx`
- `BasicInfo.jsx` → `app/settings/basic-info/page.jsx`
- `Privacy.jsx` → `app/settings/privacy/page.jsx`
- `Account.jsx` → `app/settings/account/page.jsx`
- `Notifications.jsx` → `app/settings/notifications/page.jsx`
- `HelpCenter.jsx` → `app/settings/help/page.jsx`
- `Feedback.jsx` → `app/settings/feedback/page.jsx`
- `BlockedUsers.jsx` → `app/settings/blocked/page.jsx`
- `InvisibleMode.jsx` → `app/settings/invisible-mode/page.jsx`
- `Verifications.jsx` → `app/settings/verifications/page.jsx`
- `PaymentSettings.jsx` → `app/settings/payment/page.jsx`
- `InterfaceLanguage.jsx` → `app/settings/interface-language/page.jsx`
- `ControlExperience.jsx` → `app/settings/control-experience/page.jsx`
- `About.jsx` → `app/settings/about/page.jsx`
- `ProfileEdit.jsx` → `app/profile/edit/page.jsx`
- `MoreAboutYou.jsx` → `app/profile/edit/more-about/page.jsx`
- `WhyYoureHere.jsx` → `app/profile/edit/why-here/page.jsx`
- `ProfileQuestions.jsx` → `app/profile/edit/questions/page.jsx`
- `AboutMe.jsx` → `app/profile/edit/about-me/page.jsx`

## Environment Variables

Update your `.env` file:
- `VITE_SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Next Steps

1. Convert all remaining pages using the pattern above
2. Update any remaining components that use react-router-dom
3. Remove old Vite files:
   - `vite.config.js`
   - `index.html`
   - `src/main.jsx`
   - `src/App.jsx`
4. Test all routes
5. Update any remaining imports

## Running the App

```bash
npm install
npm run dev
```

The app will run on `http://localhost:3000` (Next.js default port).

