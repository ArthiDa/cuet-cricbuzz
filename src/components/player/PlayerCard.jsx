import { Link } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';

const PlayerCard = ({ player }) => {
  const getRoleBadge = (role) => {
    const variants = {
      'Batsman': 'success',
      'Bowler': 'info',
      'All-Rounder': 'warning',
      'Wicket-Keeper': 'danger'
    };
    return <Badge variant={variants[role] || 'default'}>{role}</Badge>;
  };

  return (
    <Link to={`/players/${player.id}`}>
      <Card hover>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg text-gray-800">{player.name}</h3>
              <p className="text-sm text-gray-500">
                {player.team?.logo || '🏏'} {player.team?.shortName || player.team?.name || 'Unknown Team'}
              </p>
            </div>
            {getRoleBadge(player.role)}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{player.runs || 0}</p>
              <p className="text-xs text-gray-600">Runs</p>
            </div>
            <div className="text-center p-2 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{player.wickets || 0}</p>
              <p className="text-xs text-gray-600">Wickets</p>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <p className="text-xl font-bold text-green-600">{player.fours || 0}/{player.sixes || 0}</p>
              <p className="text-xs text-gray-600">4s/6s</p>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded-lg">
              <p className="text-xl font-bold text-purple-600">{player.strikeRate || '0.00'}</p>
              <p className="text-xs text-gray-600">Strike Rate</p>
            </div>
          </div>

          {/* Matches */}
          <div className="text-center text-sm text-gray-500">
            {player.matches || 0} Matches Played
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default PlayerCard;

