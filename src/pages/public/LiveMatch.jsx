import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCurrentInnings, subscribeToInnings } from '../../services/scoringService';
import { supabase } from '../../config/supabase';
import ScoreDisplay from '../../components/match/ScoreDisplay';
import BatsmanCard from '../../components/match/BatsmanCard';
import BowlerCard from '../../components/match/BowlerCard';
import RecentBalls from '../../components/match/RecentBalls';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

const LiveMatch = () => {
  const { matchId } = useParams();
  const [activeTab, setActiveTab] = useState('live');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Match data
  const [matchData, setMatchData] = useState(null);
  const [innings, setInnings] = useState(null);
  const [batsmen, setBatsmen] = useState([]);
  const [bowler, setBowler] = useState(null);
  const [partnership, setPartnership] = useState(null);
  const [recentBalls, setRecentBalls] = useState([]);
  
  // Fetch match data
  const fetchMatchData = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      setError('');
      
      // Get current innings data
      const { data, error: inningsError } = await getCurrentInnings(matchId);
      
      if (inningsError) {
        setError('Failed to load match: ' + inningsError.message);
        if (isInitialLoad) setLoading(false);
        return;
      }
      
      if (!data || !data.innings) {
        setError('No active innings found for this match');
        if (isInitialLoad) setLoading(false);
        return;
      }
      
      setMatchData(data.match);
      setInnings(data.innings);
      
      // Map batsmen data to flatten player info
      const mappedBatsmen = (data.batsmen || []).map(b => ({
        ...b,
        name: b.player?.name || 'Unknown',
        player_id: b.player_id
      }));
      setBatsmen(mappedBatsmen);
      
      // Map bowler data to flatten player info
      if (data.bowler) {
        setBowler({
          ...data.bowler,
          name: data.bowler.player?.name || 'Unknown'
        });
      } else {
        setBowler(null);
      }
      
      setPartnership(data.partnership);
      setRecentBalls(data.recentBalls || []);
      if (isInitialLoad) setLoading(false);
    } catch (err) {
      console.error('Error fetching match:', err);
      setError('Failed to load match data');
      if (isInitialLoad) setLoading(false);
    }
  };
  
  // Initial load
  useEffect(() => {
    fetchMatchData(true);
  }, [matchId]);
  
  // Real-time subscription
  useEffect(() => {
    if (!matchId) return;
    
    console.log('🔴 Setting up real-time subscription for match:', matchId, 'innings:', innings?.id);
    
    // Subscribe to changes in multiple tables
    const channel = supabase
      .channel(`public-match-${matchId}-${innings?.id || 'init'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`
        },
        (payload) => {
          console.log('📡 Match changed (new innings?):', payload);
          fetchMatchData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'innings',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          console.log('📡 Innings changed/created:', payload);
          fetchMatchData();
        }
      );
    
    // Only subscribe to innings-specific tables if we have an innings ID
    if (innings?.id) {
      channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'balls',
            filter: `innings_id=eq.${innings.id}`
          },
          (payload) => {
            console.log('📡 Ball recorded:', payload);
            fetchMatchData();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'batting_innings',
            filter: `innings_id=eq.${innings.id}`
          },
          (payload) => {
            console.log('📡 Batsman stats updated:', payload);
            fetchMatchData();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bowling_innings',
            filter: `innings_id=eq.${innings.id}`
          },
          (payload) => {
            console.log('📡 Bowler stats updated:', payload);
            fetchMatchData();
          }
        );
    }
    
    channel.subscribe();
    
    return () => {
      console.log('🔴 Unsubscribing from real-time updates');
      channel.unsubscribe();
    };
  }, [innings?.id, matchId]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading match...</div>
      </div>
    );
  }
  
  if (error || !matchData || !innings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-2">{error || 'Match not found'}</p>
          <a href="/" className="text-green-600 hover:underline">← Back to Home</a>
        </div>
      </div>
    );
  }
  
  // Get active batsmen (not out)
  const activeBatsmen = batsmen.filter(b => !b.is_out);
  const striker = activeBatsmen.find(b => b.is_on_strike);
  const nonStriker = activeBatsmen.find(b => !b.is_on_strike);

  const tabs = [
    { id: 'live', label: 'Live Score' },
    { id: 'scorecard', label: 'Scorecard' },
    { id: 'commentary', label: 'Commentary' },
    { id: 'info', label: 'Info' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Match Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {matchData.team1?.name} vs {matchData.team2?.name}
          </h1>
          {matchData.status === 'live' && (
            <Badge variant="live">● LIVE</Badge>
          )}
        </div>
        <p className="text-sm sm:text-base text-gray-600">
          📍 {matchData.venue} • Match {matchData.match_number}
        </p>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          {innings.inning_number === 1 ? '1st Innings' : '2nd Innings'}
        </p>
      </div>

      {/* Score Display - Simplified inline version */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              {innings.batting_team_id === matchData.team1_id ? matchData.team1?.name : matchData.team2?.name}
            </h2>
            <p className="text-3xl sm:text-4xl font-bold text-green-600 mt-2">
              {innings.total_runs}/{innings.total_wickets}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {innings.total_overs} overs • Run Rate: {innings.run_rate.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Target</p>
            <p className="text-xl font-bold text-gray-700">
              {innings.inning_number === 2 && matchData.innings?.[0] 
                ? (matchData.innings[0].total_runs + 1)
                : '-'}
            </p>
            {innings.required_run_rate && (
              <p className="text-xs text-gray-500 mt-1">
                RRR: {innings.required_run_rate.toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs - Mobile Optimized with Horizontal Scroll */}
      <div className="flex space-x-2 mb-6 border-b border-gray-200 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 sm:px-6 py-2 sm:py-3 font-semibold transition-colors border-b-2
              whitespace-nowrap text-sm sm:text-base flex-shrink-0
              ${activeTab === tab.id 
                ? 'border-green-600 text-green-600' 
                : 'border-transparent text-gray-600 hover:text-gray-800'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          {/* Current Batsmen */}
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Current Batsmen</h3>
            {activeBatsmen.length === 0 ? (
              <Card>
                <p className="text-center text-gray-500">No active batsmen</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {striker && (
                  <Card>
                    <div className="flex items-center justify-between">
                      <div className="flex-grow">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600 font-bold">★</span>
                          <span className="font-bold text-gray-800">{striker.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Striker</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-800">{striker.runs_scored}</p>
                        <p className="text-xs text-gray-500">
                          {striker.balls_faced}b • {striker.fours}×4 • {striker.sixes}×6 • SR: {striker.strike_rate.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
                {nonStriker && (
                  <Card>
                    <div className="flex items-center justify-between">
                      <div className="flex-grow">
                        <span className="font-bold text-gray-800">{nonStriker.name}</span>
                        <p className="text-xs text-gray-500 mt-1">Non-Striker</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-800">{nonStriker.runs_scored}</p>
                        <p className="text-xs text-gray-500">
                          {nonStriker.balls_faced}b • {nonStriker.fours}×4 • {nonStriker.sixes}×6 • SR: {nonStriker.strike_rate.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Current Bowler */}
          {bowler && (
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Current Bowler</h3>
              <Card>
                <div className="flex items-center justify-between">
                  <div className="flex-grow">
                    <div className="flex items-center space-x-2">
                      <span className="text-red-600 font-bold">●</span>
                      <span className="font-bold text-gray-800">{bowler.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-800">
                      {bowler.overs_bowled}-{bowler.runs_conceded}-{bowler.wickets_taken}
                    </p>
                    <p className="text-xs text-gray-500">
                      O-R-W • Eco: {bowler.economy_rate.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Partnership */}
          {partnership && (
            <Card>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-gray-700">Partnership</h4>
                  <p className="text-sm text-gray-500">Current Stand</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {partnership.runs_scored}
                  </p>
                  <p className="text-sm text-gray-500">
                    {partnership.balls_faced} balls
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Recent Balls */}
          {recentBalls.length > 0 && (
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Last 6 Balls</h3>
              <Card>
                <div className="flex space-x-2 overflow-x-auto">
                  {recentBalls.slice(0, 6).reverse().map((ball, index) => {
                    let ballColor = 'bg-gray-300 text-gray-700';
                    const display = ball.is_wicket ? 'W' : (ball.runs_scored + ball.extras).toString();
                    
                    if (ball.is_wicket) ballColor = 'bg-red-500 text-white';
                    else if (ball.runs_scored === 4) ballColor = 'bg-blue-500 text-white';
                    else if (ball.runs_scored === 6) ballColor = 'bg-purple-500 text-white';
                    else if (ball.runs_scored + ball.extras > 0) ballColor = 'bg-green-500 text-white';

                    return (
                      <div
                        key={ball.id || index}
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${ballColor}`}
                      >
                        {display === '0' ? '•' : display}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {activeTab === 'scorecard' && (
        <Card>
          <h3 className="text-xl font-bold mb-4">Full Scorecard</h3>
          
          {/* Batting Scorecard */}
          <div className="mb-6">
            <h4 className="font-bold text-gray-700 mb-3">Batting</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2">Batsman</th>
                    <th className="text-right py-2">R</th>
                    <th className="text-right py-2">B</th>
                    <th className="text-right py-2">4s</th>
                    <th className="text-right py-2">6s</th>
                    <th className="text-right py-2">SR</th>
                  </tr>
                </thead>
                <tbody>
                  {batsmen.map((batsman) => (
                    <tr key={batsman.player_id} className="border-b border-gray-200">
                      <td className="py-2">
                        <span className="font-semibold">{batsman.name}</span>
                        {batsman.is_out && batsman.dismissal_type && (
                          <span className="text-xs text-gray-500 block">
                            {batsman.dismissal_type}
                          </span>
                        )}
                        {!batsman.is_out && batsman.is_on_strike && (
                          <span className="text-xs text-green-600 block">batting</span>
                        )}
                      </td>
                      <td className="text-right font-bold">{batsman.runs_scored}</td>
                      <td className="text-right">{batsman.balls_faced}</td>
                      <td className="text-right">{batsman.fours}</td>
                      <td className="text-right">{batsman.sixes}</td>
                      <td className="text-right">{batsman.strike_rate.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Extras */}
          <div className="mb-6">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Extras:</span> {innings.extras} 
              (wd {innings.wides}, nb {innings.no_balls}, b {innings.byes}, lb {innings.leg_byes})
            </p>
            <p className="text-sm text-gray-700 mt-1">
              <span className="font-semibold">Total:</span> {innings.total_runs}/{innings.total_wickets} 
              ({innings.total_overs} overs)
            </p>
          </div>

          {/* Bowling Figures */}
          <div>
            <h4 className="font-bold text-gray-700 mb-3">Bowling</h4>
            {bowler ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-2">Bowler</th>
                      <th className="text-right py-2">O</th>
                      <th className="text-right py-2">M</th>
                      <th className="text-right py-2">R</th>
                      <th className="text-right py-2">W</th>
                      <th className="text-right py-2">Eco</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-2 font-semibold">{bowler.name}</td>
                      <td className="text-right">{bowler.overs_bowled}</td>
                      <td className="text-right">0</td>
                      <td className="text-right">{bowler.runs_conceded}</td>
                      <td className="text-right font-bold">{bowler.wickets_taken}</td>
                      <td className="text-right">{bowler.economy_rate.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Bowling figures will appear here...</p>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'commentary' && (
        <div className="space-y-3">
          <h3 className="text-xl font-bold mb-4">Ball-by-Ball Commentary</h3>
          {recentBalls.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500">No balls bowled yet</p>
            </Card>
          ) : (
            recentBalls.map((ball, index) => (
              <Card key={ball.id || index}>
                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    <span className="font-bold text-green-600">
                      {ball.over_number}.{ball.ball_number}
                    </span>
                    <p className="text-gray-700 mt-1">
                      {ball.is_wicket 
                        ? `WICKET! ${ball.wicket_type || 'OUT'}`
                        : `${ball.runs_scored + ball.extras} run${ball.runs_scored + ball.extras === 1 ? '' : 's'}`
                      }
                      {ball.extra_type && ` (${ball.extra_type})`}
                    </p>
                  </div>
                  <div className={`
                    text-2xl font-bold ml-4
                    ${ball.is_wicket ? 'text-red-600' : 'text-gray-800'}
                  `}>
                    {ball.is_wicket ? 'W' : (ball.runs_scored + ball.extras)}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'info' && (
        <Card>
          <h3 className="text-xl font-bold mb-4">Match Information</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Match Number</p>
                <p className="font-semibold">{matchData.match_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Venue</p>
                <p className="font-semibold">{matchData.venue}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-semibold">
                  {new Date(matchData.match_date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Overs</p>
                <p className="font-semibold">{matchData.overs_per_side} overs per side</p>
              </div>
              {matchData.toss_winner_id && (
                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-500">Toss</p>
                  <p className="font-semibold">
                    {matchData.toss_winner?.name} won the toss and chose to {matchData.toss_decision}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default LiveMatch;

