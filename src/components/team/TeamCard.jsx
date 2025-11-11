import { Link } from 'react-router-dom';
import Card from '../common/Card';

const TeamCard = ({ team }) => {
  return (
    <Link to={`/teams/${team.id}`}>
      <Card hover>
        <div className="text-center space-y-4">
          {/* Team Logo */}
          <div className="text-6xl">{team.logo || '🏏'}</div>
          
          {/* Team Name */}
          <div>
            <h3 className="font-bold text-xl text-gray-800">{team.name}</h3>
            <p className="text-gray-500 text-sm">{team.short_name || team.shortName}</p>
          </div>

          {/* Stats - Only show if available */}
          {(team.won !== undefined || team.points !== undefined) && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-2xl font-bold text-green-600">{team.won || 0}</p>
                <p className="text-xs text-gray-500">Won</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{team.lost || 0}</p>
                <p className="text-xs text-gray-500">Lost</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{team.points || 0}</p>
                <p className="text-xs text-gray-500">Points</p>
              </div>
            </div>
          )}
          
          {/* View Details Button */}
          <div className="pt-2">
            <span className="text-sm text-green-600 font-semibold hover:text-green-700">
              View Details →
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default TeamCard;

