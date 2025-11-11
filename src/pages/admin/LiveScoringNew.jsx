import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getCurrentInnings, 
  initializeInnings, 
  recordBall, 
  addNewBatsman,
  changeBowler,
  switchStrike
} from '../../services/scoringService';
import { getPlayersByTeam } from '../../services/playerService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

const LiveScoring = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState(null);
  const [innings, setInnings] = useState(null);
  const [batsmen, setBatsmen] = useState([]);
  const [bowler, setBowler] = useState(null);
  const [partnership, setPartnership] = useState(null);
  const [recentBalls, setRecentBalls] = useState([]);
  
  // Setup state
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [battingTeamPlayers, setBattingTeamPlayers] = useState([]);
  const [bowlingTeamPlayers, setBowlingTeamPlayers] = useState([]);
  const [setupData, setSetupData] = useState({
    batsman1: '',
    batsman2: '',
    bowler: ''
  });
  
  // Modals
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [showBatsmanModal, setShowBatsmanModal] = useState(false);
  const [wicketData, setWicketData] = useState({
    type: 'caught',
    fielderId: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch data on mount
  useEffect(() => {
    fetchInningsData();
  }, [matchId]);

  const fetchInningsData = async () => {
    setLoading(true);
    setError('');
    
    const { data, error } = await getCurrentInnings(matchId);
    
    if (error) {
      setError('Failed to load match: ' + error.message);
      setLoading(false);
      return;
    }
    
    setMatchData(data.match);
    setInnings(data.innings);
    setBatsmen(data.batsmen);
    setBowler(data.bowler);
    setPartnership(data.partnership);
    setRecentBalls(data.recentBalls);
    
    // Check if setup is complete
    if (data.batsmen.length === 0 || !data.bowler) {
      setIsSetupComplete(false);
      // Load players for setup
      await loadPlayersForSetup(data.innings);
    } else {
      setIsSetupComplete(true);
    }
    
    setLoading(false);
  };

  const loadPlayersForSetup = async (inningsData) => {
    const { data: battingPlayers } = await getPlayersByTeam(inningsData.batting_team_id);
    const { data: bowlingPlayers } = await getPlayersByTeam(inningsData.bowling_team_id);
    
    setBattingTeamPlayers(battingPlayers || []);
    setBowlingTeamPlayers(bowlingPlayers || []);
  };

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!setupData.batsman1 || !setupData.batsman2 || !setupData.bowler) {
      setError('Please select all players');
      return;
    }
    
    if (setupData.batsman1 === setupData.batsman2) {
      setError('Please select different batsmen');
      return;
    }
    
    const { data, error } = await initializeInnings(
      innings.id,
      setupData.batsman1,
      setupData.batsman2,
      setupData.bowler
    );
    
    if (error) {
      setError('Failed to start innings: ' + error.message);
    } else {
      setSuccess('Innings started successfully!');
      fetchInningsData();
    }
  };

  const handleScoreBall = async (runs, extraType = null, extras = 0) => {
    setError('');
    
    if (!batsmen || batsmen.length < 2 || !bowler) {
      setError('Setup not complete');
      return;
    }
    
    const striker = batsmen.find(b => b.is_on_strike);
    const nonStriker = batsmen.find(b => !b.is_on_strike);
    
    const { data, error } = await recordBall({
      inningsId: innings.id,
      batsmanId: striker.player_id,
      bowlerId: bowler.player_id,
      nonStrikerId: nonStriker.player_id,
      runs,
      extras,
      extraType,
      isWicket: false
    });
    
    if (error) {
      setError('Failed to record ball: ' + error.message);
    } else {
      fetchInningsData();
    }
  };

  const handleWicketSubmit = async () => {
    setShowWicketModal(false);
    setError('');
    
    const striker = batsmen.find(b => b.is_on_strike);
    const nonStriker = batsmen.find(b => !b.is_on_strike);
    
    const { data, error } = await recordBall({
      inningsId: innings.id,
      batsmanId: striker.player_id,
      bowlerId: bowler.player_id,
      nonStrikerId: nonStriker.player_id,
      runs: 0,
      isWicket: true,
      wicketType: wicketData.type,
      fielderId: wicketData.fielderId || null
    });
    
    if (error) {
      setError('Failed to record wicket: ' + error.message);
    } else {
      fetchInningsData();
      // Show batsman selection modal if not all out
      if (innings.total_wickets + 1 < 10) {
        setShowBatsmanModal(true);
      }
    }
  };

  const handleNewBatsman = async (playerId) => {
    setShowBatsmanModal(false);
    setError('');
    
    const { data, error } = await addNewBatsman(innings.id, playerId);
    
    if (error) {
      setError('Failed to add batsman: ' + error.message);
    } else {
      fetchInningsData();
    }
  };

  const handleChangeBowler = async (newBowlerId) => {
    setShowBowlerModal(false);
    setError('');
    
    const { data, error } = await changeBowler(innings.id, newBowlerId);
    
    if (error) {
      setError('Failed to change bowler: ' + error.message);
    } else {
      fetchInningsData();
    }
  };

  const handleSwitchStrike = async () => {
    const { data, error } = await switchStrike(innings.id);
    
    if (error) {
      setError('Failed to switch strike: ' + error.message);
    } else {
      fetchInningsData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading match...</div>
      </div>
    );
  }

  if (!matchData || !innings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">Match not found</div>
      </div>
    );
  }

  // Setup Screen
  if (!isSetupComplete) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <h2 className="text-2xl font-bold mb-6">Setup Innings</h2>
          <p className="text-gray-600 mb-6">
            Select opening batsmen and bowler to start the innings
          </p>
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSetupSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Opening Batsman 1 <span className="text-red-500">*</span>
                </label>
                <select
                  value={setupData.batsman1}
                  onChange={(e) => setSetupData({...setupData, batsman1: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select Batsman</option>
                  {battingTeamPlayers.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({player.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Opening Batsman 2 <span className="text-red-500">*</span>
                </label>
                <select
                  value={setupData.batsman2}
                  onChange={(e) => setSetupData({...setupData, batsman2: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select Batsman</option>
                  {battingTeamPlayers.map(player => (
                    <option key={player.id} value={player.id} disabled={player.id === setupData.batsman1}>
                      {player.name} ({player.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Opening Bowler <span className="text-red-500">*</span>
                </label>
                <select
                  value={setupData.bowler}
                  onChange={(e) => setSetupData({...setupData, bowler: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select Bowler</option>
                  {bowlingTeamPlayers.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({player.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button type="submit" className="flex-1">
                Start Innings
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate('/admin/matches')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  // Scoring Screen
  const striker = batsmen.find(b => b.is_on_strike);
  const nonStriker = batsmen.find(b => !b.is_on_strike);

  return (
    <div className="pb-6">
      {/* Messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Match Header */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
            Live Scoring - Match {matchData.match_number}
          </h1>
          <Badge variant="live" size="lg">● LIVE</Badge>
        </div>
        <p className="text-sm sm:text-base text-gray-600">
          {matchData.team1.short_name} vs {matchData.team2.short_name} • {matchData.venue}
        </p>
      </div>

      {/* Current Score Display */}
      <Card className="mb-4 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-1">
              <span className="text-3xl sm:text-4xl">{innings.batting_team.logo}</span> {innings.batting_team.short_name}
            </h2>
            <p className="text-green-100 text-sm">Batting - Inning {matchData.current_inning}</p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-5xl sm:text-6xl font-bold">
              {innings.total_runs}/{innings.total_wickets}
            </div>
            <div className="text-xl sm:text-2xl text-green-100">
              ({innings.total_overs.toFixed(1)} / {matchData.overs_per_side} overs)
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-green-500">
          <div>
            <p className="text-green-200 text-xs sm:text-sm">Current Run Rate</p>
            <p className="text-xl sm:text-2xl font-bold">{innings.run_rate.toFixed(2)}</p>
          </div>
          {partnership && (
            <div className="text-right">
              <p className="text-green-200 text-xs sm:text-sm">Partnership</p>
              <p className="text-xl sm:text-2xl font-bold">
                {partnership.runs_scored} ({partnership.balls_faced})
              </p>
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
        {/* Scoring Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Current Batsmen */}
          <Card>
            <h3 className="font-bold text-base sm:text-lg mb-3">Current Batsmen</h3>
            <div className="space-y-3">
              {striker && (
                <div className="p-3 sm:p-4 rounded-lg bg-green-50 border-2 border-green-500">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="font-bold text-sm sm:text-base">{striker.player.name}</span>
                      </div>
                      <Badge variant="success" size="sm">ON STRIKE</Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs sm:text-sm">
                      <div>
                        <p className="text-gray-500">Runs</p>
                        <p className="font-bold">{striker.runs_scored}({striker.balls_faced})</p>
                      </div>
                      <div>
                        <p className="text-gray-500">4s</p>
                        <p className="font-bold">{striker.fours}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">6s</p>
                        <p className="font-bold">{striker.sixes}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">SR</p>
                        <p className="font-bold">{striker.strike_rate.toFixed(0)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {nonStriker && (
                <div className="p-3 sm:p-4 rounded-lg bg-gray-50">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm sm:text-base">{nonStriker.player.name}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs sm:text-sm">
                      <div>
                        <p className="text-gray-500">Runs</p>
                        <p className="font-bold">{nonStriker.runs_scored}({nonStriker.balls_faced})</p>
                      </div>
                      <div>
                        <p className="text-gray-500">4s</p>
                        <p className="font-bold">{nonStriker.fours}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">6s</p>
                        <p className="font-bold">{nonStriker.sixes}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">SR</p>
                        <p className="font-bold">{nonStriker.strike_rate.toFixed(0)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Current Bowler */}
          {bowler && (
            <Card>
              <h3 className="font-bold text-base sm:text-lg mb-3">Current Bowler</h3>
              <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm sm:text-base">{bowler.player.name}</span>
                    <Badge variant="info" size="sm">BOWLING</Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs sm:text-sm">
                    <div>
                      <p className="text-gray-500">Overs</p>
                      <p className="font-bold">{bowler.overs_bowled.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Runs</p>
                      <p className="font-bold">{bowler.runs_conceded}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Wkts</p>
                      <p className="font-bold">{bowler.wickets_taken}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Eco</p>
                      <p className="font-bold">{bowler.economy_rate.toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Scoring Buttons */}
          <Card>
            <h3 className="font-bold text-base sm:text-lg mb-4">Score Input</h3>
            
            {/* Runs */}
            <div className="mb-6">
              <p className="text-xs sm:text-sm text-gray-600 mb-3 font-semibold">RUNS</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
                {[0, 1, 2, 3, 4, 6].map(runs => (
                  <Button
                    key={runs}
                    onClick={() => handleScoreBall(runs)}
                    variant={runs === 4 || runs === 6 ? 'primary' : 'secondary'}
                    className="text-2xl sm:text-3xl font-bold h-16 sm:h-20 active:scale-95 transition-transform"
                  >
                    {runs}
                  </Button>
                ))}
              </div>
            </div>

            {/* Extras */}
            <div className="mb-6">
              <p className="text-xs sm:text-sm text-gray-600 mb-3 font-semibold">EXTRAS</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <Button 
                  onClick={() => handleScoreBall(0, 'wide', 1)} 
                  variant="outline"
                  className="h-12 sm:h-14 text-sm sm:text-base"
                >
                  Wide
                </Button>
                <Button 
                  onClick={() => handleScoreBall(0, 'no_ball', 1)} 
                  variant="outline"
                  className="h-12 sm:h-14 text-sm sm:text-base"
                >
                  No Ball
                </Button>
                <Button 
                  onClick={() => handleScoreBall(0, 'bye', 1)} 
                  variant="outline"
                  className="h-12 sm:h-14 text-sm sm:text-base"
                >
                  Bye
                </Button>
                <Button 
                  onClick={() => handleScoreBall(0, 'leg_bye', 1)} 
                  variant="outline"
                  className="h-12 sm:h-14 text-sm sm:text-base"
                >
                  Leg Bye
                </Button>
              </div>
            </div>

            {/* Wicket & Controls */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Button 
                onClick={() => setShowWicketModal(true)} 
                variant="danger" 
                className="h-14 sm:h-16 text-base sm:text-lg font-bold"
              >
                🎯 WICKET
              </Button>
              <Button 
                onClick={() => alert('Undo feature coming soon')} 
                variant="outline" 
                className="h-14 sm:h-16 text-base sm:text-lg font-bold"
              >
                ↩️ UNDO
              </Button>
            </div>
          </Card>

          {/* Recent Balls */}
          {recentBalls.length > 0 && (
            <Card>
              <h3 className="font-bold text-base sm:text-lg mb-3">Recent Balls</h3>
              <div className="flex space-x-2 overflow-x-auto">
                {recentBalls.reverse().map((ball, index) => {
                  let ballColor = 'bg-gray-300 text-gray-700';
                  const display = ball.is_wicket ? 'W' : (ball.runs_scored + ball.extras).toString();
                  
                  if (ball.is_wicket) ballColor = 'bg-red-500 text-white';
                  else if (ball.runs_scored === 4) ballColor = 'bg-blue-500 text-white';
                  else if (ball.runs_scored === 6) ballColor = 'bg-purple-500 text-white';
                  else if (ball.runs_scored + ball.extras > 0) ballColor = 'bg-green-500 text-white';

                  return (
                    <div
                      key={ball.id}
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${ballColor}`}
                    >
                      {display === '0' ? '•' : display}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Match Controls Sidebar */}
        <div className="space-y-4">
          <Card>
            <h3 className="font-bold text-base sm:text-lg mb-3">Match Controls</h3>
            <div className="space-y-2">
              <Button 
                className="w-full h-12 text-sm sm:text-base" 
                variant="secondary"
                onClick={() => setShowBowlerModal(true)}
              >
                Change Bowler
              </Button>
              <Button 
                className="w-full h-12 text-sm sm:text-base" 
                variant="outline"
                onClick={handleSwitchStrike}
              >
                Switch Strike
              </Button>
              <hr className="my-3" />
              <Button 
                className="w-full h-12 text-sm sm:text-base" 
                variant="primary"
              >
                End Innings
              </Button>
              <Button 
                className="w-full h-12 text-sm sm:text-base" 
                variant="danger"
              >
                End Match
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-base sm:text-lg mb-3">Match Info</h3>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Match</span>
                <span className="font-semibold">{matchData.match_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Overs</span>
                <span className="font-semibold">{matchData.overs_per_side} per side</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Balls Left</span>
                <span className="font-semibold">
                  {(matchData.overs_per_side * 6) - innings.total_balls}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Wicket Modal */}
      {showWicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Record Wicket</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dismissal Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={wicketData.type}
                  onChange={(e) => setWicketData({...wicketData, type: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="caught">Caught</option>
                  <option value="bowled">Bowled</option>
                  <option value="lbw">LBW</option>
                  <option value="run_out">Run Out</option>
                  <option value="stumped">Stumped</option>
                  <option value="hit_wicket">Hit Wicket</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <Button onClick={handleWicketSubmit} variant="danger" className="flex-1">
                  Confirm Wicket
                </Button>
                <Button onClick={() => setShowWicketModal(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* New Batsman Modal */}
      {showBatsmanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Select New Batsman</h3>
            <div className="space-y-2">
              {battingTeamPlayers
                .filter(p => !batsmen.find(b => b.player_id === p.id))
                .map(player => (
                  <button
                    key={player.id}
                    onClick={() => handleNewBatsman(player.id)}
                    className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <span className="font-semibold">{player.name}</span>
                    <span className="text-sm text-gray-600 ml-2">({player.role})</span>
                  </button>
                ))}
            </div>
          </Card>
        </div>
      )}

      {/* Change Bowler Modal */}
      {showBowlerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Change Bowler</h3>
            <div className="space-y-2">
              {bowlingTeamPlayers
                .filter(p => p.id !== bowler?.player_id)
                .map(player => (
                  <button
                    key={player.id}
                    onClick={() => handleChangeBowler(player.id)}
                    className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <span className="font-semibold">{player.name}</span>
                    <span className="text-sm text-gray-600 ml-2">({player.role})</span>
                  </button>
                ))}
            </div>
            <Button 
              onClick={() => setShowBowlerModal(false)} 
              variant="outline" 
              className="w-full mt-4"
            >
              Cancel
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LiveScoring;

