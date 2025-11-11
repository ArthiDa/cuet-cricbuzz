import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getCurrentInnings, 
  initializeInnings, 
  recordBall, 
  addNewBatsman,
  changeBowler,
  switchStrike,
  endInnings,
  endMatch,
  undoLastAction
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
  const [showForceEndInningsModal, setShowForceEndInningsModal] = useState(false);
  const [showAdvancedScoringModal, setShowAdvancedScoringModal] = useState(false);
  const [wicketData, setWicketData] = useState({
    outBatsmanId: '', // WHO is out
    type: 'caught',
    fielderId: ''
  });
  
  // Advanced scoring state
  const [advancedScoring, setAdvancedScoring] = useState({
    deliveryType: 'normal', // normal, no_ball, wide
    runsType: 'bat', // bat, bye, leg_bye
    baseRuns: 0,
    overthrows: 0,
    penaltyRuns: 0
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
      
      // Check batsmen status
      const activeBatsmen = data.batsmen.filter(b => !b.is_out);
      const totalWickets = data.innings.total_wickets;
      
      // Load batting team players for modals
      const { data: battingPlayers } = await getPlayersByTeam(data.innings.batting_team_id);
      setBattingTeamPlayers(battingPlayers || []);
      
      // Get available batsmen (haven't batted yet)
      const availableBatsmen = battingPlayers?.filter(p => 
        !data.batsmen.find(b => b.player_id === p.id)
      ) || [];
      
      if (activeBatsmen.length < 2) {
        // Less than 2 active batsmen - check what to do
        if (totalWickets >= 10 || availableBatsmen.length === 0) {
          // All out or no more batsmen available - must end innings
          setShowForceEndInningsModal(true);
        } else if (activeBatsmen.length === 1 && totalWickets < 10) {
          // Only 1 batsman but more available - need to select new batsman
          setShowBatsmanModal(true);
        }
      }
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

  const handleAdvancedScoringSubmit = async () => {
    setShowAdvancedScoringModal(false);
    
    const { deliveryType, runsType, baseRuns, overthrows, penaltyRuns } = advancedScoring;
    
    let totalRunsToBatsman = 0; // Runs credited to batsman
    let extraType = null;
    let totalExtras = 0; // Total extras
    
    // Physical runs = how many times batsmen crossed between wickets (for strike rotation)
    const physicalRuns = baseRuns + overthrows;
    
    // Calculate based on delivery type and run type
    if (deliveryType === 'wide') {
      // Wide: 1 + any runs scored (all go to extras)
      extraType = 'wide';
      totalExtras = 1 + baseRuns + overthrows + penaltyRuns;
      totalRunsToBatsman = 0; // No runs to batsman on wide
      
    } else if (deliveryType === 'no_ball') {
      // No Ball scenarios
      if (runsType === 'bat') {
        // No ball + runs from bat: 1 no-ball extra + runs to batsman
        extraType = 'no_ball';
        totalExtras = 1 + penaltyRuns; // Just the no-ball + penalty
        totalRunsToBatsman = baseRuns + overthrows; // Runs + overthrows go to batsman
      } else if (runsType === 'bye') {
        // No ball + byes: 1 no-ball + bye runs (all extras)
        extraType = 'no_ball_bye'; // Combined type
        totalExtras = 1 + baseRuns + overthrows + penaltyRuns;
        totalRunsToBatsman = 0;
      } else if (runsType === 'leg_bye') {
        // No ball + leg byes: 1 no-ball + leg-bye runs (all extras)
        extraType = 'no_ball_leg_bye'; // Combined type
        totalExtras = 1 + baseRuns + overthrows + penaltyRuns;
        totalRunsToBatsman = 0;
      }
      
    } else {
      // Normal delivery
      if (runsType === 'bat') {
        // Runs from bat (normal scoring)
        extraType = null;
        totalExtras = penaltyRuns; // Only penalty if any
        totalRunsToBatsman = baseRuns + overthrows; // Runs + overthrows to batsman
      } else if (runsType === 'bye') {
        // Byes: all to extras
        extraType = 'bye';
        totalExtras = baseRuns + overthrows + penaltyRuns;
        totalRunsToBatsman = 0;
      } else if (runsType === 'leg_bye') {
        // Leg byes: all to extras
        extraType = 'leg_bye';
        totalExtras = baseRuns + overthrows + penaltyRuns;
        totalRunsToBatsman = 0;
      }
    }
    
    // Call the scoring function with physicalRuns for strike rotation
    await handleScoreBall(totalRunsToBatsman, extraType, totalExtras, physicalRuns);
    
    // Reset advanced scoring
    setAdvancedScoring({
      deliveryType: 'normal',
      runsType: 'bat',
      baseRuns: 0,
      overthrows: 0,
      penaltyRuns: 0
    });
  };

  const handleScoreBall = async (runs, extraType = null, extras = 0, physicalRuns = null) => {
    setError('');
    
    if (!batsmen || batsmen.length < 2 || !bowler) {
      setError('Setup not complete - Please ensure two batsmen and a bowler are selected');
      return;
    }
    
    // Find active batsmen (not out)
    const activeBatsmen = batsmen.filter(b => !b.is_out);
    const striker = activeBatsmen.find(b => b.is_on_strike);
    const nonStriker = activeBatsmen.find(b => !b.is_on_strike);
    
    if (!striker || !nonStriker) {
      setError('Cannot find batsmen on strike. Please refresh the page.');
      return;
    }
    
    // Check if this is a legal delivery (not wide or no-ball)
    const isLegalDelivery = !extraType || (extraType !== 'wide' && extraType !== 'no_ball');
    
    const { data, error } = await recordBall({
      inningsId: innings.id,
      batsmanId: striker.player_id,
      bowlerId: bowler.player_id,
      nonStrikerId: nonStriker.player_id,
      runs,
      extras,
      extraType,
      isWicket: false,
      physicalRuns // Pass physicalRuns for accurate strike rotation
    });
    
    if (error) {
      setError('Failed to record ball: ' + error.message);
    } else {
      await fetchInningsData();
      
      // Check if over is complete (6 legal deliveries)
      if (isLegalDelivery) {
        const currentBallsInOver = (bowler.balls_bowled + 1) % 6;
        if (currentBallsInOver === 0) {
          // Over complete - load bowlers and show change bowler modal
          await loadPlayersForSetup(innings);
          setSuccess('Over complete! Please select a new bowler.');
          setTimeout(() => {
            setSuccess('');
            setShowBowlerModal(true);
          }, 1500);
        }
      }
    }
  };

  const handleWicketSubmit = async () => {
    setShowWicketModal(false);
    setError('');
    
    if (!wicketData.outBatsmanId) {
      setError('Please select who is out');
      return;
    }
    
    // Find active batsmen (not out)
    const activeBatsmen = batsmen.filter(b => !b.is_out);
    const striker = activeBatsmen.find(b => b.is_on_strike);
    const nonStriker = activeBatsmen.find(b => !b.is_on_strike);
    
    if (!striker || !nonStriker) {
      setError('Cannot find batsmen. Please refresh the page.');
      return;
    }
    
    // Record wicket for the OUT batsman
    const { data, error } = await recordBall({
      inningsId: innings.id,
      batsmanId: wicketData.outBatsmanId, // Use the selected out batsman
      bowlerId: bowler.player_id,
      nonStrikerId: wicketData.outBatsmanId === striker.player_id ? nonStriker.player_id : striker.player_id,
      runs: 0,
      isWicket: true,
      wicketType: wicketData.type,
      fielderId: wicketData.fielderId || null
    });
    
    if (error) {
      setError('Failed to record wicket: ' + error.message);
    } else {
      await fetchInningsData();
      
      // Check if this is the 10th wicket or no more batsmen available
      const newWickets = innings.total_wickets + 1;
      const outBatsmenCount = batsmen.filter(b => b.is_out).length + 1; // +1 for current wicket
      
      // Ensure batting team players are loaded
      if (battingTeamPlayers.length === 0) {
        await loadPlayersForSetup(innings);
      }
      
      // Get available batsmen (not already played)
      const availableBatsmen = battingTeamPlayers.filter(p => 
        !batsmen.find(b => b.player_id === p.id)
      );
      
      if (newWickets >= 10 || availableBatsmen.length === 0) {
        // All out - force end innings
        setShowForceEndInningsModal(true);
      } else {
        // Show batsman selection modal
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
      setError('Failed to switch: ' + error.message);
    } else {
      setSuccess('Strike switched!');
      await fetchInningsData();
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const handleEndInnings = async () => {
    if (!confirm('Are you sure you want to end this innings?')) return;
    
    setError('');
    const { data, error } = await endInnings(matchId, innings.id);
    
    if (error) {
      setError('Failed to end innings: ' + error.message);
    } else {
      if (data.nextInning === 2) {
        setSuccess('First innings completed! Starting second innings...');
        setTimeout(() => fetchInningsData(), 2000);
      } else {
        setSuccess('Match completed!');
        setTimeout(() => navigate('/admin/matches'), 2000);
      }
    }
  };

  const handleEndMatch = async () => {
    if (!confirm('Are you sure you want to end this match? This action cannot be undone.')) return;
    
    setError('');
    const { data, error } = await endMatch(matchId);
    
    if (error) {
      setError('Failed to end match: ' + error.message);
    } else {
      setSuccess('Match ended successfully!');
      setTimeout(() => navigate('/admin/matches'), 2000);
    }
  };

  const handleUndo = async () => {
    if (!confirm('Are you sure you want to undo the last action?')) return;
    
    setError('');
    setSuccess('');
    
    const { data, error } = await undoLastAction(innings.id);
    
    if (error) {
      setError('Failed to undo: ' + error.message);
    } else {
      setSuccess('Last action undone successfully!');
      await fetchInningsData();
      setTimeout(() => setSuccess(''), 2000);
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

  // Scoring Screen - Calculate striker and non-striker
  // Filter only active (not out) batsmen for display
  const activeBatsmen = batsmen?.filter(b => !b.is_out) || [];
  const striker = activeBatsmen.find(b => b.is_on_strike);
  const nonStriker = activeBatsmen.find(b => !b.is_on_strike);

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
            
            {/* Warning if less than 2 batsmen */}
            {activeBatsmen.length < 2 ? (
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                <div className="text-center mb-4">
                  <p className="text-yellow-800 font-semibold mb-2">⚠️ Waiting for Batsmen</p>
                  <p className="text-sm text-yellow-700">
                    {activeBatsmen.length === 0 
                      ? 'No active batsmen. Please select batsmen to continue.'
                      : 'Only 1 batsman available. Please select a new batsman to continue scoring.'}
                  </p>
                </div>
                {(() => {
                  // Check if there are available batsmen
                  const availablePlayers = battingTeamPlayers.filter(p => !batsmen.find(b => b.player_id === p.id));
                  
                  if (availablePlayers.length > 0) {
                    return (
                      <Button 
                        onClick={() => setShowBatsmanModal(true)} 
                        variant="primary"
                        className="w-full h-12 text-base font-bold"
                      >
                        ⚾ Select Next Batsman
                      </Button>
                    );
                  } else {
                    return (
                      <Button 
                        onClick={handleEndInnings} 
                        variant="danger"
                        className="w-full h-12 text-base font-bold"
                      >
                        🏁 End Innings (No Batsmen Left)
                      </Button>
                    );
                  }
                })()}
              </div>
            ) : (
              <>
                {/* Runs from BAT */}
                <div className="mb-6">
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 font-semibold">RUNS FROM BAT</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-3">Counts as ball faced</p>
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

                {/* Simple Extras */}
                <div className="mb-6">
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 font-semibold">SIMPLE EXTRAS</p>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <Button 
                      onClick={() => handleScoreBall(0, 'wide', 1, 0)} 
                      variant="outline"
                      className="h-12 sm:h-14 text-sm sm:text-base flex flex-col items-center justify-center"
                    >
                      <span className="font-bold">Wide</span>
                      <span className="text-xs text-gray-500">+1 run</span>
                    </Button>
                    <Button 
                      onClick={() => handleScoreBall(0, 'no_ball', 1, 0)} 
                      variant="outline"
                      className="h-12 sm:h-14 text-sm sm:text-base flex flex-col items-center justify-center"
                    >
                      <span className="font-bold">No Ball</span>
                      <span className="text-xs text-gray-500">+1 run</span>
                    </Button>
                    <Button 
                      onClick={() => handleScoreBall(0, 'bye', 1, 1)} 
                      variant="outline"
                      className="h-12 sm:h-14 text-sm sm:text-base flex flex-col items-center justify-center"
                    >
                      <span className="font-bold">Bye</span>
                      <span className="text-xs text-gray-500">+1 run</span>
                    </Button>
                    <Button 
                      onClick={() => handleScoreBall(0, 'leg_bye', 1, 1)} 
                      variant="outline"
                      className="h-12 sm:h-14 text-sm sm:text-base flex flex-col items-center justify-center"
                    >
                      <span className="font-bold">Leg Bye</span>
                      <span className="text-xs text-gray-500">+1 run</span>
                    </Button>
                  </div>
                </div>

                {/* Advanced Scoring Button */}
                <div className="mb-6">
                  <Button 
                    onClick={() => {
                      setAdvancedScoring({
                        deliveryType: 'normal',
                        runsType: 'bat',
                        baseRuns: 0,
                        overthrows: 0,
                        penaltyRuns: 0
                      });
                      setShowAdvancedScoringModal(true);
                    }} 
                    variant="secondary"
                    className="w-full h-14 text-base font-bold"
                  >
                    📊 Advanced Scoring
                  </Button>
                </div>

                {/* Wicket & Controls */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <Button 
                    onClick={() => {
                      setWicketData({ outBatsmanId: '', type: 'caught', fielderId: '' });
                      setShowWicketModal(true);
                    }} 
                    variant="danger" 
                    className="h-14 sm:h-16 text-base sm:text-lg font-bold"
                  >
                    🎯 WICKET
                  </Button>
                  <Button 
                    onClick={handleUndo} 
                    variant="outline" 
                    className="h-14 sm:h-16 text-base sm:text-lg font-bold"
                  >
                    ↩️ UNDO
                  </Button>
                </div>
              </>
            )}
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
                onClick={async () => {
                  await loadPlayersForSetup(innings);
                  setShowBowlerModal(true);
                }}
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
                onClick={handleEndInnings}
              >
                End Innings
              </Button>
              <Button 
                className="w-full h-12 text-sm sm:text-base" 
                variant="danger"
                onClick={handleEndMatch}
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
      {showWicketModal && batsmen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">🏏 Record Wicket</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Who is Out? <span className="text-red-500">*</span>
                </label>
                <select
                  value={wicketData.outBatsmanId}
                  onChange={(e) => setWicketData({...wicketData, outBatsmanId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">-- Select Batsman --</option>
                  {batsmen.filter(b => !b.is_out).map(batsman => (
                    <option key={batsman.player_id} value={batsman.player_id}>
                      {batsman.name} {batsman.is_on_strike ? '(Striker)' : '(Non-Striker)'} - {batsman.runs_scored}({batsman.balls_faced})
                    </option>
                  ))}
                </select>
              </div>
              
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
          <Card className="max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">⚾ Select New Batsman</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                A wicket has fallen or you need 2 batsmen to continue. Please select the next batsman.
              </p>
            </div>
            
            <div className="space-y-2 mb-4">
              {battingTeamPlayers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Loading players...</p>
                </div>
              ) : (() => {
                const availablePlayers = battingTeamPlayers.filter(p => !batsmen.find(b => b.player_id === p.id));
                
                if (availablePlayers.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-gray-700 mb-4">No more batsmen available</p>
                      <Button 
                        onClick={handleEndInnings} 
                        variant="danger"
                        className="w-full"
                      >
                        End Innings
                      </Button>
                    </div>
                  );
                }
                
                return availablePlayers.map(player => (
                  <button
                    key={player.id}
                    onClick={() => handleNewBatsman(player.id)}
                    className="w-full px-4 py-3 text-left border-2 border-gray-300 rounded-lg hover:bg-green-50 hover:border-green-500 transition-colors"
                  >
                    <span className="font-semibold text-gray-800">{player.name}</span>
                    <span className="text-sm text-gray-600 ml-2">({player.role})</span>
                  </button>
                ));
              })()}
            </div>
            
            {battingTeamPlayers.filter(p => !batsmen.find(b => b.player_id === p.id)).length > 0 && (
              <Button 
                onClick={() => setShowBatsmanModal(false)} 
                variant="outline" 
                className="w-full"
              >
                Cancel
              </Button>
            )}
          </Card>
        </div>
      )}

      {/* Change Bowler Modal */}
      {showBowlerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Change Bowler</h3>
            {bowlingTeamPlayers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Loading players...</p>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {bowlingTeamPlayers
                  .filter(p => p.id !== bowler?.player_id)
                  .map(player => (
                    <button
                      key={player.id}
                      onClick={() => handleChangeBowler(player.id)}
                      className="w-full px-4 py-3 text-left border-2 border-gray-300 rounded-lg hover:bg-green-50 hover:border-green-500 transition-colors"
                    >
                      <span className="font-semibold">{player.name}</span>
                      <span className="text-sm text-gray-600 ml-2">({player.role})</span>
                    </button>
                  ))}
              </div>
            )}
            <Button 
              onClick={() => setShowBowlerModal(false)} 
              variant="outline" 
              className="w-full"
            >
              Cancel
            </Button>
          </Card>
        </div>
      )}

      {/* Force End Innings Modal (All Out) */}
      {showForceEndInningsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-red-600">⚠️ All Out!</h3>
            <div className="space-y-4">
              <p className="text-gray-700">
                All wickets are down or no more batsmen are available. The innings must be ended now.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Current Score:</strong> {innings?.total_runs}/{innings?.total_wickets} ({innings?.total_overs} overs)
                </p>
              </div>
              <Button 
                onClick={handleEndInnings} 
                variant="danger" 
                className="w-full"
              >
                End Innings
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Advanced Scoring Modal */}
      {showAdvancedScoringModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">📊 Advanced Scoring</h3>
            
            <div className="space-y-4">
              {/* Delivery Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Delivery Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'normal', label: 'Normal' },
                    { value: 'no_ball', label: 'No Ball' },
                    { value: 'wide', label: 'Wide' }
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => setAdvancedScoring({...advancedScoring, deliveryType: type.value})}
                      className={`px-4 py-3 rounded-lg border-2 font-semibold transition-colors ${
                        advancedScoring.deliveryType === type.value
                          ? 'bg-green-500 text-white border-green-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* How Runs Scored */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  How Runs Scored
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'bat', label: 'From Bat' },
                    { value: 'bye', label: 'Bye' },
                    { value: 'leg_bye', label: 'Leg Bye' }
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => setAdvancedScoring({...advancedScoring, runsType: type.value})}
                      className={`px-4 py-3 rounded-lg border-2 font-semibold transition-colors ${
                        advancedScoring.runsType === type.value
                          ? 'bg-blue-500 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Base Runs */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Base Runs
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map(runs => (
                    <button
                      key={runs}
                      onClick={() => setAdvancedScoring({...advancedScoring, baseRuns: runs})}
                      className={`px-4 py-3 rounded-lg border-2 font-bold text-xl transition-colors ${
                        advancedScoring.baseRuns === runs
                          ? 'bg-purple-500 text-white border-purple-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                      }`}
                    >
                      {runs}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[4, 5, 6].map(runs => (
                    <button
                      key={runs}
                      onClick={() => setAdvancedScoring({...advancedScoring, baseRuns: runs})}
                      className={`px-4 py-3 rounded-lg border-2 font-bold text-xl transition-colors ${
                        advancedScoring.baseRuns === runs
                          ? 'bg-purple-500 text-white border-purple-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                      }`}
                    >
                      {runs}
                    </button>
                  ))}
                </div>
              </div>

              {/* Overthrows */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Overthrows
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[0, 1, 2, 3, 4].map(runs => (
                    <button
                      key={runs}
                      onClick={() => setAdvancedScoring({...advancedScoring, overthrows: runs})}
                      className={`px-4 py-3 rounded-lg border-2 font-bold transition-colors ${
                        advancedScoring.overthrows === runs
                          ? 'bg-orange-500 text-white border-orange-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                      }`}
                    >
                      {runs}
                    </button>
                  ))}
                </div>
              </div>

              {/* Penalty Runs */}
              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={advancedScoring.penaltyRuns === 5}
                    onChange={(e) => setAdvancedScoring({
                      ...advancedScoring, 
                      penaltyRuns: e.target.checked ? 5 : 0
                    })}
                    className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">
                    Add 5 Penalty Runs
                  </span>
                </label>
              </div>

              {/* Summary */}
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                <h4 className="font-bold text-gray-800 mb-2">Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Batsman Run:</span>
                    <span className="font-semibold">
                      {(() => {
                        const { deliveryType, runsType, baseRuns, overthrows } = advancedScoring;
                        
                        if (deliveryType === 'wide') {
                          return 0; // No runs to batsman on wide
                        } else if (deliveryType === 'no_ball') {
                          if (runsType === 'bat') {
                            return baseRuns + overthrows; // Runs + overthrows to batsman
                          } else {
                            return 0; // Byes/Leg-byes on no-ball
                          }
                        } else {
                          // Normal delivery
                          if (runsType === 'bat') {
                            return baseRuns + overthrows; // Runs to batsman
                          } else {
                            return 0; // Byes/Leg-byes
                          }
                        }
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Extras:</span>
                    <span className="font-semibold">
                      {(() => {
                        const { deliveryType, runsType, baseRuns, overthrows, penaltyRuns } = advancedScoring;
                        
                        if (deliveryType === 'wide') {
                          return 1 + baseRuns + overthrows + penaltyRuns; // Wide + any runs
                        } else if (deliveryType === 'no_ball') {
                          if (runsType === 'bat') {
                            return 1 + penaltyRuns; // Just the no-ball + penalty
                          } else {
                            return 1 + baseRuns + overthrows + penaltyRuns; // No-ball + bye/leg-bye runs
                          }
                        } else {
                          // Normal delivery
                          if (runsType === 'bat') {
                            return penaltyRuns; // Only penalty if any
                          } else {
                            return baseRuns + overthrows + penaltyRuns; // Byes/Leg-byes
                          }
                        }
                      })()}
                    </span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between text-base">
                    <span className="text-gray-800 font-bold">Total Runs:</span>
                    <span className="font-bold text-green-600">
                      {(() => {
                        let total = advancedScoring.baseRuns + advancedScoring.overthrows + advancedScoring.penaltyRuns;
                        // Add +1 for wide or no-ball
                        if (advancedScoring.deliveryType === 'wide' || advancedScoring.deliveryType === 'no_ball') {
                          total += 1;
                        }
                        return total;
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-800 font-bold">Ball Counts:</span>
                    <span className="font-bold text-blue-600">
                      {(advancedScoring.deliveryType !== 'wide' && advancedScoring.deliveryType !== 'no_ball') ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <Button 
                  onClick={handleAdvancedScoringSubmit} 
                  variant="primary" 
                  className="flex-1"
                >
                  Confirm
                </Button>
                <Button 
                  onClick={() => setShowAdvancedScoringModal(false)} 
                  variant="outline" 
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LiveScoring;

