import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllMatches, getLiveMatches, getUpcomingMatches, getCompletedMatches, subscribeToMatches, unsubscribeFromMatches } from '../../services/matchService';
import { getAllTeams } from '../../services/teamService';
import { getAllPlayers } from '../../services/playerService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

const Dashboard = () => {
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [completedMatches, setCompletedMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [liveResult, upcomingResult, completedResult, teamsResult, playersResult] = await Promise.all([
        getLiveMatches(),
        getUpcomingMatches(),
        getCompletedMatches(),
        getAllTeams(),
        getAllPlayers(),
      ]);
      
      if (liveResult.error) throw liveResult.error;
      if (upcomingResult.error) throw upcomingResult.error;
      if (completedResult.error) throw completedResult.error;
      if (teamsResult.error) throw teamsResult.error;
      if (playersResult.error) throw playersResult.error;
      
      setLiveMatches(liveResult.data || []);
      setUpcomingMatches((upcomingResult.data || []).slice(0, 5)); // Show only next 5
      setCompletedMatches(completedResult.data || []);
      setTeams(teamsResult.data || []);
      setPlayers(playersResult.data || []);
    } catch (err) {
      setError('Failed to load dashboard data: ' + err.message);
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  // Real-time subscription for matches
  useEffect(() => {
    const subscription = subscribeToMatches((payload) => {
      console.log('📡 Dashboard: Match update received:', payload);
      fetchDashboardData(); // Refetch all data
    });
    
    return () => {
      unsubscribeFromMatches(subscription);
    };
  }, []);
  
  const totalMatches = liveMatches.length + upcomingMatches.length + completedMatches.length;

  const stats = [
    { label: 'Total Teams', value: teams.length, icon: '👥', color: 'blue' },
    { label: 'Total Players', value: players.length, icon: '🎯', color: 'green' },
    { label: 'Total Matches', value: totalMatches, icon: '🏏', color: 'purple' },
    { label: 'Live Now', value: liveMatches.length, icon: '🔴', color: 'red' }
  ];
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📊</div>
          <p className="text-xl text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to CUET T10 Admin Panel</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-lg p-4 text-red-700">
          <p className="font-semibold">⚠️ {error}</p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
              </div>
              <div className="text-4xl">{stat.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions - Mobile Optimized */}
      <Card className="mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link to="/admin/matches/create" className="block">
            <Button className="w-full h-12 sm:h-auto text-sm sm:text-base" variant="primary">
              🏏 New Match
            </Button>
          </Link>
          <Link to="/admin/teams/create" className="block">
            <Button className="w-full h-12 sm:h-auto text-sm sm:text-base" variant="secondary">
              👥 Add Team
            </Button>
          </Link>
          <Link to="/admin/players/create" className="block">
            <Button className="w-full h-12 sm:h-auto text-sm sm:text-base" variant="secondary">
              🎯 Add Player
            </Button>
          </Link>
          <Link to="/admin/points-table" className="block">
            <Button className="w-full h-12 sm:h-auto text-sm sm:text-base" variant="secondary">
              📈 Points Table
            </Button>
          </Link>
        </div>
      </Card>

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Live Matches</h2>
            <Badge variant="live">● {liveMatches.length} LIVE</Badge>
          </div>
          <div className="space-y-4">
            {liveMatches.map(match => {
              const currentInning = match.innings?.find(i => i.inning_number === match.current_inning);
              return (
                <div key={match.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <div className="flex-grow">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold">Match {match.match_number}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-600">{match.venue}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">
                            {match.team1?.logo || '🏏'} {match.team1?.name}
                          </p>
                          {match.innings?.[0] && (
                            <span className="text-sm font-bold">
                              {match.innings[0].total_runs}/{match.innings[0].total_wickets} ({match.innings[0].total_overs})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">
                            {match.team2?.logo || '🏏'} {match.team2?.name}
                          </p>
                          {match.innings?.[1] && (
                            <span className="text-sm font-bold">
                              {match.innings[1].total_runs}/{match.innings[1].total_wickets} ({match.innings[1].total_overs})
                            </span>
                          )}
                        </div>
                        {currentInning && (
                          <p className="text-xs text-gray-500 mt-2">
                            Inning {match.current_inning} • Run Rate: {currentInning.run_rate?.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Link to={`/admin/matches/${match.id}/score`}>
                      <Button variant="primary" size="sm">
                        Score Match
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Recent Completed Matches */}
      {completedMatches.length > 0 && (
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Recent Completed Matches</h2>
            <Badge variant="success">{completedMatches.length} Completed</Badge>
          </div>
          <div className="space-y-3">
            {completedMatches.slice(0, 3).map(match => (
              <div key={match.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">Match {match.match_number}</span>
                  <span className="text-xs text-gray-500">{match.venue}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>{match.team1?.logo || '🏏'} {match.team1?.short_name || match.team1?.name}</span>
                    <span className="font-bold">
                      {match.innings?.[0]?.total_runs || 0}/{match.innings?.[0]?.total_wickets || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{match.team2?.logo || '🏏'} {match.team2?.short_name || match.team2?.name}</span>
                    <span className="font-bold">
                      {match.innings?.[1]?.total_runs || 0}/{match.innings?.[1]?.total_wickets || 0}
                    </span>
                  </div>
                </div>
                {match.result_text && (
                  <p className="text-xs text-green-700 font-semibold mt-2 pt-2 border-t border-gray-200">
                    {match.winner?.short_name || match.winner?.name} {match.result_text}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Upcoming Matches</h2>
            <Link to="/admin/matches">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingMatches.map(match => {
              const matchDate = new Date(match.match_date);
              const formattedDate = matchDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              });
              const formattedTime = match.match_time ? match.match_time.substring(0, 5) : 'TBD';
              
              return (
                <div key={match.id} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-0">
                  <div>
                    <p className="font-semibold">Match {match.match_number}</p>
                    <p className="text-sm text-gray-600">
                      {match.team1?.logo || '🏏'} {match.team1?.name} vs {match.team2?.logo || '🏏'} {match.team2?.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formattedDate} at {formattedTime} • {match.venue}
                    </p>
                  </div>
                  <Link to="/admin/matches">
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </Card>
      )}
      
      {/* Empty State */}
      {liveMatches.length === 0 && upcomingMatches.length === 0 && completedMatches.length === 0 && (
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">🏏</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No Matches Yet</h3>
          <p className="text-gray-500 mb-6">Get started by creating your first match!</p>
          <Link to="/admin/matches">
            <Button variant="primary">
              Create Match
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;

