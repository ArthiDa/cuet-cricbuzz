import { useState, useEffect } from 'react';
import { getPlayersWithStats, getTopRunScorers, getTopWicketTakers, subscribeToPlayerStats, unsubscribeFromPlayerStats } from '../../services/playerStatsService';
import PlayerCard from '../../components/player/PlayerCard';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const Players = () => {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [players, setPlayers] = useState([]);
  const [topBatsmen, setTopBatsmen] = useState([]);
  const [topBowlers, setTopBowlers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const fetchPlayerStats = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [playersResult, batsmenResult, bowlersResult] = await Promise.all([
        getPlayersWithStats(),
        getTopRunScorers(5),
        getTopWicketTakers(5),
      ]);
      
      if (playersResult.error) throw playersResult.error;
      if (batsmenResult.error) throw batsmenResult.error;
      if (bowlersResult.error) throw bowlersResult.error;
      
      setPlayers(playersResult.data || []);
      setTopBatsmen(batsmenResult.data || []);
      setTopBowlers(bowlersResult.data || []);
    } catch (err) {
      setError('Failed to load player stats: ' + err.message);
      console.error('Error fetching player stats:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchPlayerStats();
  }, []);
  
  // Real-time subscription
  useEffect(() => {
    const subscription = subscribeToPlayerStats((payload) => {
      console.log('📡 Player stats update received:', payload);
      fetchPlayerStats();
    });
    
    return () => {
      unsubscribeFromPlayerStats(subscription);
    };
  }, []);

  // Apply all filters
  const filteredPlayers = players.filter(player => {
    // Role filter
    const roleMatch = filter === 'all' || player.role?.toLowerCase() === filter.toLowerCase();
    
    // Search filter (name)
    const searchMatch = searchQuery === '' || 
      player.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Team filter
    const teamMatch = teamFilter === 'all' || 
      player.team?.id === teamFilter;
    
    return roleMatch && searchMatch && teamMatch;
  });

  // Get unique teams for filter dropdown
  const uniqueTeams = Array.from(new Map(
    players
      .filter(p => p.team)
      .map(p => [p.team.id, p.team])
  ).values());

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">👤</div>
          <p className="text-xl text-gray-600">Loading player stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Players</h1>
        <p className="text-gray-600">Tournament player statistics and profiles</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-lg p-4 text-red-700">
          <p className="font-semibold">⚠️ {error}</p>
        </div>
      )}

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Top Batsmen */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🏏 Top Run Scorers</h2>
          <div className="space-y-3">
            {topBatsmen.length > 0 ? (
              topBatsmen.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-lg text-gray-500 w-6">{index + 1}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{player.name}</p>
                      <p className="text-xs text-gray-500">{player.team?.shortName || player.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600">{player.runs}</p>
                    <p className="text-xs text-gray-500">runs @ {player.average}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg p-4 text-center text-gray-500">
                No batting stats yet
              </div>
            )}
          </div>
        </div>

        {/* Top Bowlers */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🎯 Top Wicket Takers</h2>
          <div className="space-y-3">
            {topBowlers.length > 0 ? (
              topBowlers.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-lg text-gray-500 w-6">{index + 1}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{player.name}</p>
                      <p className="text-xs text-gray-500">{player.team?.shortName || player.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-red-600">{player.wickets}</p>
                    <p className="text-xs text-gray-500">wkts @ {player.economy}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg p-4 text-center text-gray-500">
                No bowling stats yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="max-w-md">
          <Input
            type="text"
            placeholder="🔍 Search players by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Role Filter */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Filter by Role
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={filter === 'all' ? 'primary' : 'outline'}
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={filter === 'Batsman' ? 'primary' : 'outline'}
                onClick={() => setFilter('Batsman')}
              >
                Batsmen
              </Button>
              <Button
                size="sm"
                variant={filter === 'Bowler' ? 'primary' : 'outline'}
                onClick={() => setFilter('Bowler')}
              >
                Bowlers
              </Button>
              <Button
                size="sm"
                variant={filter === 'All-Rounder' ? 'primary' : 'outline'}
                onClick={() => setFilter('All-Rounder')}
              >
                All-Rounders
              </Button>
            </div>
          </div>

          {/* Team Filter */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Filter by Team
            </label>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="all">All Teams</option>
              {uniqueTeams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.logo} {team.shortName || team.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          Showing {filteredPlayers.length} of {players.length} players
          {(searchQuery || filter !== 'all' || teamFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilter('all');
                setTeamFilter('all');
              }}
              className="ml-2 text-green-600 hover:text-green-700 font-semibold"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlayers.map(player => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No players found in this category</p>
        </div>
      )}
    </div>
  );
};

export default Players;

