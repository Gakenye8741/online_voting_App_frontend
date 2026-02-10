// import React, { useEffect, useState, useRef } from "react";
// import {
//   View,
//   Text,
//   ScrollView,
//   StyleSheet,
//   Pressable,
//   FlatList,
//   Image,
//   Dimensions,
//   Animated,
//   Modal,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { MaterialCommunityIcons, Ionicons, Feather } from "@expo/vector-icons";
// import { BarChart } from "react-native-chart-kit";
// import { MaterialCommunityIcons as Mci } from "@expo/vector-icons";

// // --- 1. TYPE DEFINITIONS / INTERFACES (TypeScript Best Practice) ---

// // Use a type union to strictly type the icon names used in Quick Actions
// type MciIconName = keyof typeof Mci.glyphMap;

// interface ElectionInterface {
//   title: string;
//   date: Date;
//   image: string;
// }

// interface CandidateInterface {
//   name: string;
//   position: string;
//   manifesto: string;
//   photo: string;
//   keyFocus: string[];
//   popularity: number;
// }

// interface CoalitionInterface {
//   name: string;
//   members: string[];
//   color: string;
// }

// interface ActionInterface {
//   title: string;
//   icon: MciIconName; // Strict type for MaterialCommunityIcons name
//   color: string;
// }

// interface StatInterface {
//     label: string;
//     value: string | number;
// }


// const { width } = Dimensions.get("window");

// export default function Index() {
//   const [timeLeftElection, setTimeLeftElection] = useState<string>("");
//   const [timeLeftApplication, setTimeLeftApplication] = useState<string>("");
//   const pulseAnimElection = useRef(new Animated.Value(1)).current;
//   const pulseAnimApplication = useRef(new Animated.Value(1)).current;
//   const pulseAnimCoalition = useRef(new Animated.Value(1)).current;
//   const tickerAnim = useRef(new Animated.Value(width)).current;

//   const [candidateModalVisible, setCandidateModalVisible] = useState(false);
//   const [selectedCandidate, setSelectedCandidate] = useState<CandidateInterface | null>(null); // Typed

//   const [coalitionModalVisible, setCoalitionModalVisible] = useState(false);
//   const [selectedCoalition, setSelectedCoalition] = useState<CoalitionInterface | null>(null); // Typed
//   const [featuredIndex, setFeaturedIndex] = useState(0);

//   // Candidate Comparison & Poll States
//   const [selectedCandidates, setSelectedCandidates] = useState<CandidateInterface[]>([]); // Typed
//   const [pollVote, setPollVote] = useState<string | null>(null);
//   const [pollResults, setPollResults] = useState<Record<string, number>>({
//     "Campus Facilities": 52, 
//     Scholarships: 45,
//     "Events & Clubs": 30,
//     "Student Safety": 68,
//   });

//   // --- 2. DATA DEFINITIONS (Using new Interfaces) ---

//   const upcomingElections: ElectionInterface[] = [ // Typed
//     {
//       title: "University President",
//       date: new Date("2025-12-10T17:00:00"),
//       image: "https://picsum.photos/seed/prez/600/400",
//     },
//     {
//       title: "Student Council Members",
//       date: new Date("2025-12-15T17:00:00"),
//       image: "https://picsum.photos/seed/council/600/400",
//     },
//     {
//       title: "Treasurer Election",
//       date: new Date("2025-12-20T17:00:00"),
//       image: "https://picsum.photos/seed/treasurer/600/400",
//     },
//   ];

//   const applicationDeadline = new Date("2025-12-05T17:00:00");

//   const candidates: CandidateInterface[] = [ // Typed
//     {
//       name: "Alice Johnson",
//       position: "University President",
//       manifesto: "I will improve student services and enhance campus engagement.",
//       photo: "https://picsum.photos/seed/alice/100/100",
//       keyFocus: ["Campus Facilities", "Events & Clubs"], 
//       popularity: 350, 
//     },
//     {
//       name: "Bob Smith",
//       position: "Treasurer",
//       manifesto: "I will ensure transparent financial management for all student funds.",
//       photo: "https://picsum.photos/seed/bob/100/100",
//       keyFocus: ["Scholarships", "Student Safety"],
//       popularity: 280,
//     },
//     {
//       name: "Catherine Lee",
//       position: "Student Council",
//       manifesto: "I will organize fun and informative events for students.",
//       photo: "https://picsum.photos/seed/catherine/100/100",
//       keyFocus: ["Events & Clubs", "Campus Facilities"],
//       popularity: 410,
//     },
//   ];

//   const coalitions: CoalitionInterface[] = [ // Typed
//     {
//       name: "Progressive Students",
//       members: ["Alice Johnson", "Bob Smith"],
//       color: "#FF8C00",
//     },
//     {
//       name: "Unity Alliance",
//       members: ["Catherine Lee", "David Green"],
//       color: "#1E90FF",
//     },
//     {
//       name: "Future Leaders",
//       members: ["Emma White", "Frank Brown"],
//       color: "#9C27B0",
//     },
//   ];

//   // Quick Actions (Icon names fixed!)
//   const quickActions: ActionInterface[] = [ // Typed
//     { title: "Vote Now", icon: "vote-outline", color: "#FF3366" }, // FIX: changed 'vote' to 'vote-outline'
//     { title: "Apply for Position", icon: "account-plus-outline", color: "#FF8C00" },
//     { title: "Results", icon: "chart-bar", color: "#4CAF50" }, // FIX: changed 'bar-chart' to 'chart-bar'
//     { title: "My Votes", icon: "check-circle-outline", color: "#1E90FF" }, // FIX: changed 'checkmark-circle-outline' to 'check-circle-outline'
//     { title: "Candidates", icon: "account-group-outline", color: "#9C27B0" },
//     { title: "Notifications", icon: "bell-outline", color: "#03A9F4" },
//   ];

//   const statistics: StatInterface[] = [ // Typed
//     { label: "Registered Voters", value: 1250 },
//     { label: "Positions Open", value: 12 },
//     { label: "Previous Turnout", value: "78%" },
//     { label: "Active Candidates", value: 45 },
//   ];
  
//   // Remaining data arrays (omitted for brevity, assume correct structure)
//   const announcements = [
//     "Election deadlines approaching! Apply soon.",
//     "New voting system updates implemented.",
//     "Check out the candidates' profiles for informed voting.",
//     "Live Q&A session scheduled for Nov 25.",
//     "Nominations are now OPEN! Apply before the deadline.",
//   ];

//   const votingTips = [
//     "Ensure your profile is verified before voting.",
//     "Read all candidate manifestos carefully.",
//     "Voting closes promptly at 5 PM on election day.",
//     "You can vote only once per election.",
//   ];

//   const socials = [
//     { platform: "Twitter", handle: "@LaikipiaEVote" },
//     { platform: "Facebook", handle: "Laikipia E-Vote" },
//     { platform: "Instagram", handle: "@laikipiaevote" },
//   ];

//   const liveUpdates = [
//     "John Doe applied for University President.",
//     "New voter registered: Jane Smith.",
//     "Candidate profiles updated.",
//     "Election debate scheduled for Dec 5.",
//   ];


//   // --- 3. LOGIC/FUNCTIONS (Typed parameters) ---

//   const toggleCandidateSelection = (candidate: CandidateInterface) => { // Typed
//     setSelectedCandidates((prev) => {
//       const index = prev.findIndex((c) => c.name === candidate.name);
//       if (index > -1) {
//         return prev.filter((c) => c.name !== candidate.name);
//       } else if (prev.length < 2) {
//         return [...prev, candidate];
//       }
//       return prev;
//     });
//   };

//   const handleVote = (option: string) => {
//     if (!pollVote) {
//       setPollVote(option);
//       setPollResults((prev) => ({ ...prev, [option]: prev[option] + 1 }));
//     }
//   };

//   const calculateCountdown = () => {
//     const now = new Date().getTime();

//     // Election countdown
//     const nextElection = upcomingElections[0];
//     const distanceElection = nextElection.date.getTime() - now;
//     if (distanceElection <= 0) setTimeLeftElection("LIVE NOW!");
//     else {
//       const days = Math.floor(distanceElection / (1000 * 60 * 60 * 24));
//       const hours = Math.floor((distanceElection / (1000 * 60 * 60)) % 24);
//       const minutes = Math.floor((distanceElection / (1000 * 60)) % 60);
//       const seconds = Math.floor((distanceElection / 1000) % 60);
//       setTimeLeftElection(`${days}d ${hours}h ${minutes}m ${seconds}s`);
//     }

//     // Application countdown
//     const distanceApplication = applicationDeadline.getTime() - now;
//     if (distanceApplication <= 0) setTimeLeftApplication("APPLICATION CLOSED");
//     else {
//       const days = Math.floor(distanceApplication / (1000 * 60 * 60 * 24));
//       const hours = Math.floor((distanceApplication / (1000 * 60 * 60)) % 24);
//       const minutes = Math.floor((distanceApplication / (1000 * 60)) % 60);
//       const seconds = Math.floor((distanceApplication / 1000) % 60);
//       setTimeLeftApplication(`${days}d ${hours}h ${minutes}m ${seconds}s`);
//     }
//   };

//   const pulse = (anim: Animated.Value) => {
//     Animated.sequence([
//       Animated.timing(anim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
//       Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }),
//     ]).start(() => pulse(anim));
//   };

//   const startTicker = () => {
//     tickerAnim.setValue(width);
//     Animated.loop(
//       Animated.timing(tickerAnim, { toValue: -width, duration: 15000, useNativeDriver: true })
//     ).start();
//   };

//   // --- 4. EFFECTS & SETUP ---

//   useEffect(() => {
//     const carouselInterval = setInterval(() => {
//       setFeaturedIndex((prev) => (prev + 1) % coalitions.length);
//     }, 5000);
//     return () => clearInterval(carouselInterval);
//   }, []);

//   useEffect(() => {
//     calculateCountdown();
//     const interval = setInterval(calculateCountdown, 1000);
//     pulse(pulseAnimElection);
//     pulse(pulseAnimApplication);
//     pulse(pulseAnimCoalition);
//     startTicker();
//     return () => clearInterval(interval);
//   }, []);

//   // Chart data for the Student Poll
//   const pollData = {
//     labels: Object.keys(pollResults).map(
//       (label) => label.split(" ").map((word) => word[0]).join("")
//     ),
//     datasets: [
//       {
//         data: Object.values(pollResults),
//       },
//     ],
//   };

//   const chartConfig = {
//     backgroundGradientFrom: "#fff",
//     backgroundGradientTo: "#fff",
//     fillShadowGradient: "#FF3366",
//     fillShadowGradientOpacity: 1,
//     color: (opacity = 1) => `rgba(255, 51, 102, ${opacity})`,
//     labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
//     strokeWidth: 2,
//     barPercentage: 0.5,
//     useShadowColorFromDataset: false,
//     propsForLabels: {
//         fontSize: 10,
//     }
//   };

//   // --- 5. RENDER ---

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
//         {/* Header */}
//         <View style={styles.header}>
//           <Text style={styles.greeting}>Welcome, John Doe! 👋</Text>
//           <Text style={styles.quote}>
//             "Every vote counts. Participate and shape your future!"
//           </Text>
//         </View>

//         {/* Quick Actions (Using fixed icons and typed array) */}
//         <View style={styles.cardsContainer}>
//           {quickActions.map((action, idx) => (
//             <Pressable
//               key={idx}
//               style={({ pressed }) => [
//                 styles.card,
//                 { backgroundColor: action.color },
//                 pressed && { transform: [{ scale: 0.97 }] },
//               ]}
//             >
//               <MaterialCommunityIcons name={action.icon} size={28} color="#fff" />
//               <Text style={styles.cardText}>{action.title}</Text>
//             </Pressable>
//           ))}
//         </View>

//         {/* Upcoming Elections Banners */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>🗓️ Upcoming Elections</Text>
//           <FlatList
//             horizontal
//             showsHorizontalScrollIndicator={false}
//             data={upcomingElections}
//             keyExtractor={(item) => item.title}
//             renderItem={({ item }) => (
//               <View style={styles.bannerCard}>
//                 <Image source={{ uri: item.image }} style={styles.bannerImage} />
//                 <Text style={styles.bannerTitle}>{item.title}</Text>
//                 <Text style={styles.bannerDate}>{item.date.toDateString()}</Text>
//                 <Pressable style={styles.applyButtonSmall}>
//                   <Text style={styles.applyButtonTextSmall}>Apply Now</Text>
//                 </Pressable>
//               </View>
//             )}
//           />
//         </View>

//         {/* Countdown Section */}
//         <View style={styles.countdownContainer}>
//           <Text style={styles.countdownTitle}>Next Election Starts In:</Text>
//           <Animated.Text style={[styles.countdownTimer, { transform: [{ scale: pulseAnimElection }] }]}>
//             {timeLeftElection}
//           </Animated.Text>
//           <Text style={styles.nominationText}>Nominations are OPEN! Apply now.</Text>

//           <Text style={[styles.countdownTitle, { marginTop: 12 }]}>Applications Close In:</Text>
//           <Animated.Text style={[styles.countdownTimer, { transform: [{ scale: pulseAnimApplication }] }]}>
//             {timeLeftApplication}
//           </Animated.Text>
//         </View>

//         {/* Live Updates Ticker */}
//         <View style={styles.tickerContainer}>
//           <Animated.View style={{ flexDirection: "row", transform: [{ translateX: tickerAnim }] }}>
//             {liveUpdates.map((update, index) => (
//               <Text key={index} style={styles.tickerText}>
//                 ⚡ {update}   
//               </Text>
//             ))}
//           </Animated.View>
//         </View>

//         {/* Statistics */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>📈 Election Statistics</Text>
//           <View style={styles.statsContainer}>
//             {statistics.map((stat, index) => (
//               <View key={index} style={styles.statCard}>
//                 <Text style={styles.statValue}>{stat.value}</Text>
//                 <Text style={styles.statLabel}>{stat.label}</Text>
//               </View>
//             ))}
//           </View>
//         </View>

//         {/* Candidates Section & Comparison */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>👥 Candidates</Text>
//           <FlatList
//             horizontal
//             data={candidates}
//             keyExtractor={(item) => item.name}
//             renderItem={({ item }) => {
//               const isSelected = selectedCandidates.some((c) => c.name === item.name);
//               return (
//                 <View style={[styles.candidateCard, isSelected && styles.selectedCandidateCard]}>
//                   <Image source={{ uri: item.photo }} style={styles.candidatePhoto} />
//                   <Text style={styles.candidateName}>{item.name}</Text>
//                   <Text style={styles.candidatePosition}>{item.position}</Text>
//                   <Text style={styles.candidateManifesto} numberOfLines={2}>{item.manifesto}</Text>
//                   <Pressable
//                     style={styles.viewMoreButton}
//                     onPress={() => {
//                       setSelectedCandidate(item);
//                       setCandidateModalVisible(true);
//                     }}
//                   >
//                     <Text style={styles.viewMoreText}>View More</Text>
//                   </Pressable>
//                    <Pressable
//                     style={[styles.compareButton, isSelected ? styles.selectedCompareButton : (selectedCandidates.length >= 2 && styles.disabledCompareButton)]}
//                     onPress={() => toggleCandidateSelection(item)}
//                     disabled={!isSelected && selectedCandidates.length >= 2}
//                   >
//                     <Text style={styles.compareButtonText}>
//                       {isSelected ? "Selected" : (selectedCandidates.length < 2 ? "Compare" : "Max 2")}
//                     </Text>
//                   </Pressable>
//                 </View>
//               );
//             }}
//             showsHorizontalScrollIndicator={false}
//           />

//           {selectedCandidates.length > 0 && (
//             <View style={styles.comparisonContainer}>
//               <Text style={styles.comparisonTitle}>Compare Candidates ({selectedCandidates.length}/2)</Text>
//               {selectedCandidates.length === 2 ? (
//                 <View style={styles.comparisonCard}>
//                   <View style={styles.comparisonItem}>
//                     <Text style={styles.comparisonName}>{selectedCandidates[0].name}</Text>
//                     <Text style={styles.comparisonLabel}>Key Focus:</Text>
//                     <Text style={styles.comparisonDetail}>{selectedCandidates[0].keyFocus.join(', ')}</Text>
//                     <Text style={styles.comparisonLabel}>Popularity:</Text>
//                     <Text style={styles.comparisonDetail}>{selectedCandidates[0].popularity} Votes</Text>
//                   </View>
//                   <Text style={styles.comparisonVS}>vs</Text>
//                   <View style={styles.comparisonItem}>
//                     <Text style={styles.comparisonName}>{selectedCandidates[1].name}</Text>
//                     <Text style={styles.comparisonLabel}>Key Focus:</Text>
//                     <Text style={styles.comparisonDetail}>{selectedCandidates[1].keyFocus.join(', ')}</Text>
//                     <Text style={styles.comparisonLabel}>Popularity:</Text>
//                     <Text style={styles.comparisonDetail}>{selectedCandidates[1].popularity} Votes</Text>
//                   </View>
//                 </View>
//               ) : (
//                 <Text style={styles.comparisonTip}>Select one more candidate to compare their profile and focus areas.</Text>
//               )}
//               <Pressable style={styles.clearComparisonButton} onPress={() => setSelectedCandidates([])}>
//                 <Text style={styles.clearComparisonText}>Clear Comparison</Text>
//               </Pressable>
//             </View>
//           )}
//         </View>

//         {/* Candidate Modal */}
//         <Modal
//           visible={candidateModalVisible}
//           transparent
//           animationType="fade"
//           onRequestClose={() => setCandidateModalVisible(false)}
//         >
//           <View style={styles.modalOverlay}>
//             <View style={styles.modalContent}>
//               {selectedCandidate && (
//                 <>
//                   <Image source={{ uri: selectedCandidate.photo }} style={styles.modalPhoto} />
//                   <Text style={styles.modalName}>{selectedCandidate.name}</Text>
//                   <Text style={styles.modalPosition}>{selectedCandidate.position}</Text>
//                   <Text style={styles.modalManifesto}>Manifesto: {selectedCandidate.manifesto}</Text>
//                   <Text style={styles.modalManifesto}>Key Focus Areas: {selectedCandidate.keyFocus.join(', ')}</Text>
//                   <Pressable
//                     style={styles.closeModalButton}
//                     onPress={() => setCandidateModalVisible(false)}
//                   >
//                     <Text style={styles.closeModalText}>Close</Text>
//                   </Pressable>
//                 </>
//               )}
//             </View>
//           </View>
//         </Modal>

//         {/* Student Poll Section */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>📊 Student Priority Poll</Text>
//           <Text style={styles.pollQuestion}>What is the most critical area for the next University President to focus on?</Text>

//           {Object.keys(pollResults).map((option) => (
//             <Pressable
//               key={option}
//               style={[
//                 styles.pollOption,
//                 pollVote === option && styles.selectedPollOption,
//                 pollVote && styles.disabledPollOption, 
//               ]}
//               onPress={() => handleVote(option)}
//               disabled={!!pollVote}
//             >
//               <Text style={styles.pollOptionText}>{option}</Text>
//               {pollVote && (
//                 <Text style={styles.pollResultText}>
//                   {pollResults[option]} votes
//                 </Text>
//               )}
//             </Pressable>
//           ))}

//           {pollVote && (
//             <View style={styles.pollResultsChart}>
//               <Text style={styles.chartTitle}>Current Poll Results</Text>
//               <ScrollView horizontal style={{width: '100%'}} contentContainerStyle={{paddingRight: 20}}>
//                 <BarChart
//                   data={pollData}
//                   width={Math.max(width - 40, Object.keys(pollResults).length * 80)}
//                   height={220}
//                   yAxisLabel=""
//                   chartConfig={chartConfig}
//                   verticalLabelRotation={0} 
//                   style={{ borderRadius: 16 }}
//                   showValuesOnTopOfBars={true}
//                   fromZero={true}
//                 />
//               </ScrollView>
//             </View>
//           )}
//         </View>

//         {/* Coalitions Section */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>🤝 Candidate Coalitions</Text>

//           {/* Featured Coalition */}
//           {coalitions.length > 0 && (
//             <Animated.View style={[styles.featuredCoalitionCard, { transform: [{ scale: pulseAnimCoalition }] }]}>
//               <Text style={styles.featuredCoalitionName}>🌟 Featured: {coalitions[featuredIndex].name}</Text>
//               <Pressable
//                 style={styles.viewMoreButton}
//                 onPress={() => {
//                   setSelectedCoalition(coalitions[featuredIndex]);
//                   setCoalitionModalVisible(true);
//                 }}
//               >
//                 <Text style={styles.viewMoreText}>View Members</Text>
//               </Pressable>
//             </Animated.View>
//           )}

//           {/* All Coalitions */}
//           <FlatList
//             horizontal
//             data={coalitions}
//             keyExtractor={(item) => item.name}
//             renderItem={({ item }) => (
//               <View style={[styles.coalitionCard, { backgroundColor: item.color }]}>
//                 <Text style={styles.coalitionName}>{item.name}</Text>
//                 <Pressable
//                   style={styles.viewMoreButton}
//                   onPress={() => {
//                     setSelectedCoalition(item);
//                     setCoalitionModalVisible(true);
//                   }}
//                 >
//                   <Text style={styles.viewMoreText}>View Members</Text>
//                 </Pressable>
//               </View>
//             )}
//             showsHorizontalScrollIndicator={false}
//             style={{ marginTop: 12 }}
//           />
//         </View>

//         {/* Coalition Modal */}
//         <Modal
//           visible={coalitionModalVisible}
//           transparent
//           animationType="fade"
//           onRequestClose={() => setCoalitionModalVisible(false)}
//         >
//           <View style={styles.modalOverlay}>
//             <View style={styles.modalContent}>
//               {selectedCoalition && (
//                 <>
//                   <Text style={styles.modalName}>{selectedCoalition.name}</Text>
//                   <Text style={styles.modalManifesto}>Members:</Text>
//                   {selectedCoalition.members.map((m: string, idx: number) => (
//                     <Text key={idx} style={styles.modalManifesto}>• {m}</Text>
//                   ))}
//                   <Pressable
//                     style={styles.closeModalButton}
//                     onPress={() => setCoalitionModalVisible(false)}
//                   >
//                     <Text style={styles.closeModalText}>Close</Text>
//                   </Pressable>
//                 </>
//               )}
//             </View>
//           </View>
//         </Modal>

//         {/* Announcements */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>📢 Announcements</Text>
//           {announcements.map((note, index) => (
//             <View key={index} style={styles.announcementCard}>
//               <Ionicons name="notifications-outline" size={20} color="#FF3366" />
//               <Text style={styles.announcementText}>{note}</Text>
//             </View>
//           ))}
//         </View>

//         {/* Voting Tips */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>💡 Voting Tips</Text>
//           {votingTips.map((tip, index) => (
//             <View key={index} style={styles.tipCard}>
//               <Feather name="info" size={20} color="#FF3366" />
//               <Text style={styles.tipText}>{tip}</Text>
//             </View>
//           ))}
//         </View>

//         {/* Call-to-action */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>🚀 Get Involved!</Text>
//           <Text style={styles.encourageText}>
//             Interested in making a difference? Apply for positions in the next election and shape the future of your university!
//           </Text>
//           <Pressable style={styles.applyButton}>
//             <Text style={styles.applyButtonText}>Apply Now</Text>
//           </Pressable>
//         </View>

//         {/* Social & Developer Info */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>🌐 Connect & About</Text>
//           {socials.map((social, index) => (
//             <View key={index} style={styles.socialCard}>
//               <Text style={styles.socialText}>{social.platform}: {social.handle}</Text>
//             </View>
//           ))}
//           <Text style={styles.developerInfo}>App by University Election Board - Version 1.0.0</Text>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// // --- Styles (Unchanged) ---
// const styles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: "#fefefe" },
//   header: { marginBottom: 25, paddingHorizontal: 20 },
//   greeting: { fontSize: 24, fontWeight: "700", color: "#333" },
//   quote: { fontSize: 14, color: "#FF3366", marginTop: 6, fontStyle: "italic" },
//   cardsContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 25, paddingHorizontal: 20 },
//   card: { width: "48%", borderRadius: 14, padding: 20, marginBottom: 12, alignItems: "center", justifyContent: 'center' },
//   cardText: { color: "#fff", fontWeight: "600", marginTop: 10, fontSize: 16, textAlign: "center" },
//   section: { marginBottom: 30, paddingHorizontal: 20 },
//   sectionTitle: { fontSize: 18, fontWeight: "700", color: "#333", marginBottom: 12 },
//   bannerCard: { width: width * 0.7, borderRadius: 14, paddingBottom: 10, marginRight: 15, backgroundColor: "#fff", overflow: "hidden", elevation: 3 },
//   bannerImage: { width: "100%", height: 120 },
//   bannerTitle: { fontSize: 16, fontWeight: "700", color: "#FF3366", marginTop: 8, textAlign: "center" },
//   bannerDate: { fontSize: 14, fontWeight: "500", color: "#333", textAlign: "center" },
//   applyButtonSmall: { backgroundColor: "#FF3366", paddingVertical: 6, borderRadius: 8, marginTop: 6, width: "70%", alignSelf: "center", alignItems: "center" },
//   applyButtonTextSmall: { color: "#fff", fontWeight: "700", fontSize: 12 },
//   countdownContainer: { alignItems: "center", marginBottom: 15, backgroundColor: "#FFE6EB", paddingVertical: 15, borderRadius: 12, marginHorizontal: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
//   countdownTitle: { fontSize: 16, fontWeight: "600", color: "#333" },
//   countdownTimer: { fontSize: 28, fontWeight: "700", color: "#FF3366", marginTop: 4 },
//   nominationText: { fontSize: 14, color: "#FF3366", marginTop: 4, fontWeight: "600" },
//   tickerContainer: { height: 30, overflow: "hidden", marginBottom: 25, backgroundColor: "#fff0f5", borderRadius: 8, marginHorizontal: 20, paddingHorizontal: 10, justifyContent: "center" },
//   tickerText: { fontSize: 14, color: "#FF3366", marginRight: 40 },
//   statsContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
//   statCard: { width: "48%", backgroundColor: "#FFE6EB", marginBottom: 12, borderRadius: 12, padding: 15, alignItems: "center" },
//   statValue: { fontSize: 20, fontWeight: "700", color: "#FF3366" },
//   statLabel: { fontSize: 12, fontWeight: "500", color: "#333", marginTop: 5, textAlign: "center" },
//   candidateCard: { width: 180, backgroundColor: "#fff", borderRadius: 12, padding: 12, marginRight: 12, alignItems: "center", elevation: 3, borderWidth: 2, borderColor: 'transparent', paddingBottom: 10 },
//   selectedCandidateCard: { borderColor: '#1E90FF' },
//   candidatePhoto: { width: 80, height: 80, borderRadius: 40, marginBottom: 8 },
//   candidateName: { fontSize: 14, fontWeight: "700", color: "#333" },
//   candidatePosition: { fontSize: 12, fontWeight: "500", color: "#FF3366", marginBottom: 6 },
//   candidateManifesto: { fontSize: 12, color: "#666", textAlign: "center" },
//   viewMoreButton: { backgroundColor: "#FF3366", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginTop: 6 },
//   viewMoreText: { color: "#fff", fontWeight: "600", fontSize: 12 },
//   compareButton: { backgroundColor: "#1E90FF", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginTop: 6 },
//   selectedCompareButton: { backgroundColor: "#4CAF50" },
//   disabledCompareButton: { backgroundColor: '#ccc' },
//   compareButtonText: { color: "#fff", fontWeight: "600", fontSize: 12 },
//   comparisonContainer: { marginTop: 20, padding: 15, backgroundColor: '#f0f8ff', borderRadius: 12, borderWidth: 1, borderColor: '#1E90FF' },
//   comparisonTitle: { fontSize: 16, fontWeight: '700', color: '#1E90FF', marginBottom: 10, textAlign: 'center' },
//   comparisonCard: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start' },
//   comparisonItem: { flex: 1, alignItems: 'center', padding: 5 },
//   comparisonName: { fontWeight: 'bold', fontSize: 14, marginBottom: 5, textAlign: 'center' },
//   comparisonLabel: { fontSize: 12, fontWeight: '600', color: '#333', marginTop: 5 },
//   comparisonDetail: { fontSize: 12, color: '#666', textAlign: 'center' },
//   comparisonVS: { fontSize: 18, fontWeight: 'bold', color: '#FF3366', alignSelf: 'center', marginHorizontal: 10, marginTop: 40 },
//   comparisonTip: { fontSize: 14, color: '#666', textAlign: 'center', paddingVertical: 10 },
//   clearComparisonButton: { backgroundColor: "#1E90FF", paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8, marginTop: 10, alignSelf: 'center' },
//   clearComparisonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
//   modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
//   modalContent: { width: width * 0.85, backgroundColor: "#fff", borderRadius: 12, padding: 20, alignItems: "center" },
//   modalPhoto: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
//   modalName: { fontSize: 18, fontWeight: "700", color: "#333" },
//   modalPosition: { fontSize: 14, fontWeight: "600", color: "#FF3366", marginBottom: 10 },
//   modalManifesto: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 10 },
//   closeModalButton: { backgroundColor: "#FF3366", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 },
//   closeModalText: { color: "#fff", fontWeight: "700" },
//   announcementCard: { flexDirection: "row", alignItems: "center", marginBottom: 8, backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8 },
//   announcementText: { marginLeft: 10, color: "#333", fontSize: 14, flexShrink: 1 },
//   tipCard: { flexDirection: "row", alignItems: "center", marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#FF3366', paddingLeft: 10 },
//   tipText: { marginLeft: 10, color: "#333", fontSize: 14 },
//   encourageText: { fontSize: 14, color: "#666", marginBottom: 12 },
//   applyButton: { backgroundColor: "#FF3366", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
//   applyButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
//   socialCard: { marginBottom: 8 },
//   socialText: { fontSize: 14, color: "#333" },
//   developerInfo: { fontSize: 12, color: "#999", marginTop: 10, textAlign: "center" },
//   coalitionCard: { width: 160, borderRadius: 12, padding: 12, marginRight: 12, alignItems: "center", elevation: 3, justifyContent: 'space-around', height: 120 },
//   coalitionName: { fontSize: 14, fontWeight: "700", color: "#fff", textAlign: "center" },
//   featuredCoalitionCard: { width: "100%", backgroundColor: "#FF3366", borderRadius: 14, padding: 15, marginBottom: 12, alignItems: "center", justifyContent: "center", elevation: 4 },
//   featuredCoalitionName: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 8, textAlign: "center" },
//   // Poll Styles
//   pollQuestion: { fontSize: 14, color: '#333', marginBottom: 15, fontWeight: '600', textAlign: 'center' },
//   pollOption: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#ccc', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//   selectedPollOption: { backgroundColor: '#FFE6EB', borderColor: '#FF3366', borderWidth: 2 },
//   disabledPollOption: { opacity: 0.7 },
//   pollOptionText: { fontSize: 14, color: '#333', fontWeight: '500' },
//   pollResultText: { fontSize: 14, color: '#FF3366', fontWeight: '700' },
//   pollResultsChart: { marginTop: 20, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, elevation: 4, paddingVertical: 10, paddingHorizontal: 0, overflow: 'hidden' },
//   chartTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 10, paddingHorizontal: 20 },
// });
// app/(tabs)/Home.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";
import {
  useGetAllElectionsQuery,
  useGetElectionByIdQuery,
  Election,
} from "@/src/store/Apis/Election.Api";

interface User {
  name: string;
  school: string;
  role: string;
  reg_no: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);

  // Load user
  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsed: User = JSON.parse(userData);
        setUser({
          name: parsed.name || "User",
          school: parsed.school || "",
          role: parsed.role || "Voter",
          reg_no: parsed.reg_no || "",
        });
      }
    };
    loadUser();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 21) return "Good evening";
    return "Good night";
  };
  const greeting = getGreeting();

  // Fetch elections
  const { data: electionsData, refetch, isLoading, error } = useGetAllElectionsQuery();
  const latestElection: Election | undefined = electionsData?.elections
    ?.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0];

  const onRefresh = async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  };

  // Fetch selected election details
  const { data: selectedElectionData, isLoading: isElectionLoading } = useGetElectionByIdQuery(
    selectedElectionId ?? "",
    { skip: !selectedElectionId }
  );
  const selectedElection = selectedElectionData?.election;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#c8102e"]} />}
      >
        {/* Header */}
        <Animatable.View animation="fadeInDown" duration={1200} style={styles.header}>
          <Image source={require('@/assets/images/Laikipia-logo.png')} style={styles.logo} />
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>{greeting}, {user?.name || "User"}!</Text>
            <Text style={styles.schoolText}>School: {user?.school || "-"}</Text>
            <Text style={styles.roleText}>Role: {user?.role || "-"}</Text>
          </View>
        </Animatable.View>

        <Animatable.Text animation="fadeInDown" duration={1200} delay={200} style={styles.quote}>
          “Your vote is your voice – make it count!”
        </Animatable.Text>

        {/* Latest Election Card */}
        <Animatable.View animation="fadeInUp" duration={1200} delay={400} style={styles.electionCard}>
          <Text style={styles.cardTitle}>Latest Election</Text>

          {isLoading ? <ActivityIndicator size="small" color="#c8102e" /> :
          error ? <Text style={styles.cardText}>Failed to load election</Text> :
          latestElection ? (
            <>
              <Text style={styles.cardText}>Title: {latestElection.title || latestElection.name}</Text>
              <Text style={styles.cardText}>Start: {new Date(latestElection.start_date).toLocaleString()}</Text>
              <Text style={styles.cardText}>End: {new Date(latestElection.end_date).toLocaleString()}</Text>
              <Text style={styles.cardText}>Status: {latestElection.status}</Text>

              <TouchableOpacity
                onPress={() => {
                  if (latestElection.id) {
                    setSelectedElectionId(latestElection.id);
                    setModalVisible(true);
                  }
                }}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#c8102e', '#ff4d4d']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.gradientButtonText}>View Details</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : <Text style={styles.cardText}>No elections available</Text>}
        </Animatable.View>

        {/* Animated Modal */}
        <Modal visible={modalVisible} animationType="fade" transparent={true}>
          <View style={styles.modalOverlay}>
            <Animatable.View animation="fadeInUp" duration={400} style={styles.modalCard}>
              {isElectionLoading ? (
                <ActivityIndicator size="large" color="#c8102e" style={{ marginTop: 50 }} />
              ) : selectedElection ? (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Animatable.View animation="fadeInDown" duration={400} style={styles.modalHeader}>
                    <Text style={styles.modalHeaderText}>{selectedElection.title || selectedElection.name}</Text>
                  </Animatable.View>

                  <Animatable.View animation="fadeIn" delay={100}>
                    <Text style={styles.label}>Description:</Text>
                    <Text style={styles.text}>{selectedElection.description || "No description available"}</Text>
                  </Animatable.View>

                  <Animatable.View animation="fadeIn" delay={200}>
                    <Text style={styles.label}>Start Date:</Text>
                    <Text style={styles.text}>{new Date(selectedElection.start_date).toLocaleString()}</Text>
                  </Animatable.View>

                  <Animatable.View animation="fadeIn" delay={300}>
                    <Text style={styles.label}>End Date:</Text>
                    <Text style={styles.text}>{new Date(selectedElection.end_date).toLocaleString()}</Text>
                  </Animatable.View>

                  <Animatable.View animation="fadeIn" delay={400}>
                    <Text style={styles.label}>Status:</Text>
                    <Text style={styles.text}>{selectedElection.status?.toUpperCase() || "-"}</Text>
                  </Animatable.View>

                  {/* Bounce Close Button */}
                  <Animatable.View animation="bounceIn" duration={800} delay={500} style={{ alignItems: "center" }}>
                    <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
                      <Text style={styles.closeButtonText}>✕ Close</Text>
                    </Pressable>
                  </Animatable.View>
                </ScrollView>
              ) : (
                <View style={styles.center}>
                  <Text style={styles.errorText}>Failed to load election.</Text>
                  <Animatable.View animation="bounceIn" duration={800} delay={500} style={{ alignItems: "center" }}>
                    <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
                      <Text style={styles.closeButtonText}>✕ Close</Text>
                    </Pressable>
                  </Animatable.View>
                </View>
              )}
            </Animatable.View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 20, flexGrow: 1 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  logo: { width: 60, height: 60, marginRight: 15 },
  greetingContainer: { flex: 1 },
  greetingText: { fontSize: 22, fontWeight: "700", color: "#c8102e" },
  schoolText: { fontSize: 16, color: "#444", marginTop: 2 },
  roleText: { fontSize: 16, color: "#444", marginTop: 2 },
  quote: { fontSize: 16, fontStyle: "italic", color: "#666", marginBottom: 20, marginTop: 5 },
  electionCard: {
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#c8102e", marginBottom: 10 },
  cardText: { fontSize: 16, color: "#333", marginBottom: 6 },
  gradientButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#c8102e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  gradientButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  modalHeaderText: { fontSize: 22, fontWeight: "700", color: "#c8102e" },
  label: { fontSize: 16, fontWeight: "600", marginTop: 12 },
  text: { fontSize: 16, color: "#333", marginTop: 4 },
  closeButton: {
    marginTop: 15,
    backgroundColor: "#c8102e",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16, color: "red", marginBottom: 12 },
});
