import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getAllMatches, 
  getArchivedMatches,
  createMatch,
  updateMatch,
  deleteMatch, 
  archiveMatch,
  unarchiveMatch,
  startMatch 
} from '../../services/matchService';
import { getAllTeams } from '../../services/teamService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';

const ManageMatches = () => {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showTossModal, setShowTossModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [tossData, setTossData] = useState({
    tossWinnerId: '',
    tossDecision: 'bat'
  });
  const [formData, setFormData] = useState({
    matchNumber: 1,
    team1Id: '',
    team2Id: '',
    venue: '',
    date: '',
    time: '',
    overs: 10
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch data on mount
  useEffect(() => {
    fetchMatches();
    fetchTeams();
  }, []);

  // Refetch when showArchived changes
  useEffect(() => {
    fetchMatches();
  }, [showArchived]);

  // Update match number when matches change
  useEffect(() => {
    if (matches.length > 0 && !showForm) {
      const maxMatchNumber = Math.max(...matches.map(m => m.match_number));
      setFormData(prev => ({ ...prev, matchNumber: maxMatchNumber + 1 }));
    }
  }, [matches, showForm]);

  const fetchMatches = async () => {
    setLoading(true);
    setError('');
    const { data, error } = showArchived 
      ? await getArchivedMatches() 
      : await getAllMatches();
    if (error) {
      setError('Failed to load matches: ' + error.message);
    } else {
      setMatches(data || []);
    }
    setLoading(false);
  };

  const fetchTeams = async () => {
    const { data, error } = await getAllTeams();
    if (error) {
      setError('Failed to load teams: ' + error.message);
    } else {
      setTeams(data || []);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (formData.team1Id === formData.team2Id) {
      setError('Please select different teams');
      return;
    }
    
    const matchData = {
      matchNumber: parseInt(formData.matchNumber),
      team1Id: formData.team1Id,
      team2Id: formData.team2Id,
      venue: formData.venue,
      date: formData.date,
      time: formData.time,
      overs: parseInt(formData.overs)
    };
    
    if (editingId) {
      // Update existing match
      const { data, error } = await updateMatch(editingId, matchData);
      
      if (error) {
        setError('Failed to update match: ' + error.message);
      } else {
        setSuccess('Match updated successfully!');
        setFormData({
          matchNumber: 1,
          team1Id: '',
          team2Id: '',
          venue: '',
          date: '',
          time: '',
          overs: 10
        });
        setShowForm(false);
        setEditingId(null);
        fetchMatches();
        setTimeout(() => setSuccess(''), 3000);
      }
    } else {
      // Create new match
      const { data, error } = await createMatch(matchData);
      
      if (error) {
        setError('Failed to create match: ' + error.message);
      } else {
        setSuccess('Match created successfully!');
        setFormData({
          matchNumber: formData.matchNumber + 1,
          team1Id: '',
          team2Id: '',
          venue: '',
          date: '',
          time: '',
          overs: 10
        });
        setShowForm(false);
        fetchMatches();
        setTimeout(() => setSuccess(''), 3000);
      }
    }
  };

  const handleEdit = (match) => {
    if (match.status !== 'upcoming') {
      setError('Only upcoming matches can be edited');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setFormData({
      matchNumber: match.match_number,
      team1Id: match.team1_id,
      team2Id: match.team2_id,
      venue: match.venue,
      date: match.match_date,
      time: match.match_time || '',
      overs: match.overs_per_side
    });
    setEditingId(match.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setFormData({
      matchNumber: 1,
      team1Id: '',
      team2Id: '',
      venue: '',
      date: '',
      time: '',
      overs: 10
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleDelete = async (matchId) => {
    if (!confirm('Are you sure you want to delete this match? This action cannot be undone.')) return;
    
    setError('');
    const { error } = await deleteMatch(matchId);
    
    if (error) {
      setError('Failed to delete match: ' + error.message);
    } else {
      setSuccess('Match deleted successfully!');
      fetchMatches();
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleArchive = async (matchId) => {
    if (!confirm('Are you sure you want to archive this match? You can restore it later from Archived Matches.')) return;
    
    setError('');
    const { error } = await archiveMatch(matchId);
    
    if (error) {
      setError('Failed to archive match: ' + error.message);
    } else {
      setSuccess('Match archived successfully!');
      fetchMatches();
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleUnarchive = async (matchId) => {
    setError('');
    const { error } = await unarchiveMatch(matchId);
    
    if (error) {
      setError('Failed to unarchive match: ' + error.message);
    } else {
      setSuccess('Match restored successfully!');
      fetchMatches();
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleStartMatch = (match) => {
    setSelectedMatch(match);
    setTossData({
      tossWinnerId: match.team1.id,
      tossDecision: 'bat'
    });
    setShowTossModal(true);
  };

  const handleTossSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowTossModal(false);
    
    const { data, error } = await startMatch(
      selectedMatch.id,
      tossData.tossWinnerId,
      tossData.tossDecision
    );
    
    if (error) {
      setError('Failed to start match: ' + error.message);
    } else {
      setSuccess('Match started successfully!');
      fetchMatches();
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">Manage Matches</h1>
          <p className="text-sm sm:text-base text-gray-600">Create, edit, and manage tournament matches</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button 
            variant={showArchived ? 'outline' : 'secondary'}
            onClick={() => setShowArchived(!showArchived)}
            className="w-full sm:w-auto"
          >
            {showArchived ? '📋 Active Matches' : '🗄️ Archived Matches'}
          </Button>
          {!showArchived && (
            <Button onClick={() => showForm ? handleCancelEdit() : setShowForm(true)} className="w-full sm:w-auto">
              {showForm ? 'Cancel' : '+ Create Match'}
            </Button>
          )}
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Create/Edit Match Form */}
      {showForm && (
        <Card className="mb-6">
          <h2 className="text-lg sm:text-xl font-bold mb-4">
            {editingId ? 'Edit Match' : 'Create New Match'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Match Number"
                type="number"
                value={formData.matchNumber}
                onChange={(e) => setFormData({...formData, matchNumber: e.target.value})}
                required
              />

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Team 1 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.team1Id}
                  onChange={(e) => setFormData({...formData, team1Id: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select Team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.logo} {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Team 2 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.team2Id}
                  onChange={(e) => setFormData({...formData, team2Id: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select Team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.logo} {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Venue"
                value={formData.venue}
                onChange={(e) => setFormData({...formData, venue: e.target.value})}
                placeholder="e.g., CUET Main Ground"
                required
              />

              <Input
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />

              <Input
                label="Time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                required
              />

              <Input
                label="Overs per side"
                type="number"
                value={formData.overs}
                onChange={(e) => setFormData({...formData, overs: e.target.value})}
                min="5"
                max="50"
                required
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button type="submit" className="w-full sm:w-auto">
                {editingId ? 'Update Match' : 'Create Match'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancelEdit} className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Matches List */}
      <Card>
        <h2 className="text-xl font-bold mb-4">
          {showArchived ? 'Archived Matches' : 'All Matches'} ({matches.length})
        </h2>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading matches...</div>
        ) : matches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {showArchived 
              ? 'No archived matches. Archive completed matches to view them here.'
              : 'No matches created yet. Click "+ Create Match" to create one.'
            }
          </div>
        ) : (
          <div className="space-y-4">
          {matches.map(match => (
            <div key={match.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
              {/* Match Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                <div>
                  <div className="flex items-center flex-wrap gap-2 sm:gap-3 mb-2">
                    <span className="font-bold text-base sm:text-lg">Match {match.match_number}</span>
                    <Badge variant={
                      match.status === 'live' ? 'live' : 
                      match.status === 'completed' ? 'success' : 'info'
                    }>
                      {match.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">
                    📍 {match.venue} • {match.match_date} {match.match_time && `at ${match.match_time}`}
                  </p>
                </div>
              </div>

              {/* Teams */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <span className="text-xl sm:text-2xl">{match.team1?.logo || '🏏'}</span>
                    <span className="font-semibold text-sm sm:text-base">{match.team1?.name}</span>
                  </div>
                  {match.innings && match.innings[0] && (
                    <span className="font-bold text-sm sm:text-lg">
                      {match.innings[0].total_runs}/{match.innings[0].total_wickets} ({match.innings[0].total_overs})
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <span className="text-xl sm:text-2xl">{match.team2?.logo || '🏏'}</span>
                    <span className="font-semibold text-sm sm:text-base">{match.team2?.name}</span>
                  </div>
                  {match.innings && match.innings[1] && (
                    <span className="font-bold text-sm sm:text-lg">
                      {match.innings[1].total_runs}/{match.innings[1].total_wickets} ({match.innings[1].total_overs})
                    </span>
                  )}
                </div>
              </div>

              {/* Result */}
              {match.result_text && (
                <p className="text-green-700 font-semibold mb-3 text-center py-2 bg-green-50 rounded text-sm">
                  {match.winner?.name} {match.result_text}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-end">
                {!showArchived && (
                  <>
                    {match.status === 'upcoming' && (
                      <>
                        <Button size="sm" variant="primary" onClick={() => handleStartMatch(match)} className="flex-1 sm:flex-none">
                          Start Match
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(match)} className="flex-1 sm:flex-none">
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(match.id)} className="flex-1 sm:flex-none">
                          Delete
                        </Button>
                      </>
                    )}
                    {match.status === 'live' && (
                      <>
                        <Link to={`/admin/matches/${match.id}/score`} className="flex-1 sm:flex-none">
                          <Button size="sm" variant="primary" className="w-full">Score Match</Button>
                        </Link>
                        <Button size="sm" variant="secondary" onClick={() => handleArchive(match.id)} className="flex-1 sm:flex-none">
                          Archive
                        </Button>
                      </>
                    )}
                    {match.status === 'completed' && (
                      <Button size="sm" variant="secondary" onClick={() => handleArchive(match.id)} className="flex-1 sm:flex-none">
                        Archive
                      </Button>
                    )}
                  </>
                )}
                {showArchived && (
                  <Button size="sm" variant="primary" onClick={() => handleUnarchive(match.id)} className="w-full sm:w-auto">
                    Restore
                  </Button>
                )}
              </div>
            </div>
          ))}
          </div>
        )}
      </Card>

      {/* Toss Modal */}
      {showTossModal && selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Start Match - Toss Details</h3>
            <p className="text-gray-600 mb-4">
              {selectedMatch.team1.name} vs {selectedMatch.team2.name}
            </p>
            
            <form onSubmit={handleTossSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Toss Winner <span className="text-red-500">*</span>
                </label>
                <select
                  value={tossData.tossWinnerId}
                  onChange={(e) => setTossData({...tossData, tossWinnerId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value={selectedMatch.team1.id}>
                    {selectedMatch.team1.logo} {selectedMatch.team1.name}
                  </option>
                  <option value={selectedMatch.team2.id}>
                    {selectedMatch.team2.logo} {selectedMatch.team2.name}
                  </option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Decision <span className="text-red-500">*</span>
                </label>
                <select
                  value={tossData.tossDecision}
                  onChange={(e) => setTossData({...tossData, tossDecision: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="bat">Chose to Bat</option>
                  <option value="field">Chose to Field</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <Button type="submit" variant="primary" className="flex-1">
                  Start Match
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowTossModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ManageMatches;

