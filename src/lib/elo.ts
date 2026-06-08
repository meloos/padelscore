const K = 32;

export function calculateElo(
  playerRating: number,
  opponentRating: number,
  won: boolean
): number {
  const expected = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const actual = won ? 1 : 0;
  return Math.round(playerRating + K * (actual - expected));
}

/** Returns new ELO for each player in a 2v2 match. */
export function calculateTeamElo(
  team1Ratings: [number, number],
  team2Ratings: [number, number],
  team1Won: boolean
): { team1: [number, number]; team2: [number, number] } {
  const avgTeam1 = (team1Ratings[0] + team1Ratings[1]) / 2;
  const avgTeam2 = (team2Ratings[0] + team2Ratings[1]) / 2;

  return {
    team1: [
      calculateElo(team1Ratings[0], avgTeam2, team1Won),
      calculateElo(team1Ratings[1], avgTeam2, team1Won),
    ],
    team2: [
      calculateElo(team2Ratings[0], avgTeam1, !team1Won),
      calculateElo(team2Ratings[1], avgTeam1, !team1Won),
    ],
  };
}
