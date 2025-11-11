import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPlayerStats } from '../../services/playerService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

const PlayerDetail = () => {
  const { playerId } = useParams();
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlayerData();
  }, [playerId]);

  const fetchPlayerData = async () => {
    setLoading(true);
    setError('');

    const { data, error: fetchError } = await getPlayerStats(playerId);

    if (fetchError) {
      setError('Failed to load player data');
      setLoading(false);
      return;
    }

    if (!data) {
      setError('Player not found');
      setLoading(false);
      return;
    }

    // Calculate aggregated stats
    const battingInnings = data.batting_innings || [];
    const bowlingInnings = data.bowling_innings || [];

    const totalRuns = battingInnings.reduce((sum, inning) => sum + (inning.runs_scored || 0), 0);
    const totalBalls = battingInnings.reduce((sum, inning) => sum + (inning.balls_faced || 0), 0);
    const totalFours = battingInnings.reduce((sum, inning) => sum + (inning.fours || 0), 0);
    const totalSixes = battingInnings.reduce((sum, inning) => sum + (inning.sixes || 0), 0);
    const dismissals = battingInnings.filter(inning => inning.is_out).length;
    const strikeRate = totalBalls > 0 ? (totalRuns / totalBalls) * 100 : 0;
    const battingAverage = dismissals > 0 ? totalRuns / dismissals : totalRuns;

    const totalWickets = bowlingInnings.reduce((sum, inning) => sum + (inning.wickets_taken || 0), 0);
    const totalBallsBowled = bowlingInnings.reduce((sum, inning) => {
      const overs = inning.overs_bowled || 0;
      return sum + (Math.floor(overs) * 6 + (overs % 1) * 10);
    }, 0);
    const totalRunsConceded = bowlingInnings.reduce((sum, inning) => sum + (inning.runs_conceded || 0), 0);
    const totalOvers = totalBallsBowled > 0 ? Math.floor(totalBallsBowled / 6) + (totalBallsBowled % 6) / 10 : 0;
    const economy = totalOvers > 0 ? totalRunsConceded / totalOvers : 0;
    const bowlingAverage = totalWickets > 0 ? totalRunsConceded / totalWickets : 0;

    // Find highest score
    const highestScore = battingInnings.length > 0 
      ? Math.max(...battingInnings.map(i => i.runs_scored || 0))
      : 0;

    // Count 50s and 100s
    const fifties = battingInnings.filter(i => i.runs_scored >= 50 && i.runs_scored < 100).length;
    const hundreds = battingInnings.filter(i => i.runs_scored >= 100).length;

    setPlayer(data);
    setStats({
      matches: battingInnings.length,
      runs: totalRuns,
      ballsPlayed: totalBalls,
      strikeRate,
      average: battingAverage,
      fours: totalFours,
      sixes: totalSixes,
      wickets: totalWickets,
      overs: totalOvers,
      economy,
      bowlingAverage,
      highestScore,
      fifties,
      hundreds,
      dismissals
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">👤</div>
          <p className="text-xl text-gray-600">Loading player...</p>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">{error || 'Player not found'}</h2>
        <Link to="/players" className="text-green-600 hover:text-green-700 font-semibold">
          ← Back to Players
        </Link>
      </div>
    );
  }

  const getRoleBadge = (role) => {
    const variants = {
      'Batsman': 'success',
      'Bowler': 'info',
      'All-Rounder': 'warning',
      'Wicket-Keeper': 'danger'
    };
    return <Badge variant={variants[role] || 'default'} size="lg">{role}</Badge>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link to="/" className="hover:text-green-600">Home</Link>
          <span>/</span>
          <Link to="/players" className="hover:text-green-600">Players</Link>
          <span>/</span>
          <span className="text-gray-800 font-semibold">{player.name}</span>
        </nav>
      </div>

      {/* Player Header */}
      <Card className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
          <div className="flex-grow">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">{player.name}</h1>
            {player.team && (
              <Link to={`/teams/${player.team_id}`} className="flex items-center space-x-2 text-gray-600 hover:text-green-600">
                <span className="text-xl sm:text-2xl">{player.team.logo || '🏏'}</span>
                <span className="text-base sm:text-lg">{player.team.name}</span>
              </Link>
            )}
            {player.jersey_number && (
              <p className="text-sm text-gray-500 mt-1">Jersey #{player.jersey_number}</p>
            )}
          </div>
          {getRoleBadge(player.role)}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.matches || 0}</p>
            <p className="text-xs sm:text-sm text-gray-600">Matches</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.runs || 0}</p>
            <p className="text-xs sm:text-sm text-gray-600">Runs</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
            <p className="text-2xl sm:text-3xl font-bold text-red-600">{stats.wickets || 0}</p>
            <p className="text-xs sm:text-sm text-gray-600">Wickets</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
            <p className="text-2xl sm:text-3xl font-bold text-green-600">
              {(stats.fours || 0) + (stats.sixes || 0)}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">Boundaries</p>
          </div>
        </div>
      </Card>

      {/* Batting Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">🏏 Batting Stats</h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-sm sm:text-base text-gray-600">Total Runs</span>
              <span className="font-bold text-lg sm:text-xl text-blue-600">{stats.runs || 0}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-sm sm:text-base text-gray-600">Balls Played</span>
              <span className="font-bold text-lg sm:text-xl">{stats.ballsPlayed || 0}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-sm sm:text-base text-gray-600">Strike Rate</span>
              <span className="font-bold text-lg sm:text-xl text-purple-600">
                {stats.strikeRate ? stats.strikeRate.toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-sm sm:text-base text-gray-600">Average</span>
              <span className="font-bold text-lg sm:text-xl text-green-600">
                {stats.average ? stats.average.toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-sm sm:text-base text-gray-600">Fours</span>
              <span className="font-bold text-lg sm:text-xl">{stats.fours || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm sm:text-base text-gray-600">Sixes</span>
              <span className="font-bold text-lg sm:text-xl">{stats.sixes || 0}</span>
            </div>
          </div>
        </Card>

        {/* Bowling Statistics */}
        <Card>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">🎯 Bowling Stats</h2>
          {stats.wickets > 0 || stats.overs > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-sm sm:text-base text-gray-600">Wickets</span>
                <span className="font-bold text-lg sm:text-xl text-red-600">{stats.wickets || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-sm sm:text-base text-gray-600">Overs Bowled</span>
                <span className="font-bold text-lg sm:text-xl">{stats.overs ? stats.overs.toFixed(1) : '0.0'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-sm sm:text-base text-gray-600">Economy Rate</span>
                <span className="font-bold text-lg sm:text-xl text-blue-600">
                  {stats.economy ? stats.economy.toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-gray-600">Bowling Average</span>
                <span className="font-bold text-lg sm:text-xl text-green-600">
                  {stats.wickets > 0 && stats.bowlingAverage
                    ? stats.bowlingAverage.toFixed(2)
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm sm:text-base">No bowling stats available</p>
            </div>
          )}
        </Card>
      </div>

      {/* Tournament Performance */}
      <Card>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Tournament Performance</h2>
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 sm:p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Innings</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.matches || 0}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Best Score</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">
                {stats.highestScore || 0}
                {stats.dismissals < stats.matches ? '*' : ''}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">50s / 100s</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">
                {stats.fifties || 0} / {stats.hundreds || 0}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Not Outs</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-600">
                {(stats.matches || 0) - (stats.dismissals || 0)}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PlayerDetail;

