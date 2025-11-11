const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <span className="text-2xl mr-2">🏏</span>
              CUET T10 Tournament
            </h3>
            <p className="text-gray-400 text-sm">
              Live cricket scoring system for the CUET T10 Cricket Tournament. 
              Follow your favorite teams and players in real-time.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="/" className="hover:text-white">Home</a></li>
              <li><a href="/teams" className="hover:text-white">Teams</a></li>
              <li><a href="/points-table" className="hover:text-white">Points Table</a></li>
              <li><a href="/players" className="hover:text-white">Players</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">Tournament Info</h3>
            <p className="text-gray-400 text-sm">
              Format: T10 League + Knockouts<br />
              Venue: CUET Cricket Grounds<br />
              Season: 2025
            </p>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400 text-sm">
          <p>&copy; 2025 CUET T10 Cricket Tournament. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

