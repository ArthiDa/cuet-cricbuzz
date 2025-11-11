import { supabase } from '../config/supabase';

/**
 * Scoring Service - Live match scoring operations
 */

/**
 * Get current innings details with all active players
 */
export const getCurrentInnings = async (matchId) => {
  try {
    // Get match with current innings
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        *,
        team1:teams!matches_team1_id_fkey(id, name, short_name, logo),
        team2:teams!matches_team2_id_fkey(id, name, short_name, logo),
        innings!inner(
          *,
          batting_team:teams!innings_batting_team_id_fkey(id, name, short_name, logo),
          bowling_team:teams!innings_bowling_team_id_fkey(id, name, short_name, logo)
        )
      `)
      .eq('id', matchId)
      .single();
    
    if (matchError) throw matchError;
    
    // Get current innings (the one in progress)
    const currentInnings = match.innings.find(i => i.status === 'in_progress') || match.innings[match.innings.length - 1];
    
    // Get ALL batsmen (including out batsmen for display)
    const { data: batsmen, error: batsmenError } = await supabase
      .from('batting_innings')
      .select(`
        *,
        player:players!batting_innings_player_id_fkey(id, name, role, jersey_number)
      `)
      .eq('innings_id', currentInnings.id)
      .order('batting_position', { ascending: true });
    
    if (batsmenError) throw batsmenError;
    
    // Get current bowler
    const { data: bowler, error: bowlerError } = await supabase
      .from('bowling_innings')
      .select(`
        *,
        player:players!bowling_innings_player_id_fkey(id, name, role, jersey_number)
      `)
      .eq('innings_id', currentInnings.id)
      .eq('is_current_bowler', true)
      .single();
    
    // Get current partnership
    const { data: partnership } = await supabase
      .from('partnerships')
      .select('*')
      .eq('innings_id', currentInnings.id)
      .eq('is_current', true)
      .single();
    
    // Get recent balls (last 12 balls)
    const { data: recentBalls } = await supabase
      .from('balls')
      .select('*')
      .eq('innings_id', currentInnings.id)
      .order('created_at', { ascending: false })
      .limit(12);
    
    return {
      data: {
        match,
        innings: currentInnings,
        batsmen: batsmen || [],
        bowler: bowlerError ? null : bowler,
        partnership: partnership || null,
        recentBalls: recentBalls || []
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching current innings:', error);
    return { data: null, error };
  }
};

/**
 * Initialize innings - Select opening batsmen and bowler
 */
export const initializeInnings = async (inningsId, batsman1Id, batsman2Id, bowlerId) => {
  try {
    // Create batting records for both batsmen
    const { data: batsmen, error: batsmenError } = await supabase
      .from('batting_innings')
      .insert([
        {
          innings_id: inningsId,
          player_id: batsman1Id,
          batting_position: 1,
          is_on_strike: true
        },
        {
          innings_id: inningsId,
          player_id: batsman2Id,
          batting_position: 2,
          is_on_strike: false
        }
      ])
      .select();
    
    if (batsmenError) throw batsmenError;
    
    // Create bowling record
    const { data: bowler, error: bowlerError } = await supabase
      .from('bowling_innings')
      .insert([
        {
          innings_id: inningsId,
          player_id: bowlerId,
          is_current_bowler: true
        }
      ])
      .select()
      .single();
    
    if (bowlerError) throw bowlerError;
    
    // Create partnership
    const { data: partnership, error: partnershipError } = await supabase
      .from('partnerships')
      .insert([
        {
          innings_id: inningsId,
          batsman1_id: batsman1Id,
          batsman2_id: batsman2Id,
          wicket_number: 1,
          is_current: true
        }
      ])
      .select()
      .single();
    
    if (partnershipError) throw partnershipError;
    
    return { data: { batsmen, bowler, partnership }, error: null };
  } catch (error) {
    console.error('Error initializing innings:', error);
    return { data: null, error };
  }
};

/**
 * Record a ball
 */
export const recordBall = async (ballData) => {
  try {
    const {
      inningsId,
      batsmanId,
      bowlerId,
      nonStrikerId,
      runs,
      extras = 0,
      extraType = null,
      isWicket = false,
      wicketType = null,
      fielderId = null,
      physicalRuns = null // How many times batsmen actually crossed (for strike rotation)
    } = ballData;
    
    // Get current innings data
    const { data: innings, error: inningsError } = await supabase
      .from('innings')
      .select('*')
      .eq('id', inningsId)
      .single();
    
    if (inningsError) throw inningsError;
    
    // Calculate over and ball number
    const totalBalls = innings.total_balls || 0;
    const overNumber = Math.floor(totalBalls / 6) + 1;
    const ballNumber = (totalBalls % 6) + 1;
    
    // Calculate total runs for team score
    const totalRuns = runs + extras;
    
    // Calculate if strike should rotate (based on physical runs between wickets)
    // If physicalRuns is provided, use it; otherwise default to runs scored by batsman
    const runsForStrikeRotation = physicalRuns !== null ? physicalRuns : runs;
    const shouldRotateStrike = !isWicket && (runsForStrikeRotation % 2 !== 0);
    
    // Save action state for undo
    const { error: historyError } = await supabase
      .from('action_history')
      .insert([
        {
          match_id: innings.match_id,
          innings_id: inningsId,
          action_type: isWicket ? 'wicket' : 'ball',
          state_before: {
            innings,
            runs,
            extras,
            isWicket,
            batsmanId,
            bowlerId
          },
          action_data: ballData
        }
      ]);
    
    // Record the ball
    const { data: ball, error: ballError } = await supabase
      .from('balls')
      .insert([
        {
          innings_id: inningsId,
          over_number: overNumber,
          ball_number: ballNumber,
          batsman_id: batsmanId,
          bowler_id: bowlerId,
          non_striker_id: nonStrikerId,
          runs_scored: runs,
          extras,
          extra_type: extraType,
          is_wicket: isWicket,
          wicket_type: wicketType,
          fielder_id: fielderId,
          is_boundary: runs === 4 || runs === 6,
          total_runs: innings.total_runs + totalRuns,
          total_wickets: innings.total_wickets + (isWicket ? 1 : 0)
        }
      ])
      .select()
      .single();
    
    if (ballError) throw ballError;
    
    // Get current batsman stats
    const { data: batsmanBefore } = await supabase
      .from('batting_innings')
      .select('runs_scored, balls_faced, fours, sixes')
      .eq('innings_id', inningsId)
      .eq('player_id', batsmanId)
      .single();
    
    // Update batsman stats
    // Only count as ball faced if delivery is legal (not wide or no-ball)
    const countsAsBallFaced = !['wide', 'no_ball', 'no_ball_bye', 'no_ball_leg_bye'].includes(extraType);
    
    const newRuns = batsmanBefore.runs_scored + runs;
    const newBalls = countsAsBallFaced ? batsmanBefore.balls_faced + 1 : batsmanBefore.balls_faced;
    const newFours = runs === 4 ? batsmanBefore.fours + 1 : batsmanBefore.fours;
    const newSixes = runs === 6 ? batsmanBefore.sixes + 1 : batsmanBefore.sixes;
    const newStrikeRate = newBalls > 0 ? (newRuns / newBalls) * 100 : 0;
    
    const { error: batsmanUpdateError } = await supabase
      .from('batting_innings')
      .update({
        runs_scored: newRuns,
        balls_faced: newBalls,
        fours: newFours,
        sixes: newSixes,
        strike_rate: newStrikeRate,
        is_out: isWicket,
        dismissal_type: isWicket ? wicketType : null,
        bowler_id: isWicket ? bowlerId : null,
        fielder_id: isWicket && fielderId ? fielderId : null
      })
      .eq('innings_id', inningsId)
      .eq('player_id', batsmanId);
    
    if (batsmanUpdateError) throw batsmanUpdateError;
    
    // Update bowler stats (only if not a wide or no-ball)
    const countAsBall = !['wide', 'no_ball', 'no_ball_bye', 'no_ball_leg_bye'].includes(extraType);
    
    // Get current bowler stats
    const { data: bowlerBefore } = await supabase
      .from('bowling_innings')
      .select('balls_bowled, runs_conceded, wickets_taken')
      .eq('innings_id', inningsId)
      .eq('player_id', bowlerId)
      .single();
    
    if (countAsBall) {
      const newBallsBowled = bowlerBefore.balls_bowled + 1;
      const newRunsConceded = bowlerBefore.runs_conceded + totalRuns;
      const newWickets = isWicket ? bowlerBefore.wickets_taken + 1 : bowlerBefore.wickets_taken;
      const overs = Math.floor(newBallsBowled / 6) + (newBallsBowled % 6) / 10;
      const economy = overs > 0 ? newRunsConceded / overs : 0;
      
      const { error: bowlerUpdateError } = await supabase
        .from('bowling_innings')
        .update({
          balls_bowled: newBallsBowled,
          runs_conceded: newRunsConceded,
          wickets_taken: newWickets,
          overs_bowled: overs,
          economy_rate: economy
        })
        .eq('innings_id', inningsId)
        .eq('player_id', bowlerId);
      
      if (bowlerUpdateError) throw bowlerUpdateError;
    } else {
      // For extras, only update runs and economy
      const newRunsConceded = bowlerBefore.runs_conceded + totalRuns;
      const overs = Math.floor(bowlerBefore.balls_bowled / 6) + (bowlerBefore.balls_bowled % 6) / 10;
      const economy = overs > 0 ? newRunsConceded / overs : 0;
      
      await supabase
        .from('bowling_innings')
        .update({
          runs_conceded: newRunsConceded,
          economy_rate: economy
        })
        .eq('innings_id', inningsId)
        .eq('player_id', bowlerId);
    }
    
    // Update innings totals
    const newTotalBalls = countAsBall ? totalBalls + 1 : totalBalls;
    const newOvers = Math.floor(newTotalBalls / 6) + (newTotalBalls % 6) / 10;
    const newTotalRuns = innings.total_runs + totalRuns;
    const runRate = newOvers > 0 ? newTotalRuns / newOvers : 0;
    
    // Calculate extra type increments
    let widesInc = 0, noBallsInc = 0, byesInc = 0, legByesInc = 0;
    
    if (extraType === 'wide') {
      widesInc = 1;
    } else if (extraType === 'no_ball') {
      noBallsInc = 1;
    } else if (extraType === 'bye') {
      byesInc = extras;
    } else if (extraType === 'leg_bye') {
      legByesInc = extras;
    } else if (extraType === 'no_ball_bye') {
      noBallsInc = 1;
      byesInc = extras - 1; // Subtract the no-ball extra
    } else if (extraType === 'no_ball_leg_bye') {
      noBallsInc = 1;
      legByesInc = extras - 1; // Subtract the no-ball extra
    }
    
    const { error: inningsUpdateError } = await supabase
      .from('innings')
      .update({
        total_runs: newTotalRuns,
        total_wickets: innings.total_wickets + (isWicket ? 1 : 0),
        total_balls: newTotalBalls,
        total_overs: newOvers,
        extras: innings.extras + extras,
        wides: innings.wides + widesInc,
        no_balls: innings.no_balls + noBallsInc,
        byes: innings.byes + byesInc,
        leg_byes: innings.leg_byes + legByesInc,
        run_rate: runRate
      })
      .eq('id', inningsId);
    
    if (inningsUpdateError) throw inningsUpdateError;
    
    // Update partnership
    const { data: currentPartnership } = await supabase
      .from('partnerships')
      .select('runs_scored, balls_faced')
      .eq('innings_id', inningsId)
      .eq('is_current', true)
      .single();
    
    if (currentPartnership) {
      const { error: partnershipError } = await supabase
        .from('partnerships')
        .update({
          runs_scored: currentPartnership.runs_scored + totalRuns,
          balls_faced: countAsBall ? currentPartnership.balls_faced + 1 : currentPartnership.balls_faced
        })
        .eq('innings_id', inningsId)
        .eq('is_current', true);
      
      if (partnershipError) throw partnershipError;
    }
    
    // Rotate strike if needed
    if (shouldRotateStrike) {
      // Get current batsmen
      const { data: currentBatsmen } = await supabase
        .from('batting_innings')
        .select('id, is_on_strike')
        .eq('innings_id', inningsId)
        .eq('is_out', false);
      
      if (currentBatsmen && currentBatsmen.length === 2) {
        // Find striker and non-striker
        const striker = currentBatsmen.find(b => b.is_on_strike);
        const nonStriker = currentBatsmen.find(b => !b.is_on_strike);
        
        if (striker && nonStriker) {
          // Swap the strike explicitly
          await supabase
            .from('batting_innings')
            .update({ is_on_strike: false })
            .eq('id', striker.id);
          
          await supabase
            .from('batting_innings')
            .update({ is_on_strike: true })
            .eq('id', nonStriker.id);
        }
      }
    }
    
    // If wicket, end current partnership
    if (isWicket) {
      await supabase
        .from('partnerships')
        .update({ is_current: false, ended_at: new Date().toISOString() })
        .eq('innings_id', inningsId)
        .eq('is_current', true);
    }
    
    return { data: ball, error: null };
  } catch (error) {
    console.error('Error recording ball:', error);
    return { data: null, error };
  }
};

/**
 * Add new batsman (after wicket)
 */
export const addNewBatsman = async (inningsId, playerId) => {
  try {
    // Get current batting position
    const { data: batsmen } = await supabase
      .from('batting_innings')
      .select('batting_position')
      .eq('innings_id', inningsId)
      .order('batting_position', { ascending: false })
      .limit(1);
    
    const nextPosition = batsmen && batsmen.length > 0 ? batsmen[0].batting_position + 1 : 3;
    
    // Set other batsman (non-out) to non-striker first
    await supabase
      .from('batting_innings')
      .update({ is_on_strike: false })
      .eq('innings_id', inningsId)
      .eq('is_out', false);
    
    // Add new batsman (on strike)
    const { data, error } = await supabase
      .from('batting_innings')
      .insert([
        {
          innings_id: inningsId,
          player_id: playerId,
          batting_position: nextPosition,
          is_on_strike: true // New batsman comes on strike
        }
      ])
      .select()
      .single();
    
    if (error) throw error;
    
    // Create new partnership
    const { data: otherBatsman } = await supabase
      .from('batting_innings')
      .select('player_id')
      .eq('innings_id', inningsId)
      .eq('is_out', false)
      .neq('player_id', playerId)
      .single();
    
    if (otherBatsman) {
      const { data: innings } = await supabase
        .from('innings')
        .select('total_wickets')
        .eq('id', inningsId)
        .single();
      
      await supabase
        .from('partnerships')
        .insert([
          {
            innings_id: inningsId,
            batsman1_id: playerId,
            batsman2_id: otherBatsman.player_id,
            wicket_number: innings.total_wickets + 1,
            is_current: true
          }
        ]);
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error adding new batsman:', error);
    return { data: null, error };
  }
};

/**
 * Change bowler
 */
export const changeBowler = async (inningsId, newBowlerId) => {
  try {
    // Set current bowler to false
    await supabase
      .from('bowling_innings')
      .update({ is_current_bowler: false })
      .eq('innings_id', inningsId)
      .eq('is_current_bowler', true);
    
    // Check if new bowler already has a record
    const { data: existingBowler } = await supabase
      .from('bowling_innings')
      .select('*')
      .eq('innings_id', inningsId)
      .eq('player_id', newBowlerId)
      .single();
    
    if (existingBowler) {
      // Update existing record
      const { data, error } = await supabase
        .from('bowling_innings')
        .update({ is_current_bowler: true })
        .eq('id', existingBowler.id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } else {
      // Create new bowling record
      const { data, error } = await supabase
        .from('bowling_innings')
        .insert([
          {
            innings_id: inningsId,
            player_id: newBowlerId,
            is_current_bowler: true
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    }
  } catch (error) {
    console.error('Error changing bowler:', error);
    return { data: null, error };
  }
};

/**
 * Switch strike (swap batsmen)
 */
export const switchStrike = async (inningsId) => {
  try {
    // Get current batsmen
    const { data: currentBatsmen, error: fetchError } = await supabase
      .from('batting_innings')
      .select('id, is_on_strike')
      .eq('innings_id', inningsId)
      .eq('is_out', false);
    
    if (fetchError) throw fetchError;
    
    if (!currentBatsmen || currentBatsmen.length !== 2) {
      throw new Error('Expected exactly 2 batsmen');
    }
    
    // Find striker and non-striker
    const striker = currentBatsmen.find(b => b.is_on_strike);
    const nonStriker = currentBatsmen.find(b => !b.is_on_strike);
    
    // If both have same strike status, fix it
    if (!striker || !nonStriker) {
      console.warn('Both batsmen have same strike status, fixing...');
      // Set first one as striker, second as non-striker
      await supabase
        .from('batting_innings')
        .update({ is_on_strike: true })
        .eq('id', currentBatsmen[0].id);
      
      await supabase
        .from('batting_innings')
        .update({ is_on_strike: false })
        .eq('id', currentBatsmen[1].id);
      
      return { data: true, error: null };
    }
    
    // Swap the strike
    await supabase
      .from('batting_innings')
      .update({ is_on_strike: false })
      .eq('id', striker.id);
    
    await supabase
      .from('batting_innings')
      .update({ is_on_strike: true })
      .eq('id', nonStriker.id);
    
    return { data: true, error: null };
  } catch (error) {
    console.error('Error switching strike:', error);
    return { data: null, error };
  }
};

/**
 * End innings and optionally start next innings
 */
export const endInnings = async (matchId, inningsId) => {
  try {
    // Update innings status
    await supabase
      .from('innings')
      .update({ status: 'completed', ended_at: new Date().toISOString() })
      .eq('id', inningsId);
    
    // Get match and first innings details
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('current_inning, team1_id, team2_id, overs_per_side')
      .eq('id', matchId)
      .single();
    
    if (matchError) throw matchError;
    
    if (!match) {
      throw new Error('Match not found');
    }
    
    // Get the completed innings to determine teams
    const { data: completedInnings } = await supabase
      .from('innings')
      .select('batting_team_id, bowling_team_id')
      .eq('id', inningsId)
      .single();
    
    if (match.current_inning === 1) {
      // Swap teams for second innings (batting team becomes bowling team and vice versa)
      const newBattingTeam = completedInnings.bowling_team_id;
      const newBowlingTeam = completedInnings.batting_team_id;
      
      // Update match to second innings
      await supabase
        .from('matches')
        .update({
          current_inning: 2
        })
        .eq('id', matchId);
      
      // Create second innings
      const { data: newInning, error: inningError } = await supabase
        .from('innings')
        .insert({
          match_id: matchId,
          inning_number: 2,
          batting_team_id: newBattingTeam,
          bowling_team_id: newBowlingTeam,
          status: 'in_progress'
        })
        .select()
        .single();
      
      if (inningError) throw inningError;
      
      return { data: { nextInning: 2, inningsId: newInning.id }, error: null };
    } else {
      // Match complete - calculate winner
      await calculateMatchWinner(matchId);
      return { data: { matchComplete: true }, error: null };
    }
  } catch (error) {
    console.error('Error ending innings:', error);
    return { data: null, error };
  }
};

/**
 * Calculate match winner
 */
const calculateMatchWinner = async (matchId) => {
  try {
    // Get both innings
    const { data: innings } = await supabase
      .from('innings')
      .select('*')
      .eq('match_id', matchId)
      .order('inning_number', { ascending: true });
    
    // If we don't have 2 innings, just mark as completed without winner
    if (!innings || innings.length < 2) {
      await supabase
        .from('matches')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', matchId);
      return;
    }
    
    const firstInnings = innings[0];
    const secondInnings = innings[1];
    
    let winnerId = null;
    let resultType = '';
    let resultMargin = null;
    let resultText = '';
    
    if (secondInnings.total_runs > firstInnings.total_runs) {
      // Team 2 wins
      winnerId = secondInnings.batting_team_id;
      const wicketsRemaining = 10 - secondInnings.total_wickets;
      resultType = 'won by wickets';
      resultMargin = wicketsRemaining;
      resultText = `by ${wicketsRemaining} wickets`;
    } else if (firstInnings.total_runs > secondInnings.total_runs) {
      // Team 1 wins
      winnerId = firstInnings.batting_team_id;
      const runsMargin = firstInnings.total_runs - secondInnings.total_runs;
      resultType = 'won by runs';
      resultMargin = runsMargin;
      resultText = `by ${runsMargin} runs`;
    } else {
      // Tie
      resultType = 'tied';
      resultMargin = 0;
      resultText = 'Match Tied';
    }
    
    // Update match with winner
    await supabase
      .from('matches')
      .update({
        status: 'completed',
        winner_id: winnerId,
        result_type: resultType,
        result_margin: resultMargin,
        result_text: resultText,
        ended_at: new Date().toISOString()
      })
      .eq('id', matchId);
  } catch (error) {
    console.error('Error calculating winner:', error);
  }
};

/**
 * End match (manual end)
 */
export const endMatch = async (matchId) => {
  try {
    // End all active innings
    await supabase
      .from('innings')
      .update({ status: 'completed', ended_at: new Date().toISOString() })
      .eq('match_id', matchId)
      .eq('status', 'in_progress');
    
    // Calculate winner and update match status
    await calculateMatchWinner(matchId);
    
    return { data: true, error: null };
  } catch (error) {
    console.error('Error ending match:', error);
    return { data: null, error };
  }
};

/**
 * Undo last action
 */
export const undoLastAction = async (inningsId) => {
  try {
    // Get the last action for this innings
    const { data: lastAction, error: actionError } = await supabase
      .from('action_history')
      .select('*')
      .eq('innings_id', inningsId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (actionError || !lastAction) {
      return { data: null, error: { message: 'No action to undo' } };
    }
    
    // Get the last ball record
    const { data: lastBall, error: ballError } = await supabase
      .from('balls')
      .select('*')
      .eq('innings_id', inningsId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (ballError || !lastBall) {
      return { data: null, error: { message: 'No ball to undo' } };
    }
    
    // Get current innings
    const { data: innings, error: inningsError } = await supabase
      .from('innings')
      .select('*')
      .eq('id', inningsId)
      .single();
    
    if (inningsError) throw inningsError;
    
    const totalRuns = lastBall.runs_scored + lastBall.extras;
    const wasWicket = lastBall.is_wicket;
    const extraType = lastBall.extra_type;
    
    // Determine if ball counts toward over
    const countAsBall = !['wide', 'no_ball', 'no_ball_bye', 'no_ball_leg_bye'].includes(extraType);
    const countsAsBallFaced = !['wide', 'no_ball', 'no_ball_bye', 'no_ball_leg_bye'].includes(extraType);
    
    // 1. Reverse batsman stats
    const { data: batsman, error: batsmanFetchError } = await supabase
      .from('batting_innings')
      .select('*')
      .eq('innings_id', inningsId)
      .eq('player_id', lastBall.batsman_id)
      .single();
    
    if (batsmanFetchError) throw batsmanFetchError;
    
    const newRuns = batsman.runs_scored - lastBall.runs_scored;
    const newBalls = countsAsBallFaced ? batsman.balls_faced - 1 : batsman.balls_faced;
    const newFours = lastBall.runs_scored === 4 ? batsman.fours - 1 : batsman.fours;
    const newSixes = lastBall.runs_scored === 6 ? batsman.sixes - 1 : batsman.sixes;
    const newStrikeRate = newBalls > 0 ? (newRuns / newBalls) * 100 : 0;
    
    await supabase
      .from('batting_innings')
      .update({
        runs_scored: newRuns,
        balls_faced: newBalls,
        fours: newFours,
        sixes: newSixes,
        strike_rate: newStrikeRate,
        is_out: wasWicket ? false : batsman.is_out,
        dismissal_type: wasWicket ? null : batsman.dismissal_type,
        bowler_id: wasWicket ? null : batsman.bowler_id,
        fielder_id: wasWicket ? null : batsman.fielder_id
      })
      .eq('id', batsman.id);
    
    // 2. Reverse bowler stats
    const { data: bowler, error: bowlerFetchError } = await supabase
      .from('bowling_innings')
      .select('*')
      .eq('innings_id', inningsId)
      .eq('player_id', lastBall.bowler_id)
      .single();
    
    if (bowlerFetchError) throw bowlerFetchError;
    
    if (countAsBall) {
      const newBallsBowled = bowler.balls_bowled - 1;
      const newRunsConceded = bowler.runs_conceded - totalRuns;
      const newWickets = wasWicket ? bowler.wickets_taken - 1 : bowler.wickets_taken;
      const overs = newBallsBowled > 0 ? Math.floor(newBallsBowled / 6) + (newBallsBowled % 6) / 10 : 0;
      const economy = overs > 0 ? newRunsConceded / overs : 0;
      
      await supabase
        .from('bowling_innings')
        .update({
          balls_bowled: newBallsBowled,
          runs_conceded: newRunsConceded,
          wickets_taken: newWickets,
          overs_bowled: overs,
          economy_rate: economy
        })
        .eq('id', bowler.id);
    } else {
      // For extras, only reverse runs
      const newRunsConceded = bowler.runs_conceded - totalRuns;
      const overs = bowler.balls_bowled > 0 ? Math.floor(bowler.balls_bowled / 6) + (bowler.balls_bowled % 6) / 10 : 0;
      const economy = overs > 0 ? newRunsConceded / overs : 0;
      
      await supabase
        .from('bowling_innings')
        .update({
          runs_conceded: newRunsConceded,
          economy_rate: economy
        })
        .eq('id', bowler.id);
    }
    
    // 3. Reverse innings totals
    const newTotalBalls = countAsBall ? innings.total_balls - 1 : innings.total_balls;
    const newOvers = newTotalBalls > 0 ? Math.floor(newTotalBalls / 6) + (newTotalBalls % 6) / 10 : 0;
    const newTotalRuns = innings.total_runs - totalRuns;
    const runRate = newOvers > 0 ? newTotalRuns / newOvers : 0;
    
    // Calculate extra type decrements
    let widesInc = 0, noBallsInc = 0, byesInc = 0, legByesInc = 0;
    
    if (extraType === 'wide') {
      widesInc = 1;
    } else if (extraType === 'no_ball') {
      noBallsInc = 1;
    } else if (extraType === 'bye') {
      byesInc = lastBall.extras;
    } else if (extraType === 'leg_bye') {
      legByesInc = lastBall.extras;
    } else if (extraType === 'no_ball_bye') {
      noBallsInc = 1;
      byesInc = lastBall.extras - 1;
    } else if (extraType === 'no_ball_leg_bye') {
      noBallsInc = 1;
      legByesInc = lastBall.extras - 1;
    }
    
    await supabase
      .from('innings')
      .update({
        total_runs: newTotalRuns,
        total_wickets: wasWicket ? innings.total_wickets - 1 : innings.total_wickets,
        total_balls: newTotalBalls,
        total_overs: newOvers,
        extras: innings.extras - lastBall.extras,
        wides: innings.wides - widesInc,
        no_balls: innings.no_balls - noBallsInc,
        byes: innings.byes - byesInc,
        leg_byes: innings.leg_byes - legByesInc,
        run_rate: runRate
      })
      .eq('id', inningsId);
    
    // 4. Reverse partnership
    const { data: currentPartnership } = await supabase
      .from('partnerships')
      .select('*')
      .eq('innings_id', inningsId)
      .eq('is_current', true)
      .single();
    
    if (currentPartnership) {
      const newPartnershipRuns = currentPartnership.runs_scored - totalRuns;
      const newPartnershipBalls = countAsBall ? currentPartnership.balls_faced - 1 : currentPartnership.balls_faced;
      
      await supabase
        .from('partnerships')
        .update({
          runs_scored: newPartnershipRuns,
          balls_faced: newPartnershipBalls
        })
        .eq('id', currentPartnership.id);
    }
    
    // 5. If it was a wicket, restore the previous partnership
    if (wasWicket) {
      // Find the partnership that was ended
      const { data: endedPartnership } = await supabase
        .from('partnerships')
        .select('*')
        .eq('innings_id', inningsId)
        .eq('is_current', false)
        .order('ended_at', { ascending: false })
        .limit(1)
        .single();
      
      if (endedPartnership) {
        // Delete the current partnership (it was created after the wicket)
        if (currentPartnership) {
          await supabase
            .from('partnerships')
            .delete()
            .eq('id', currentPartnership.id);
        }
        
        // Restore the previous partnership
        await supabase
          .from('partnerships')
          .update({
            is_current: true,
            ended_at: null
          })
          .eq('id', endedPartnership.id);
        
        // Remove the new batsman that was added after the wicket
        await supabase
          .from('batting_innings')
          .delete()
          .eq('innings_id', inningsId)
          .eq('player_id', currentPartnership.batsman1_id)
          .neq('player_id', endedPartnership.batsman1_id)
          .neq('player_id', endedPartnership.batsman2_id);
        
        await supabase
          .from('batting_innings')
          .delete()
          .eq('innings_id', inningsId)
          .eq('player_id', currentPartnership.batsman2_id)
          .neq('player_id', endedPartnership.batsman1_id)
          .neq('player_id', endedPartnership.batsman2_id);
      }
    }
    
    // 6. Reverse strike rotation if needed
    // Get the action data to see if strike was rotated
    const actionData = lastAction.action_data || {};
    if (actionData.physicalRuns !== undefined && actionData.physicalRuns !== null) {
      const shouldHaveRotated = actionData.physicalRuns % 2 !== 0;
      if (shouldHaveRotated && !wasWicket) {
        // Reverse the strike rotation
        const { data: currentBatsmen } = await supabase
          .from('batting_innings')
          .select('id, is_on_strike')
          .eq('innings_id', inningsId)
          .eq('is_out', false);
        
        if (currentBatsmen && currentBatsmen.length === 2) {
          const striker = currentBatsmen.find(b => b.is_on_strike);
          const nonStriker = currentBatsmen.find(b => !b.is_on_strike);
          
          if (striker && nonStriker) {
            await supabase
              .from('batting_innings')
              .update({ is_on_strike: false })
              .eq('id', striker.id);
            
            await supabase
              .from('batting_innings')
              .update({ is_on_strike: true })
              .eq('id', nonStriker.id);
          }
        }
      }
    }
    
    // 7. Delete the ball record
    await supabase
      .from('balls')
      .delete()
      .eq('id', lastBall.id);
    
    // 8. Delete the action history record
    await supabase
      .from('action_history')
      .delete()
      .eq('id', lastAction.id);
    
    return { data: true, error: null };
  } catch (error) {
    console.error('Error undoing action:', error);
    return { data: null, error };
  }
};

/**
 * Subscribe to innings updates (Real-time)
 */
export const subscribeToInnings = (inningsId, callback) => {
  const subscription = supabase
    .channel(`innings_${inningsId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'innings',
        filter: `id=eq.${inningsId}`
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'balls',
        filter: `innings_id=eq.${inningsId}`
      },
      callback
    )
    .subscribe();
  
  return subscription;
};

