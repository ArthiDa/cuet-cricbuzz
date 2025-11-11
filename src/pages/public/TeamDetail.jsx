import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { getPlayersByTeam } from '../../services/playerService';
import { getPointsTable } from '../../services/pointsTableService';
import Card from '../../components/common/Card';
import PlayerCard from '../../components/player/PlayerCard';

const TeamDetail = () => {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [teamStats, setTeamStats] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeamDetails();
  }, [teamId]);

  const fetchTeamDetails = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch team basic info
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;
      setTeam(teamData);

      // Fetch team players with stats
      const { data: playersData, error: playersError } = await getPlayersByTeam(teamId);
      if (playersError) throw playersError;
      setTeamPlayers(playersData || []);

      // Fetch team stats from points table
      const { data: pointsData, error: pointsError } = await getPointsTable();
      if (pointsError) throw pointsError;
      
      const teamStanding = pointsData?.find(t => t.team.id === teamId);
      setTeamStats(teamStanding);

      // Fetch recent matches for this team
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          *,
          team1:teams!matches_team1_id_fkey(id, name, short_name, logo),
          team2:teams!matches_team2_id_fkey(id, name, short_name, logo),
          winner:teams!matches_winner_id_fkey(id, name, short_name),
          innings(total_runs, total_wickets, batting_team_id)
        `)
        .or(`team1_id.eq.${teamId},team2_id.eq.${teamId}`)
        .eq('status', 'completed')
        .eq('archived', false)
        .order('match_date', { ascending: false })
        .limit(5);

      if (matchesError) throw matchesError;
      setRecentMatches(matchesData || []);

    } catch (err) {
      setError('Failed to load team details: ' + err.message);
      console.error('Error fetching team details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🏏</div>
          <p className="text-xl text-gray-600">Loading team details...</p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">
          {error || 'Team not found'}
        </h2>
        <Link to="/teams">
          <button className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Back to Teams
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm">
        <Link to="/teams" className="text-green-600 hover:text-green-700">Teams</Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-600">{team.name}</span>
      </div>

      {/* Team Header */}
      <Card className="mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="text-6xl sm:text-8xl">{team.logo || '🏏'}</div>
          <div className="flex-grow text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">{team.name}</h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-4">{team.short_name}</p>
            {teamStats && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full">
                <span className="font-bold">Position: #{teamStats.position}</span>
              </div>
            )}
          </div>
          {teamStats && (
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-green-600">{teamStats.points}</div>
              <div className="text-gray-500 text-sm">Points</div>
            </div>
          )}
        </div>

        {/* Team Stats */}
        {teamStats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mt-8 pt-8 border-t border-gray-200">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-gray-800">{teamStats.played}</p>
              <p className="text-xs sm:text-sm text-gray-500">Played</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{teamStats.won}</p>
              <p className="text-xs sm:text-sm text-gray-500">Won</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-red-600">{teamStats.lost}</p>
              <p className="text-xs sm:text-sm text-gray-500">Lost</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">{teamStats.nrr}</p>
              <p className="text-xs sm:text-sm text-gray-500">NRR</p>
            </div>
          </div>
        ) : (
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-500">
            <p>No tournament stats available yet</p>
          </div>
        )}
      </Card>

      {/* Recent Matches */}
      {recentMatches.length > 0 && (
        <Card className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Recent Matches</h2>
          <div className="space-y-3">
            {recentMatches.map(match => {
              const isTeam1 = match.team1?.id === teamId;
              const opponent = isTeam1 ? match.team2 : match.team1;
              const isWinner = match.winner_id === teamId;
              
              return (
                <Link key={match.id} to={`/match/${match.id}`}>
                  <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-2">
                          Match {match.match_number} • {match.venue}
                        </p>
                        <p className="font-semibold text-gray-800">
                          vs {opponent?.logo || '🏏'} {opponent?.name}
                        </p>
                      </div>
                      <div className={`text-sm font-bold px-3 py-1 rounded-full ${
                        isWinner ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {isWinner ? 'Won' : 'Lost'}
                      </div>
                    </div>
                    {match.result_text && (
                      <p className="text-xs text-gray-600 mt-2">{match.result_text}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {/* Team Squad */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
          Team Squad ({teamPlayers.length} players)
        </h2>
        {teamPlayers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamPlayers.map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <div className="text-5xl mb-4">👥</div>
              <p className="text-gray-500 text-lg">No players added yet</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TeamDetail;

