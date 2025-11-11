const RecentBalls = ({ balls }) => {
  const getBallColor = (ball) => {
    if (ball === 'W') return 'bg-red-500 text-white';
    if (ball === '4') return 'bg-blue-500 text-white';
    if (ball === '6') return 'bg-purple-500 text-white';
    if (ball === '0' || ball === '.') return 'bg-gray-300 text-gray-700';
    return 'bg-green-500 text-white';
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <h3 className="font-bold text-gray-700 mb-3">Recent Balls</h3>
      <div className="flex space-x-2 overflow-x-auto">
        {balls.slice().reverse().map((ball, index) => (
          <div
            key={index}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center 
              font-bold text-sm flex-shrink-0
              ${getBallColor(ball)}
            `}
          >
            {ball === '0' ? '•' : ball}
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-gray-500 flex space-x-4">
        <span><span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span>Wicket</span>
        <span><span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span>Four</span>
        <span><span className="inline-block w-3 h-3 bg-purple-500 rounded-full mr-1"></span>Six</span>
        <span><span className="inline-block w-3 h-3 bg-gray-300 rounded-full mr-1"></span>Dot</span>
      </div>
    </div>
  );
};

export default RecentBalls;

