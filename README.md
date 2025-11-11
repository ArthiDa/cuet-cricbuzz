# CUET T10 Cricket Tournament - Client Application

A modern, real-time cricket scoring application built with React, Tailwind CSS, and Supabase.

## 📱 **MOBILE-FIRST DESIGN**
This application is specifically optimized for **mobile phone usage** as admins will score matches from their phones. All interfaces feature large touch targets, responsive layouts, and mobile-optimized UX. See [MOBILE_RESPONSIVE.md](./MOBILE_RESPONSIVE.md) for detailed mobile optimizations.

## 🏏 Features

### Public Features (General Users)
- **Live Match Viewing** - Real-time score updates for ongoing matches
- **Team Information** - View all teams, their stats, and squad details
- **Points Table** - Tournament standings with NRR calculations
- **Player Stats** - Comprehensive player statistics and performance data
- **Match History** - View completed and upcoming matches

### Admin Features
- **Match Management** - Create, edit, and delete matches
- **Team Management** - Add and manage tournament teams
- **Player Management** - Create and update player profiles
- **Live Scoring** - Intuitive interface for real-time match scoring
- **Points Table Control** - Manage and update tournament standings

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the client directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📁 Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable UI components
│   │   ├── match/           # Match-specific components
│   │   ├── team/            # Team-related components
│   │   ├── player/          # Player-related components
│   │   └── admin/           # Admin-specific components
│   ├── pages/
│   │   ├── public/          # Public-facing pages
│   │   │   ├── Home.jsx
│   │   │   ├── LiveMatch.jsx
│   │   │   ├── Teams.jsx
│   │   │   ├── TeamDetail.jsx
│   │   │   ├── PointsTable.jsx
│   │   │   ├── Players.jsx
│   │   │   └── PlayerDetail.jsx
│   │   └── admin/           # Admin pages
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       ├── ManageTeams.jsx
│   │       ├── ManagePlayers.jsx
│   │       ├── ManageMatches.jsx
│   │       ├── LiveScoring.jsx
│   │       └── AdminPointsTable.jsx
│   ├── layouts/
│   │   ├── PublicLayout.jsx
│   │   └── AdminLayout.jsx
│   ├── config/
│   │   └── supabase.js      # Supabase client configuration
│   ├── data/
│   │   └── mockData.js      # Mock data for development
│   ├── utils/
│   ├── App.jsx              # Main app with routing
│   └── main.jsx             # Entry point
├── public/
├── package.json
└── README.md
```

## 🎨 Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Tailwind CSS v4** - Styling (using @tailwindcss/vite plugin)
- **Supabase** - Backend and real-time database (to be integrated)

## 🔗 Routes

### Public Routes
- `/` - Home page with live, upcoming, and recent matches
- `/match/:matchId` - Live match detail page
- `/teams` - All teams
- `/team/:teamId` - Team detail with squad
- `/points-table` - Tournament standings
- `/players` - All players with filters
- `/player/:playerId` - Individual player statistics

### Admin Routes
- `/admin/login` - Admin authentication
- `/admin` - Dashboard
- `/admin/teams` - Manage teams
- `/admin/players` - Manage players
- `/admin/matches` - Manage matches
- `/admin/matches/:matchId/score` - Live scoring interface
- `/admin/points-table` - Points table management

## 🎯 Phase 1 Status (COMPLETED ✅)

### Completed Tasks:
- ✅ Project structure and folder organization
- ✅ React Router setup with all routes
- ✅ Layout components (Public & Admin)
- ✅ Reusable UI components (Button, Card, Input, Badge, etc.)
- ✅ All public pages with static UI
- ✅ All admin pages with CRUD interfaces
- ✅ Live scoring interface UI
- ✅ Mock data for testing
- ✅ Tailwind CSS v4 configuration
- ✅ Responsive design

### Next Steps (Phase 2):
- [ ] Integrate Supabase authentication
- [ ] Connect to Supabase database
- [ ] Implement real-time subscriptions
- [ ] Ball-by-ball recording logic
- [ ] Automatic points table calculation
- [ ] Commentary system
- [ ] Match statistics computation

## 🎮 Demo Access

**Admin Panel:**
- URL: `http://localhost:5173/admin/login`
- Demo Mode: Enter any email and password to access (authentication not yet implemented)

## 📝 Tournament Configuration

- **Format:** League System → Semi-Finals → Final
- **Default Overs:** 10 overs (T10)
- **Customizable:** Overs can be adjusted per match
- **Points System:**
  - Win: 2 points
  - Loss: 0 points
  - Tie/No Result: 1 point each

## 🎨 Design Philosophy

- **Mobile-First:** Designed primarily for phone usage
- **Touch-Optimized:** Large buttons (min 48px) for easy tapping
- **Clean UI:** Inspired by Cricbuzz with modern aesthetics
- **Responsive:** Works seamlessly across all devices
- **Fast:** Optimized for quick loading on mobile networks
- **Intuitive:** Simple navigation and clear information hierarchy

### Mobile Optimizations
- ✅ Large touch targets (64px for scoring buttons)
- ✅ Horizontal scrolling for tables
- ✅ Drawer navigation for admin panel
- ✅ Responsive typography (scales with screen size)
- ✅ One-handed operation possible
- ✅ No accidental taps
- ✅ Visual feedback on all interactions

## 🛠️ Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 📦 Dependencies

### Main Dependencies
- react: ^19.1.1
- react-dom: ^19.1.1
- react-router-dom: ^7.9.5
- @supabase/supabase-js: ^2.80.0

### Dev Dependencies
- @vitejs/plugin-react: ^5.0.4
- tailwindcss: ^4.1.17
- @tailwindcss/vite: Latest
- vite: ^7.1.7

## 🤝 Contributing

This is a private tournament management system. For contributions or issues, please contact the development team.

## 📄 License

Proprietary - CUET T10 Cricket Tournament

---

Built with ❤️ for CUET Cricket Community
