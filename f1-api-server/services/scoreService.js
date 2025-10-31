// pitlane-realtime/services/scoreService.js

// This service could potentially:
// - Connect to an external F1 live timing API
// - Poll an internal data source for score updates
// - Perform calculations or formatting on score data

/**
 * Example function to fetch or simulate score data.
 * In a real scenario, this might be triggered by an interval or external event.
 * @returns {Promise<object>} - A promise resolving to the score data object.
 */
const getCurrentScores = async () => {
  console.log("Fetching/Calculating current scores...");
  // TODO: Replace with actual logic to get score data
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay

  // Return data in the format your frontend expects
  const mockScoreData = [
    { position: 1, driverCode: 'VER', teamColor: '#0600ef', gap: '+0.0', laps: 51 },
    { position: 2, driverCode: 'LEC', teamColor: '#dc0000', gap: `+${(2.5 + Math.random()).toFixed(1)}`, laps: 51 },
    { position: 3, driverCode: 'HAM', teamColor: '#00d2be', gap: `+${(8.1 + Math.random()).toFixed(1)}`, laps: 51 },
    // ... rest of drivers
  ];
  return mockScoreData;
};

/**
 * Function to periodically check for score updates and emit them via Socket.IO.
 * @param {object} io - The Socket.IO server instance.
 */
const startScoreBroadcasting = (io) => {
  console.log("Starting score broadcasting interval...");
  setInterval(async () => {
    try {
      const scoreData = await getCurrentScores();
      // Emit the 'liveScore' event to all connected clients
      io.emit('liveScore', scoreData);
    } catch (error) {
      console.error("Error fetching or broadcasting scores:", error);
    }
  }, 5000); // Broadcast every 5 seconds (adjust interval as needed)
};

module.exports = {
  getCurrentScores,
  startScoreBroadcasting,
};
