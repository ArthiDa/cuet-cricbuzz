import { Link } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';

const MatchCard = ({ match }) => {
  const getStatusBadge = () => {
    switch (match.status) {
      case 'live':
        return <Badge variant="live">● LIVE</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'upcoming':
        return <Badge variant="info">Upcoming</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <Link to={`/match/${match.id}`}>
      <Card hover>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-600">
              Match {match.matchNumber}
            </span>
            {getStatusBadge()}
          </div>

          {/* Teams */}
          <div className="space-y-3">
            {/* Team 1 */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{match.team1.logo}</span>
                <span className="font-bold text-lg">{match.team1.name}</span>
              </div>
              {match.innings && match.innings[0] && (
                <div className="text-right">
                  <span className="font-bold text-xl">
                    {match.innings[0].runs}/{match.innings[0].wickets}
                  </span>
                  <span className="text-gray-500 text-sm ml-2">
                    ({match.innings[0].overs} ov)
                  </span>
                </div>
              )}
            </div>

            {/* Team 2 */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{match.team2.logo}</span>
                <span className="font-bold text-lg">{match.team2.name}</span>
              </div>
              {match.innings && match.innings[1] && (
                <div className="text-right">
                  <span className="font-bold text-xl">
                    {match.innings[1].runs}/{match.innings[1].wickets}
                  </span>
                  <span className="text-gray-500 text-sm ml-2">
                    ({match.innings[1].overs} ov)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Result or Live Status */}
          {match.status === 'completed' && match.result && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-green-700 font-semibold text-center">
                {match.result.summary}
              </p>
            </div>
          )}

          {match.status === 'live' && match.liveScore && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-red-600 font-semibold text-center">
                CRR: {match.liveScore.runRate?.current?.toFixed(2)} • 
                Over: {match.liveScore.overs}
              </p>
            </div>
          )}

          {match.status === 'upcoming' && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-gray-600 text-sm text-center">
                📍 {match.venue} • {match.date} at {match.time}
              </p>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
};

export default MatchCard;

