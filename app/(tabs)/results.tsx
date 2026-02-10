import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
  Image,
  Animated,
  Easing,
  Platform,
  Alert,
  Modal,
  TextInput,
  Switch,
} from "react-native";
import { PieChart, BarChart, LineChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Appearance } from "react-native";

const { width } = Dimensions.get("window");

type Candidate = {
  name: string;
  votes: number;
  color: string;
  photo?: string;
  position?: string;
  school?: string;
  gender?: "Male" | "Female" | "Other";
  manifesto?: string;
  history?: number[]; // vote history for trend line
};

export default function ResultsScreen() {
  // --- Theme / Dark mode ---
  const colorScheme = Appearance.getColorScheme();
  const [theme, setTheme] = useState<"dark" | "light">(colorScheme === "dark" ? "dark" : "light");
  const [darkToggle, setDarkToggle] = useState(theme === "dark");

  // --- Simulated live data (you will swap with real API) ---
  const [candidates, setCandidates] = useState<Candidate[]>([
    {
      name: "John Mwangi",
      votes: 420,
      color: "#FF3366",
      photo: "https://source.unsplash.com/100x100/?man,face",
      position: "University President",
      school: "Main Campus",
      gender: "Male",
      manifesto: "Focus on student welfare, campus facilities and transparent governance.",
      history: [360, 370, 380, 400, 410, 420],
    },
    {
      name: "Grace Wanjiru",
      votes: 350,
      color: "#4CAF50",
      photo: "https://source.unsplash.com/100x100/?woman,portrait",
      position: "University President",
      school: "Main Campus",
      gender: "Female",
      manifesto: "Improve internships, mental health services and academic support.",
      history: [300, 310, 320, 330, 340, 350],
    },
    {
      name: "Kevin Otieno",
      votes: 180,
      color: "#1E90FF",
      photo: "https://source.unsplash.com/100x100/?man,smile",
      position: "Treasurer",
      school: "North Campus",
      gender: "Male",
      manifesto: "Transparent financial reporting and better bursary management.",
      history: [120, 130, 140, 150, 165, 180],
    },
    {
      name: "Sarah Njeri",
      votes: 120,
      color: "#9C27B0",
      photo: "https://source.unsplash.com/100x100/?woman,smile",
      position: "Student Council",
      school: "Main Campus",
      gender: "Female",
      manifesto: "More student events and stronger representation.",
      history: [90, 95, 100, 110, 115, 120],
    },
  ]);

  // polls / chart data
  const [pollResults, setPollResults] = useState({
    question: "Should the university extend library hours?",
    votes: { yes: 220, no: 150, neutral: 80 },
  });

  // UI states
  const [activeTab, setActiveTab] = useState<"overall" | "position" | "school" | "gender">("overall");
  const [refreshing, setRefreshing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // search + modal
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // prevent repeated milestone confetti
  const lastMilestoneRef = useRef<{ [key: string]: number }>({});

  // Animated confetti (simple particles)
  const confettiParticles = useRef(
    Array.from({ length: 24 }).map(() => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-20 - Math.random() * 100),
      r: Math.random() * 8 + 6,
      rotate: new Animated.Value(Math.random() * 360),
      color: ["#FF3366", "#FF8C00", "#4CAF50", "#1E90FF", "#9C27B0"][Math.floor(Math.random() * 5)],
      swing: Math.random() * 40 - 20,
    }))
  ).current;

  // pulse animations for countdown-like elements (winner)
  const winnerPulse = useRef(new Animated.Value(1)).current;

  // compute totals & winner
  const totalVotes = useMemo(() => candidates.reduce((s, c) => s + c.votes, 0), [candidates]);
  const ranked = useMemo(() => [...candidates].sort((a, b) => b.votes - a.votes), [candidates]);
  const winner = ranked[0];

  // setup simulated live updates (every 10s)
  useEffect(() => {
    const id = setInterval(() => {
      simulateLiveUpdate();
    }, 10000); // 10s (adjust as needed)
    return () => clearInterval(id);
  }, [candidates]);

  // winner pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(winnerPulse, { toValue: 1.08, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(winnerPulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // confetti trigger when top candidate changes or on demand
  useEffect(() => {
    // show confetti for 2.5s when screen mounts
    setShowConfetti(true);
    const t = setTimeout(() => setShowConfetti(false), 2500);
    if (showConfetti) triggerConfetti();
    return () => clearTimeout(t);
  }, []);

  // when showConfetti flips to true, animate particles
  useEffect(() => {
    if (showConfetti) triggerConfetti();
  }, [showConfetti]);

  function triggerConfetti() {
    confettiParticles.forEach((p, i) => {
      p.x.setValue(Math.random() * width);
      p.y.setValue(-20 - Math.random() * 80);
      p.rotate.setValue(0);
      Animated.parallel([
        Animated.timing(p.y, {
          toValue: 420 + Math.random() * 200,
          duration: 1600 + Math.random() * 1200,
          useNativeDriver: true,
          easing: Easing.out(Easing.exp),
        }),
        Animated.sequence([
          Animated.timing(p.rotate, {
            toValue: Math.random() * 360,
            duration: 800 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(p.rotate, {
            toValue: Math.random() * 720,
            duration: 800 + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  }

  // simulate live update (increase random candidate votes slightly & update poll)
  function simulateLiveUpdate() {
    setCandidates((prev) => {
      const next = prev.map((c) => ({ ...c }));
      // random bump for 1-2 candidates
      const picks = Math.max(1, Math.floor(Math.random() * 2));
      for (let i = 0; i < picks; i++) {
        const idx = Math.floor(Math.random() * next.length);
        const bump = Math.floor(Math.random() * 12);
        next[idx].votes += bump; // small increase
        // append history point for trend (keep last 8 points)
        next[idx].history = [...(next[idx].history ?? []), next[idx].votes].slice(-8);

        // milestone confetti: per-candidate when crossing 25%,50%,75% of total or absolute thresholds
        const total = next.reduce((s, x) => s + x.votes, 0);
        const pct = (next[idx].votes / Math.max(1, total)) * 100;
        const last = lastMilestoneRef.current[next[idx].name] ?? 0;
        if ((pct >= 25 && last < 25) || (pct >= 50 && last < 50) || (pct >= 75 && last < 75) || next[idx].votes >= 1000 && last < 1000) {
          // record milestone
          lastMilestoneRef.current[next[idx].name] = Math.floor(pct);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2400);
        }
      }
      return next;
    });

    setPollResults((p) => {
      const yes = p.votes.yes + Math.floor(Math.random() * 3);
      const no = p.votes.no + Math.floor(Math.random() * 2);
      const neutral = p.votes.neutral + Math.floor(Math.random() * 1);
      return { ...p, votes: { yes, no, neutral } };
    });
  }

  // manual refresh (simulate)
  async function handleRefresh() {
    setRefreshing(true);
    // simulate network
    setTimeout(() => {
      simulateLiveUpdate();
      setRefreshing(false);
    }, 900);
  }

  // Export results to PDF (uses expo-print & expo-sharing)
  async function handleExportPDF() {
    try {
      const html = generateResultsHTML(candidates, totalVotes, winner);
      const { uri } = await Print.printToFileAsync({ html });
      if (Platform.OS === "web") {
        Alert.alert("PDF generated", "Download from the returned URI (web).");
      } else {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
      }
    } catch (err) {
      Alert.alert("Export failed", String(err));
    }
  }

  function generateResultsHTML(cands: Candidate[], total: number, win: Candidate | undefined) {
    const rows = cands
      .map(
        (c) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #eee">${c.name}</td><td style="padding:8px;border-bottom:1px solid #eee">${c.position ?? ""}</td><td style="padding:8px;border-bottom:1px solid #eee">${c.votes}</td><td style="padding:8px;border-bottom:1px solid #eee">${((c.votes / total) * 100).toFixed(1)}%</td></tr>`
      )
      .join("");
    return `
      <html>
        <body style="font-family: Arial, Helvetica, sans-serif; padding: 20px;">
          <h2 style="color:#FF3366">Laikipia E-Vote — Results</h2>
          <p>Total votes: ${total}</p>
          <h3>Winner: ${win?.name ?? "—"}</h3>
          <table style="width:100%; border-collapse: collapse;">
            <thead><tr><th style="text-align:left;padding:8px">Candidate</th><th style="text-align:left;padding:8px">Position</th><th style="padding:8px">Votes</th><th style="padding:8px">%</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `;
  }

  // Chart datasets
  const pieData = useMemo(
    () =>
      candidates.map((c) => ({
        name: c.name,
        votes: c.votes,
        color: c.color,
        legendFontColor: theme === "dark" ? "#ddd" : "#333",
        legendFontSize: 12,
      })),
    [candidates, theme]
  );

  const barData = {
    labels: candidates.map((c) => c.name.split(" ")[0]),
    datasets: [{ data: candidates.map((c) => c.votes) }],
  };

  // prepare line chart data (vote trend)
  const lineData = useMemo(() => {
    const labels = (candidates[0]?.history ?? []).map((_, i) => `T-${(candidates[0].history?.length ?? 0) - i}`);
    const datasets = candidates.map((c) => ({ data: c.history ?? [], strokeWidth: 2 }));
    return { labels, datasets };
  }, [candidates]);

  // chartConfig
  const chartConfig = {
    backgroundGradientFrom: theme === "dark" ? "#0b0b0b" : "#fff",
    backgroundGradientTo: theme === "dark" ? "#0b0b0b" : "#fff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 51, 102, ${opacity})`,
    labelColor: (opacity = 1) => (theme === "dark" ? `rgba(255,255,255, ${opacity})` : `rgba(51,51,51, ${opacity})`),
    fillShadowGradient: "#FF3366",
    fillShadowGradientOpacity: 0.3,
    barPercentage: 0.6,
  };

  // small helper for animated percentage bars
  function PercentageBar({ percent, color }: { percent: number; color: string }) {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      Animated.timing(anim, { toValue: percent, duration: 900, useNativeDriver: false }).start();
    }, [percent]);
    const widthInterpolate = anim.interpolate({
      inputRange: [0, 100],
      outputRange: ["0%", "100%"],
    });
    return (
      <View style={styles.percentBarBackground}>
        <Animated.View style={[styles.percentBarFill, { width: widthInterpolate, backgroundColor: color }]} />
        <Text style={styles.percentLabel}>{percent.toFixed(1)}%</Text>
      </View>
    );
  }

  function filteredCandidates() {
    if (!searchQuery) return candidates;
    const q = searchQuery.toLowerCase();
    return candidates.filter((c) => c.name.toLowerCase().includes(q) || (c.position ?? "").toLowerCase().includes(q) || (c.school ?? "").toLowerCase().includes(q));
  }

  function openCandidateModal(c: Candidate) {
    setSelectedCandidate(c);
    setModalVisible(true);
  }

  // UI render
  return (
    <SafeAreaView style={[styles.safeArea, theme === "dark" && styles.safeAreaDark]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, theme === "dark" && styles.titleDark]}>Election Results</Text>
            <Text style={[styles.subtitle, theme === "dark" && styles.subtitleDark]}>Live tallies — updated every 10s</Text>
          </View>

          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            {/* Search */}
            <View style={[styles.searchBox, theme === "dark" && styles.searchBoxDark]}>
              <Ionicons name="search" size={18} color={theme === "dark" ? "#ddd" : "#666"} />
              <TextInput placeholder="Search candidates" placeholderTextColor={theme === "dark" ? "#999" : "#999"} value={searchQuery} onChangeText={setSearchQuery} style={[styles.searchInput, theme === "dark" && { color: "#fff" }]} />
            </View>

            <Pressable style={styles.iconButton} onPress={handleRefresh}>
              <Ionicons name="refresh" size={20} color="#fff" />
            </Pressable>

            <Pressable style={[styles.iconButton, { backgroundColor: "#333" }]} onPress={handleExportPDF}>
              <Ionicons name="download" size={18} color="#fff" />
            </Pressable>

            {/* Dark toggle */}
            <View style={{ alignItems: "center", marginLeft: 6 }}>
              <Switch value={darkToggle} onValueChange={(v) => { setDarkToggle(v); setTheme(v ? "dark" : "light"); }} />
            </View>
          </View>
        </View>

        {/* Winner Highlight */}
        <View style={[styles.winnerCard, theme === "dark" && styles.winnerCardDark]}>
          <Animated.Text style={[styles.winnerLabel, { transform: [{ scale: winnerPulse }] }]}>🏆 Leading Candidate</Animated.Text>
          <Text style={[styles.winnerName, theme === "dark" && { color: "#fff" }]}>{winner?.name ?? "—"}</Text>
          <Text style={[styles.winnerVotes, theme === "dark" && { color: "#ddd" }]}>{winner?.votes ?? 0} votes — {totalVotes} total</Text>
          <Text style={[styles.winnerPct, theme === "dark" && { color: "#fff" }]}>{((winner?.votes ?? 0) / Math.max(1, totalVotes) * 100).toFixed(1)}%</Text>
        </View>

        {/* Confetti particles */}
        {showConfetti &&
          confettiParticles.map((p, i) => (
            <Animated.View
              key={`conf-${i}`}
              style={[
                styles.confetti,
                {
                  backgroundColor: p.color,
                  width: p.r,
                  height: p.r * 1.4,
                  borderRadius: p.r / 4,
                  transform: [
                    { translateX: p.x },
                    { translateY: p.y },
                    { rotate: p.rotate.interpolate({ inputRange: [0, 360], outputRange: ["0deg", "360deg"] }) },
                  ],
                },
              ]}
            />
          ))}

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(
            [
              { key: "overall", label: "Overall" },
              { key: "position", label: "By Position" },
              { key: "school", label: "By School" },
              { key: "gender", label: "By Gender" },
            ] as { key: any; label: string }[]
          ).map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={[
                styles.tabButton,
                activeTab === t.key && styles.tabButtonActive,
              ]}
            >
              <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Charts section (Overall) */}
        {activeTab === "overall" && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vote Share</Text>
              <PieChart
                data={pieData}
                width={width - 30}
                height={220}
                accessor="votes"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                chartConfig={chartConfig}
                hasLegend={true}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Votes Comparison</Text>
              <BarChart
                data={barData}
                width={width - 30}
                height={260}
                fromZero
                showValuesOnTopOfBars
                chartConfig={chartConfig}
                style={{ borderRadius: 12 }}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vote Trends</Text>
              {/* Line chart showing each candidate's recent history */}
              <ScrollView horizontal style={{ paddingVertical: 6 }}>
                <LineChart
                  data={{ labels: lineData.labels, datasets: lineData.datasets }}
                  width={Math.max(width - 30, 300)}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                />
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Candidate Breakdown</Text>
              {filteredCandidates().map((c) => {
                const pct = totalVotes === 0 ? 0 : (c.votes / totalVotes) * 100;
                const rank = ranked.findIndex((r) => r.name === c.name) + 1;
                return (
                  <Pressable key={c.name} onPress={() => openCandidateModal(c)} style={[styles.candidateRow, theme === "dark" && styles.candidateRowDark]}>
                    <Image source={{ uri: c.photo }} style={styles.candidateAvatar} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Text style={[styles.candidateName, theme === "dark" && { color: "#fff" }]}>{c.name}</Text>
                          {/* Rank badge */}
                          {rank <= 3 && (
                            <View style={[styles.rankBadge, rank === 1 ? styles.gold : rank === 2 ? styles.silver : styles.bronze]}>
                              <Text style={styles.rankText}>{rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}</Text>
                            </View>
                          )}
                        </View>

                        <Text style={[styles.candidateVotes, theme === "dark" && { color: "#ddd" }]}>{c.votes} votes</Text>
                      </View>
                      <PercentageBar percent={pct} color={c.color} />
                      <Text numberOfLines={1} style={[styles.manifestoText, theme === "dark" && { color: "#ccc" }]}>{c.manifesto}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Poll quick view */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Poll</Text>
              <Text style={[styles.pollQuestion, theme === "dark" && { color: "#fff" }]}>{pollResults.question}</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 10 }}>
                {Object.entries(pollResults.votes).map(([k, v]: any, i) => {
                  const total = Object.values(pollResults.votes).reduce((s: number, n: any) => s + n, 0);
                  const pct = total ? (v / total) * 100 : 0;
                  return (
                    <View key={k} style={{ alignItems: "center" }}>
                      <Text style={{ fontWeight: "700", color: "#333" }}>{k.toUpperCase()}</Text>
                      <Text style={{ color: "#FF3366", fontWeight: "700", marginTop: 6 }}>{v}</Text>
                      <Text style={{ fontSize: 12, color: "#666" }}>{pct.toFixed(0)}%</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* By Position / By School / By Gender: show grouped lists */}
        {activeTab !== "overall" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{activeTab === "position" ? "Results by Position" : activeTab === "school" ? "Results by School" : "Results by Gender"}</Text>

            {/* group candidates */}
            {groupCandidates(candidates, activeTab).map((group) => (
              <View key={group.title} style={[styles.groupCard, theme === "dark" && styles.groupCardDark]}>
                <Text style={[styles.groupTitle, theme === "dark" && { color: "#fff" }]}>{group.title}</Text>
                {group.items.map((c) => {
                  const pct = totalVotes ? (c.votes / totalVotes) * 100 : 0;
                  return (
                    <View key={c.name} style={styles.groupRow}>
                      <Text style={[styles.groupRowName, theme === "dark" && { color: "#fff" }]}>{c.name}</Text>
                      <Text style={[styles.groupRowVotes, theme === "dark" && { color: "#ddd" }]}>{c.votes}</Text>
                      <View style={{ width: 110, marginLeft: 8 }}>
                        <PercentageBar percent={pct} color={c.color} />
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {/* Footer actions */}
        <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
          <Pressable style={styles.ctaButton} onPress={() => { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2000); }}>
            <Text style={styles.ctaText}>Celebrate Winner 🎉</Text>
          </Pressable>

          <Pressable style={[styles.ctaButton, { marginTop: 10, backgroundColor: "#333" }]} onPress={handleExportPDF}>
            <Text style={[styles.ctaText, { color: "#fff" }]}>Export Results (PDF)</Text>
          </Pressable>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Candidate modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, theme === "dark" && styles.modalCardDark]}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image source={{ uri: selectedCandidate?.photo }} style={styles.modalAvatar} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.modalName, theme === "dark" && { color: "#fff" }]}>{selectedCandidate?.name}</Text>
                <Text style={[styles.modalSub, theme === "dark" && { color: "#ddd" }]}>{selectedCandidate?.position} • {selectedCandidate?.school}</Text>
              </View>
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={[styles.sectionTitle, { fontSize: 14 }]}>Manifesto</Text>
              <Text style={[styles.manifestoText, theme === "dark" && { color: "#ccc" }]}>{selectedCandidate?.manifesto}</Text>

              <Text style={[styles.sectionTitle, { fontSize: 14, marginTop: 12 }]}>Vote Trend</Text>
              <LineChart
                data={{ labels: selectedCandidate?.history?.map((_, i) => `T-${(selectedCandidate.history?.length ?? 0) - i}`) ?? [], datasets: [{ data: selectedCandidate?.history ?? [] }] }}
                width={Math.max(width - 80, 240)}
                height={140}
                chartConfig={chartConfig}
                bezier
                style={{ marginTop: 8 }}
              />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 12 }}>
              <Pressable onPress={() => setModalVisible(false)} style={[styles.iconButton, { backgroundColor: "#333" }]}>
                <Ionicons name="close" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ----------------- Helpers ----------------- */

function groupCandidates(candidates: any[], by: string) {
  const map = new Map<string, any[]>();
  candidates.forEach((c) => {
    const key = by === "position" ? c.position ?? "Other" : by === "school" ? c.school ?? "Other" : c.gender ?? "Other";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(c);
  });
  return Array.from(map.entries()).map(([title, items]) => ({ title, items }));
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fefefe" },
  safeAreaDark: { backgroundColor: "#0b0b0b" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "800", color: "#FF3366" },
  titleDark: { color: "#fff" },
  subtitle: { fontSize: 12, color: "#666" },
  subtitleDark: { color: "#ddd" },

  winnerCard: {
    backgroundColor: "#FFE6EB",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    elevation: 3,
  },
  winnerCardDark: { backgroundColor: "#1a1a1a" },
  winnerLabel: { fontSize: 12, color: "#333", marginBottom: 6 },
  winnerName: { fontSize: 20, fontWeight: "800", color: "#FF3366" },
  winnerVotes: { fontSize: 14, color: "#333", marginTop: 6 },
  winnerPct: { marginTop: 6, fontWeight: "700", color: "#FF3366" },

  confetti: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 30,
    opacity: 0.95,
  },

  tabRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 6,
    elevation: 2,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  tabButtonActive: {
    backgroundColor: "#FF3366",
  },
  tabLabel: { color: "#333", fontWeight: "700" },
  tabLabelActive: { color: "#fff" },

  section: { paddingHorizontal: 16, marginTop: 18, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#333", marginBottom: 8 },

  candidateRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
    elevation: 2,
  },
  candidateRowDark: { backgroundColor: "#141414" },
  candidateAvatar: { width: 60, height: 60, borderRadius: 30 },
  candidateName: { fontSize: 14, fontWeight: "700", color: "#333" },
  candidateVotes: { fontWeight: "700", color: "#FF3366" },
  manifestoText: { fontSize: 12, color: "#666", marginTop: 6 },

  percentBarBackground: {
    height: 18,
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#ffe6eb",
  },
  percentBarFill: {
    height: "100%",
  },
  percentLabel: {
    position: "absolute",
    right: 8,
    top: 0,
    bottom: 0,
    textAlignVertical: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: 11,
    paddingHorizontal: 6,
  },

  pollQuestion: { fontSize: 14, fontWeight: "700", color: "#333" },

  groupCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  groupCardDark: { backgroundColor: "#141414" },
  groupTitle: { fontWeight: "800", marginBottom: 8 },
  groupRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  groupRowName: { flex: 1, fontWeight: "600" },
  groupRowVotes: { width: 60, textAlign: "right", fontWeight: "700" },

  ctaButton: {
    backgroundColor: "#FF3366",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    elevation: 3,
  },
  ctaText: { color: "#fff", fontWeight: "800" },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FF3366",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    borderRadius: 10,
    height: 40,
    minWidth: 160,
    marginRight: 8,
  },
  searchBoxDark: { backgroundColor: "#1a1a1a" },
  searchInput: { marginLeft: 8, flex: 1, height: 40 },

  // modal
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalCard: { width: width - 40, borderRadius: 12, padding: 18, backgroundColor: "#fff" },
  modalCardDark: { backgroundColor: "#141414" },
  modalAvatar: { width: 72, height: 72, borderRadius: 36 },
  modalName: { fontSize: 18, fontWeight: "800", color: "#FF3366" },
  modalSub: { fontSize: 12, color: "#333" },

  // rank badges
  rankBadge: { marginLeft: 8, marginTop: 4, marginHorizontal: 8, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 8 },
  gold: { backgroundColor: "#FFD700" },
  silver: { backgroundColor: "#C0C0C0" },
  bronze: { backgroundColor: "#CD7F32" },
  rankText: { fontWeight: "800" },
});
