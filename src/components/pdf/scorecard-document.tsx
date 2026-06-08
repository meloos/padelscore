import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

interface Player {
  id: string;
  displayName: string;
  totalPoints: number;
  wins: number;
  losses: number;
  roundsPlayed: number;
  eloRating?: number;
}

interface Match {
  id: string;
  team1Player1Id: string;
  team1Player2Id: string;
  team2Player1Id: string;
  team2Player2Id: string;
  team1Score: number | null;
  team2Score: number | null;
  status: string;
}

interface Round {
  id: string;
  roundNumber: number;
  status: string;
  match?: Match;
}

interface TournamentData {
  id: string;
  name: string;
  type: string;
  status: string;
  players: Player[];
  rounds: Round[];
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    backgroundColor: "#ffffff",
    color: "#1a1a2e",
  },
  header: {
    marginBottom: 24,
    borderBottom: "2px solid #6366f1",
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#6366f1",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  table: {
    borderRadius: 4,
    overflow: "hidden",
    border: "1px solid #e5e7eb",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: "6 10",
    borderBottom: "1px solid #e5e7eb",
  },
  tableRow: {
    flexDirection: "row",
    padding: "6 10",
    borderBottom: "1px solid #f3f4f6",
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: "6 10",
    borderBottom: "1px solid #f3f4f6",
    backgroundColor: "#fafafa",
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableCell: {
    fontSize: 10,
    color: "#1f2937",
  },
  rankCell: { width: "8%" },
  nameCell: { width: "34%" },
  ptsCell: { width: "14%", textAlign: "right" },
  wlCell: { width: "14%", textAlign: "right" },
  roundsCell: { width: "16%", textAlign: "right" },
  eloCell: { width: "14%", textAlign: "right" },
  roundHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ede9fe",
    padding: "5 10",
    marginBottom: 0,
    borderRadius: 3,
  },
  roundTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: "#5b21b6",
  },
  roundScore: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: "#1f2937",
  },
  matchRow: {
    padding: "5 10",
    borderBottom: "1px solid #f3f4f6",
    marginBottom: 4,
  },
  matchTeam: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  teamNames: {
    fontSize: 10,
    color: "#374151",
    flex: 1,
  },
  winner: {
    fontFamily: "Helvetica-Bold",
    color: "#059669",
  },
  loser: {
    color: "#6b7280",
  },
  vsText: {
    fontSize: 9,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 2,
  },
  footer: {
    marginTop: 32,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 8,
    fontSize: 8,
    color: "#9ca3af",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export function ScorecardDocument({ tournament }: { tournament: TournamentData }) {
  const playerMap = Object.fromEntries(tournament.players.map((p) => [p.id, p]));
  const sorted = [...tournament.players].sort(
    (a, b) => b.totalPoints - a.totalPoints || b.wins - a.wins
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{tournament.name}</Text>
          <Text style={styles.subtitle}>
            {tournament.type.charAt(0).toUpperCase() + tournament.type.slice(1)} tournament ·{" "}
            {tournament.status === "completed" ? "Final standings" : "In progress"} ·{" "}
            {tournament.rounds.filter((r) => r.status === "completed").length} rounds played
          </Text>
        </View>

        {/* Final standings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {tournament.status === "completed" ? "Final Standings" : "Current Standings"}
          </Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.rankCell]}>#</Text>
              <Text style={[styles.tableHeaderCell, styles.nameCell]}>Player</Text>
              <Text style={[styles.tableHeaderCell, styles.ptsCell]}>Points</Text>
              <Text style={[styles.tableHeaderCell, styles.wlCell]}>W / L</Text>
              <Text style={[styles.tableHeaderCell, styles.roundsCell]}>Rounds</Text>
              <Text style={[styles.tableHeaderCell, styles.eloCell]}>ELO</Text>
            </View>
            {sorted.map((player, i) => (
              <View key={player.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.tableCell, styles.rankCell]}>{ordinal(i + 1)}</Text>
                <Text style={[styles.tableCell, styles.nameCell]}>{player.displayName}</Text>
                <Text style={[styles.tableCell, styles.ptsCell]}>{player.totalPoints}</Text>
                <Text style={[styles.tableCell, styles.wlCell]}>
                  {player.wins} / {player.losses}
                </Text>
                <Text style={[styles.tableCell, styles.roundsCell]}>{player.roundsPlayed}</Text>
                <Text style={[styles.tableCell, styles.eloCell]}>{player.eloRating ?? "—"}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Round-by-round results */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Round Results</Text>
          {tournament.rounds
            .filter((r) => r.status === "completed" && r.match)
            .map((round) => {
              const m = round.match!;
              const t1Won = (m.team1Score ?? 0) > (m.team2Score ?? 0);
              const t1p1 = playerMap[m.team1Player1Id]?.displayName ?? "?";
              const t1p2 = playerMap[m.team1Player2Id]?.displayName ?? "?";
              const t2p1 = playerMap[m.team2Player1Id]?.displayName ?? "?";
              const t2p2 = playerMap[m.team2Player2Id]?.displayName ?? "?";

              return (
                <View key={round.id} style={{ marginBottom: 8, border: "1px solid #e5e7eb", borderRadius: 4 }}>
                  <View style={styles.roundHeader}>
                    <Text style={styles.roundTitle}>Round {round.roundNumber}</Text>
                    <Text style={styles.roundScore}>
                      {m.team1Score} — {m.team2Score}
                    </Text>
                  </View>
                  <View style={{ padding: "6 10" }}>
                    <View style={styles.matchTeam}>
                      <Text style={[styles.teamNames, t1Won ? styles.winner : styles.loser]}>
                        {t1p1} & {t1p2}
                      </Text>
                      <Text style={[styles.tableCell, t1Won ? styles.winner : styles.loser]}>
                        {m.team1Score} pts
                      </Text>
                    </View>
                    <Text style={styles.vsText}>vs</Text>
                    <View style={styles.matchTeam}>
                      <Text style={[styles.teamNames, !t1Won ? styles.winner : styles.loser]}>
                        {t2p1} & {t2p2}
                      </Text>
                      <Text style={[styles.tableCell, !t1Won ? styles.winner : styles.loser]}>
                        {m.team2Score} pts
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>PadelScore</Text>
          <Text>Generated {new Date().toLocaleDateString()}</Text>
        </View>
      </Page>
    </Document>
  );
}
