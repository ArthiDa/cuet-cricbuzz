import { useState, useEffect } from 'react';
import { getAllPlayers, createPlayer, updatePlayer, deletePlayer } from '../../services/playerService';
import { getAllTeams } from '../../services/teamService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';

const ManagePlayers = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    teamId: '',
    role: 'Batsman',
    jerseyNumber: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch data on mount
  useEffect(() => {
    fetchPlayers();
    fetchTeams();
  }, []);

  const fetchPlayers = async () => {
    setLoading(true);
    setError('');
    const { data, error } = await getAllPlayers();
    if (error) {
      setError('Failed to load players: ' + error.message);
    } else {
      setPlayers(data || []);
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
    
    if (!formData.teamId) {
      setError('Please select a team');
      return;
    }
    
    const playerData = {
      name: formData.name,
      teamId: formData.teamId,
      role: formData.role,
      jerseyNumber: formData.jerseyNumber ? parseInt(formData.jerseyNumber) : null
    };
    
    if (editingId) {
      // Update existing player
      const { data, error } = await updatePlayer(editingId, playerData);
      
      if (error) {
        setError('Failed to update player: ' + error.message);
      } else {
        setSuccess('Player updated successfully!');
        setFormData({ name: '', teamId: '', role: 'Batsman', jerseyNumber: '' });
        setShowForm(false);
        setEditingId(null);
        fetchPlayers();
        setTimeout(() => setSuccess(''), 3000);
      }
    } else {
      // Create new player
      const { data, error } = await createPlayer(playerData);
      
      if (error) {
        setError('Failed to create player: ' + error.message);
      } else {
        setSuccess('Player created successfully!');
        setFormData({ name: '', teamId: '', role: 'Batsman', jerseyNumber: '' });
        setShowForm(false);
        fetchPlayers();
        setTimeout(() => setSuccess(''), 3000);
      }
    }
  };

  const handleEdit = (player) => {
    setFormData({
      name: player.name,
      teamId: player.team_id,
      role: player.role,
      jerseyNumber: player.jersey_number ? player.jersey_number.toString() : ''
    });
    setEditingId(player.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setFormData({ name: '', teamId: '', role: 'Batsman', jerseyNumber: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleDelete = async (playerId) => {
    if (!confirm('Are you sure you want to delete this player?')) return;
    
    setError('');
    const { error } = await deletePlayer(playerId);
    
    if (error) {
      setError('Failed to delete player: ' + error.message);
    } else {
      setSuccess('Player deleted successfully!');
      fetchPlayers();
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">Manage Players</h1>
          <p className="text-sm sm:text-base text-gray-600">Create, edit, and delete players</p>
        </div>
        <Button onClick={() => showForm ? handleCancelEdit() : setShowForm(true)} className="w-full sm:w-auto">
          {showForm ? 'Cancel' : '+ Add Player'}
        </Button>
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

      {/* Add/Edit Player Form */}
      {showForm && (
        <Card className="mb-6">
          <h2 className="text-lg sm:text-xl font-bold mb-4">
            {editingId ? 'Edit Player' : 'Create New Player'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Player Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Rahul Sharma"
                required
              />
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Team <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.teamId}
                  onChange={(e) => setFormData({...formData, teamId: e.target.value})}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-Rounder">All-Rounder</option>
                  <option value="Wicket-Keeper">Wicket-Keeper</option>
                </select>
              </div>

              <Input
                label="Jersey Number (Optional)"
                type="number"
                value={formData.jerseyNumber}
                onChange={(e) => setFormData({...formData, jerseyNumber: e.target.value})}
                placeholder="e.g., 10"
                min="1"
                max="99"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button type="submit" className="w-full sm:w-auto">
                {editingId ? 'Update Player' : 'Create Player'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancelEdit} className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Players List */}
      <Card>
        <h2 className="text-lg sm:text-xl font-bold mb-4">All Players ({players.length})</h2>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading players...</div>
        ) : players.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
            No players added yet. Click "+ Add Player" to create one.
          </div>
        ) : (
          <div className="space-y-3">
          {players.map(player => {
            return (
              <div key={player.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow gap-4">
                {/* Player Info */}
                <div className="flex-grow">
                  <h3 className="font-bold text-base sm:text-lg mb-2">{player.name}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {player.team && (
                      <span className="text-xs sm:text-sm text-gray-600">
                        {player.team.logo} {player.team.name}
                      </span>
                    )}
                    <Badge variant="default" size="sm">{player.role}</Badge>
                    {player.jersey_number && (
                      <Badge variant="info" size="sm">#{player.jersey_number}</Badge>
                    )}
                  </div>
                </div>
                
                {/* Stats & Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  {/* Stats */}
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-blue-600">{player.total_runs || 0}</p>
                      <p className="text-xs text-gray-500">Runs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-red-600">{player.total_wickets || 0}</p>
                      <p className="text-xs text-gray-500">Wickets</p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(player)} className="flex-1 sm:flex-none">
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(player.id)} className="flex-1 sm:flex-none">
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ManagePlayers;

