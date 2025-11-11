import { useState, useEffect } from 'react';
import { getAllTeams, createTeam, updateTeam, deleteTeam } from '../../services/teamService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const ManageTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    logo: '🏏'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch teams on component mount
  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    setError('');
    const { data, error } = await getAllTeams();
    if (error) {
      setError('Failed to load teams: ' + error.message);
    } else {
      setTeams(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (editingId) {
      // Update existing team
      const { data, error } = await updateTeam(editingId, formData);
      
      if (error) {
        setError('Failed to update team: ' + error.message);
      } else {
        setSuccess('Team updated successfully!');
        setFormData({ name: '', shortName: '', logo: '🏏' });
        setShowForm(false);
        setEditingId(null);
        fetchTeams();
        setTimeout(() => setSuccess(''), 3000);
      }
    } else {
      // Create new team
      const { data, error } = await createTeam(formData);
      
      if (error) {
        setError('Failed to create team: ' + error.message);
      } else {
        setSuccess('Team created successfully!');
        setFormData({ name: '', shortName: '', logo: '🏏' });
        setShowForm(false);
        fetchTeams();
        setTimeout(() => setSuccess(''), 3000);
      }
    }
  };

  const handleEdit = (team) => {
    setFormData({
      name: team.name,
      shortName: team.short_name,
      logo: team.logo || '🏏'
    });
    setEditingId(team.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setFormData({ name: '', shortName: '', logo: '🏏' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleDelete = async (teamId) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    
    setError('');
    const { error } = await deleteTeam(teamId);
    
    if (error) {
      setError('Failed to delete team: ' + error.message);
    } else {
      setSuccess('Team deleted successfully!');
      fetchTeams(); // Refresh the list
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">Manage Teams</h1>
          <p className="text-sm sm:text-base text-gray-600">Create, edit, and delete tournament teams</p>
        </div>
        <Button onClick={() => showForm ? handleCancelEdit() : setShowForm(true)} className="w-full sm:w-auto">
          {showForm ? 'Cancel' : '+ Add Team'}
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

      {/* Add/Edit Team Form */}
      {showForm && (
        <Card className="mb-6">
          <h2 className="text-lg sm:text-xl font-bold mb-4">
            {editingId ? 'Edit Team' : 'Create New Team'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Team Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Thunder Strikers"
                required
              />
              <Input
                label="Short Name"
                value={formData.shortName}
                onChange={(e) => setFormData({...formData, shortName: e.target.value})}
                placeholder="e.g., TS"
                required
              />
              <Input
                label="Team Logo (Emoji)"
                value={formData.logo}
                onChange={(e) => setFormData({...formData, logo: e.target.value})}
                placeholder="🏏"
                required
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button type="submit" className="w-full sm:w-auto">
                {editingId ? 'Update Team' : 'Create Team'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancelEdit} className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Teams List */}
      <Card>
        <h2 className="text-lg sm:text-xl font-bold mb-4">All Teams ({teams.length})</h2>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading teams...</div>
        ) : teams.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
            No teams added yet. Click "+ Add Team" to create one.
          </div>
        ) : (
          <div className="space-y-4">
          {teams.map(team => (
            <div key={team.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow gap-4">
              {/* Team Info */}
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="text-3xl sm:text-4xl">{team.logo}</div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">{team.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{team.short_name}</p>
                </div>
              </div>
              
              {/* Stats & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                {/* Stats */}
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-center">
                    <p className="text-xl sm:text-2xl font-bold text-gray-800">{team.matches_played || 0}</p>
                    <p className="text-xs text-gray-500">Played</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl sm:text-2xl font-bold text-green-600">{team.matches_won || 0}</p>
                    <p className="text-xs text-gray-500">Won</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">{team.points || 0}</p>
                    <p className="text-xs text-gray-500">Points</p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(team)} className="flex-1 sm:flex-none">
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(team.id)} className="flex-1 sm:flex-none">
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ManageTeams;

