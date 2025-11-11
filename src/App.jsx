import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth
import ProtectedRoute from './components/auth/ProtectedRoute';

// Error Boundary
import ErrorBoundary from './components/common/ErrorBoundary';

// Public Pages
import Home from './pages/public/Home';
import LiveMatch from './pages/public/LiveMatch';
import Teams from './pages/public/Teams';
import TeamDetail from './pages/public/TeamDetail';
import PointsTable from './pages/public/PointsTable';
import Players from './pages/public/Players';
import PlayerDetail from './pages/public/PlayerDetail';

// Admin Pages
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import ManageTeams from './pages/admin/ManageTeams';
import ManagePlayers from './pages/admin/ManagePlayers';
import ManageMatches from './pages/admin/ManageMatches';
import LiveScoring from './pages/admin/LiveScoring';
import AdminPointsTable from './pages/admin/AdminPointsTable';

function App() {
  return (
    <ErrorBoundary>
      <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="match/:matchId" element={<LiveMatch />} />
          <Route path="teams" element={<Teams />} />
          <Route path="teams/:teamId" element={<TeamDetail />} />
          <Route path="points-table" element={<PointsTable />} />
          <Route path="players" element={<Players />} />
          <Route path="players/:playerId" element={<PlayerDetail />} />
        </Route>

        {/* Admin Login (No Layout, No Protection) */}
        <Route path="/admin/login" element={<Login />} />

        {/* Protected Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="teams" element={<ManageTeams />} />
          <Route path="teams/create" element={<ManageTeams />} />
          <Route path="players" element={<ManagePlayers />} />
          <Route path="players/create" element={<ManagePlayers />} />
          <Route path="matches" element={<ManageMatches />} />
          <Route path="matches/create" element={<ManageMatches />} />
          <Route path="matches/:matchId/score" element={<LiveScoring />} />
          <Route path="matches/:matchId/edit" element={<ManageMatches />} />
          <Route path="points-table" element={<AdminPointsTable />} />
        </Route>
      </Routes>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
