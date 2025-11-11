import { useState, useEffect } from 'react';
import { getLiveMatches, getUpcomingMatches, getCompletedMatches, subscribeToMatches, unsubscribeFromMatches } from '../../services/matchService';
import MatchCard from '../../components/match/MatchCard';
import Badge from '../../components/common/Badge';

const Home = () => {
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [completedMatches, setCompletedMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Transform match data from database format to UI format
  const transformMatch = (match) => {
    return {
      id: match.id,
      matchNumber: match.match_number,
      status: match.status,
      team1: {
        id: match.team1?.id,
        name: match.team1?.short_name || match.team1?.name,
        logo: match.team1?.logo || '🏏',
      },
      team2: {
        id: match.team2?.id,
        name: match.team2?.short_name || match.team2?.name,
        logo: match.team2?.logo || '🏏',
      },
      innings: match.innings?.map(inning => ({
        runs: inning.total_runs,
        wickets: inning.total_wickets,
        overs: inning.total_overs,
        runRate: inning.run_rate,
      })),
      result: match.result_text ? {
        summary: `${match.winner?.name || match.winner?.short_name} ${match.result_text}`,
      } : null,
      liveScore: match.status === 'live' && match.innings?.[match.current_inning - 1] ? {
        runRate: {
          current: match.innings[match.current_inning - 1].run_rate,
        },
        overs: match.innings[match.current_inning - 1].total_overs,
      } : null,
      venue: match.venue,
      date: new Date(match.match_date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }),
      time: match.match_time ? match.match_time.substring(0, 5) : null,
    };
  };
  
  const fetchMatches = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [liveResult, upcomingResult, completedResult] = await Promise.all([
        getLiveMatches(),
        getUpcomingMatches(),
        getCompletedMatches(),
      ]);
      
      if (liveResult.error) throw new Error(liveResult.error.message);
      if (upcomingResult.error) throw new Error(upcomingResult.error.message);
      if (completedResult.error) throw new Error(completedResult.error.message);
      
      setLiveMatches((liveResult.data || []).map(transformMatch));
      setUpcomingMatches((upcomingResult.data || []).map(transformMatch));
      setCompletedMatches((completedResult.data || []).map(transformMatch).slice(0, 6)); // Show only last 6
    } catch (err) {
      setError('Failed to load matches: ' + err.message);
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchMatches();
  }, []);
  
  // Real-time subscription
  useEffect(() => {
    const subscription = subscribeToMatches((payload) => {
      console.log('📡 Match update received:', payload);
      fetchMatches(); // Refetch all matches on any change
    });
    
    return () => {
      unsubscribeFromMatches(subscription);
    };
  }, []);
  
  const totalMatches = liveMatches.length + upcomingMatches.length + completedMatches.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🏏</div>
          <p className="text-xl text-gray-600">Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-lg p-4 text-red-700">
          <p className="font-semibold">⚠️ {error}</p>
        </div>
      )}

      {/* Hero Section - Mobile Optimized */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 text-white mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">🏏 CUET T10 Cricket Tournament</h1>
            <p className="text-green-100 text-sm sm:text-base md:text-lg">Live Scores & Tournament Updates</p>
          </div>
        </div>
      </div>

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Live Matches</h2>
            <Badge variant="live">● {liveMatches.length} LIVE</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {liveMatches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Upcoming Matches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingMatches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Matches */}
      {completedMatches.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Matches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {completedMatches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalMatches === 0 && !error && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🏏</div>
          <h3 className="text-2xl font-bold text-gray-700 mb-2">No Matches Yet</h3>
          <p className="text-gray-500">Check back soon for tournament updates!</p>
        </div>
      )}
    </div>
  );
};

export default Home;

