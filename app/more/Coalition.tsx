import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// Redux & APIs
import { useSelector } from "react-redux";
import { RootState } from "@/src/store";
import { useGetCandidateByUserIdQuery } from "@/src/store/Apis/Candidates.Api";
import { useGetElectionByIdQuery } from "@/src/store/Apis/Election.Api";
import { useGetPositionByIdQuery } from "@/src/store/Apis/Positions.Api";
import { 
  useCreateCoalitionMutation, 
  useJoinCoalitionMutation, 
  useGetCoalitionsByElectionQuery,
  useGetCoalitionFullSlateQuery,
  useLeaveCoalitionMutation 
} from "@/src/store/Apis/Coalition.Api"; 

const UNIVERSITY_RED = "#D32F2F";
const UNIVERSITY_WHITE = "#FFFFFF";
const DARK_NAVY = "#1A237E";
const BORDER_COLOR = "#E0E0E0";

export default function CandidateDetailPage() {
  const navigation = useNavigation();
  const userId = useSelector((state: RootState) => state.auth.user?.id);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Form States
  const [coalitionForm, setCoalitionForm] = useState({
    name: "",
    acronym: "",
    slogan: "",
    color_code: "#3b82f6",
    description: "",
  });

  // 1. Fetch Candidate Data
  const { data, isLoading, isError, refetch } = useGetCandidateByUserIdQuery(
    userId as string, 
    { skip: !userId }
  );
  const candidate = data?.candidate;

  // 2. Fetch Election & Position
  const { data: electionData } = useGetElectionByIdQuery(candidate?.election_id ?? "", { skip: !candidate?.election_id });
  const { data: positionData } = useGetPositionByIdQuery(candidate?.position_id ?? "", { skip: !candidate?.position_id });

  // 3. Coalition Specific Data & Mutations
  const { data: availableCoalitions, isLoading: loadingList } = useGetCoalitionsByElectionQuery(candidate?.election_id ?? "", { skip: !candidate?.election_id });
  
  // NEW: Fetch Slate if member of a coalition
  const { data: slateData, isLoading: loadingSlate } = useGetCoalitionFullSlateQuery(candidate?.coalition_id ?? "", { skip: !candidate?.coalition_id });
  
  const [createCoalition, { isLoading: isCreating }] = useCreateCoalitionMutation();
  const [joinCoalition, { isLoading: isJoining }] = useJoinCoalitionMutation();
  const [leaveCoalition, { isLoading: isLeaving }] = useLeaveCoalitionMutation();

  const positionName = positionData?.position?.name || "";
  const isPresident = positionName.toLowerCase().includes("president") && !positionName.toLowerCase().includes("vice");

  const onShare = async () => {
    try {
      if (candidate) {
        const electionName = electionData?.election?.name ?? "University Election";
        const shareMessage = `🗳️ OFFICIAL CANDIDATE PROFILE\n\nName: ${candidate.name}\nPosition: ${positionName}\nElection: ${electionName}`;
        await Share.share({ message: shareMessage });
      }
    } catch (e) { console.error(e); }
  };

  const handleCreateSubmit = async () => {
    if (!coalitionForm.name || !coalitionForm.acronym) {
      return Alert.alert("Missing Fields", "Please provide at least a name and acronym.");
    }
    try {
      await createCoalition({
        creatorCandidateId: candidate!.id,
        coalition: {
          election_id: candidate!.election_id,
          ...coalitionForm,
        }
      }).unwrap();
      Alert.alert("Success", "Coalition created successfully!");
      setShowCreateModal(false);
      refetch();
    } catch (err: any) {
      Alert.alert("Error", err?.data?.message || "Creation failed.");
    }
  };

  const handleJoinSelection = async (coalitionId: string) => {
    try {
      await joinCoalition({
        candidate_id: candidate!.id,
        coalition_id: coalitionId
      }).unwrap();
      Alert.alert("Success", "Joined coalition successfully!");
      setShowJoinModal(false);
      refetch();
    } catch (err: any) {
      Alert.alert("Error", err?.data?.message || "Join failed.");
    }
  };

  const handleLeaveCoalition = () => {
    Alert.alert(
      "Leave Coalition",
      "Are you sure you want to exit this alliance? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Leave", 
          style: "destructive", 
          onPress: async () => {
            try {
              await leaveCoalition(candidate!.id).unwrap();
              Alert.alert("Updated", "You have left the coalition.");
              refetch();
            } catch (err: any) {
              Alert.alert("Error", err?.data?.message || "Failed to leave.");
            }
          } 
        }
      ]
    );
  };

  if (isLoading) return <View style={styles.centered}><ActivityIndicator size="large" color={UNIVERSITY_RED} /></View>;
  if (isError || !candidate) return <View style={styles.centered}><Text style={styles.devName}>Profile Not Found</Text></View>;

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* MODAL: CREATE COALITION */}
      <Modal visible={showCreateModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Coalition</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}><Ionicons name="close" size={24} color={DARK_NAVY} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput style={styles.input} placeholder="The Progressive Alliance" onChangeText={(v) => setCoalitionForm({...coalitionForm, name: v})} />
              <Text style={styles.inputLabel}>Acronym</Text>
              <TextInput style={styles.input} placeholder="TPA" onChangeText={(v) => setCoalitionForm({...coalitionForm, acronym: v})} />
              <Text style={styles.inputLabel}>Slogan</Text>
              <TextInput style={styles.input} placeholder="Moving Forward Together" onChangeText={(v) => setCoalitionForm({...coalitionForm, slogan: v})} />
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput style={[styles.input, {height: 80}]} multiline placeholder="Vision and goals..." onChangeText={(v) => setCoalitionForm({...coalitionForm, description: v})} />
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateSubmit}>
                {isCreating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>CREATE COALITION</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: JOIN COALITION */}
      <Modal visible={showJoinModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { height: '60%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Join Alliance</Text>
              <TouchableOpacity onPress={() => setShowJoinModal(false)}><Ionicons name="close" size={24} color={DARK_NAVY} /></TouchableOpacity>
            </View>
            <Text style={styles.coalitionSubText}>Select an existing coalition to join their campaign slate.</Text>
            <ScrollView style={{ marginTop: 15 }}>
              {loadingList ? <ActivityIndicator color={DARK_NAVY} /> : 
                availableCoalitions?.coalitions?.map((c) => (
                  <TouchableOpacity key={c.id} style={styles.joinItem} onPress={() => handleJoinSelection(c.id)}>
                    <View style={[styles.colorDot, { backgroundColor: c.color_code || DARK_NAVY }]} />
                    <View>
                      <Text style={styles.joinItemName}>{c.name} ({c.acronym})</Text>
                      <Text style={styles.joinItemSlogan}>{c.slogan}</Text>
                    </View>
                  </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={UNIVERSITY_RED} />
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>Official Candidate</Text>
        <TouchableOpacity style={styles.shareIconButton} onPress={() => refetch()}><Ionicons name="sync" size={22} color={UNIVERSITY_RED} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarInner}>
              <Image source={{ uri: candidate.photo_url || "https://via.placeholder.com/150" }} style={styles.profileImage} />
            </View>
            <View style={styles.verifiedBadge}><MaterialCommunityIcons name="check-decagram" size={28} color={UNIVERSITY_RED} /></View>
          </View>
          <Text style={styles.devName}>{candidate.name}</Text>
          <Text style={styles.devRole}>{candidate.school?.replace(/_/g, " ")}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryAction} onPress={onShare}>
            <Ionicons name="share-social" size={20} color={UNIVERSITY_WHITE} />
            <Text style={styles.primaryActionText}>Share Profile</Text>
          </TouchableOpacity>
          <View style={styles.secondaryAction}>
             <Text style={styles.statLabelHeader}>POSITION:</Text>
             <Text style={styles.statValueHeader} numberOfLines={1}>{positionName ?? "Loading..."}</Text>
          </View>
        </View>

        {/* COALITION INTEGRATION CARD */}
        <View style={[styles.coalitionCard, candidate.coalition_id && { borderColor: slateData?.coalition.color_code || DARK_NAVY }]}>
          <View style={styles.coalitionContent}>
             <View style={styles.coalitionHeader}>
                <MaterialCommunityIcons name={candidate.coalition_id ? "account-group" : "account-multiple-plus"} size={22} color={DARK_NAVY} />
                <Text style={styles.coalitionTitle}>
                    {candidate.coalition_id ? (slateData?.coalition.name || "Coalition Member") : "Campaign Strategy"}
                </Text>
             </View>
             <Text style={styles.coalitionSubText}>
               {candidate.coalition_id ? (slateData?.coalition.slogan || "Member of an active alliance.") : isPresident ? "Form an alliance to lead a team." : "Join an alliance for this election."}
             </Text>
          </View>
          
          {candidate.coalition_id ? (
            <TouchableOpacity style={[styles.coalitionBtn, { backgroundColor: '#FFF', borderWidth: 1, borderColor: UNIVERSITY_RED }]} onPress={handleLeaveCoalition} disabled={isLeaving}>
               {isLeaving ? <ActivityIndicator size="small" color={UNIVERSITY_RED} /> : <Text style={[styles.coalitionBtnText, { color: UNIVERSITY_RED }]}>LEAVE</Text>}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.coalitionBtn} onPress={() => isPresident ? setShowCreateModal(true) : setShowJoinModal(true)}>
               <Text style={styles.coalitionBtnText}>{isPresident ? "CREATE" : "JOIN"}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* NEW SECTION: COALITION SLATE MEMBERS */}
        {candidate.coalition_id && (
            <View style={styles.slateSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Coalition Slate</Text>
                    <View style={styles.titleLine} />
                </View>
                {loadingSlate ? (
                    <ActivityIndicator color={DARK_NAVY} />
                ) : (
                    slateData?.coalition.candidates.map((member) => (
                        <View key={member.id} style={styles.memberCard}>
                            <Image source={{ uri: member.photo_url || "https://via.placeholder.com/150" }} style={styles.memberAvatar} />
                            <View style={styles.memberInfo}>
                                <Text style={styles.memberName}>{member.name}</Text>
                                <Text style={styles.memberPosition}>{member.position.name}</Text>
                            </View>
                            {member.id === candidate.id && (
                                <View style={styles.selfBadge}><Text style={styles.selfText}>YOU</Text></View>
                            )}
                        </View>
                    ))
                )}
            </View>
        )}

        <View style={styles.bioCard}>
          <Octicons name="quote" size={18} color={UNIVERSITY_RED} style={{ marginBottom: 10 }} />
          <Text style={styles.bioText}>{candidate.bio || "No biography provided."}</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Candidacy Details</Text>
          <View style={styles.titleLine} />
        </View>
        
        <View style={styles.socialGrid}>
          <DataBox icon="vote" label="Election" val={electionData?.election?.name ?? "Loading..."} color={DARK_NAVY} />
          <DataBox icon="account-tie" label="Tier" val={positionData?.position?.tier?.toUpperCase() ?? "---"} color={UNIVERSITY_RED} />
          <DataBox icon="fingerprint" label="Candidate Ref" val={candidate.id?.substring(0, 8) ?? "---"} color="#444" />
          <DataBox icon="shield-check" label="Auth Status" val="Active" color="#2E7D32" />
        </View>

        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerBrand}>UNIVERSITY VOTING PORTAL</Text>
          <Text style={styles.footerSub}>SYSTEM VERSION 1.0.4 • © 2026</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DataBox = ({ icon, label, val, color }: any) => (
  <View style={styles.socialBox}>
    <View style={[styles.iconCircle, { backgroundColor: color }]}><MaterialCommunityIcons name={icon} size={18} color={UNIVERSITY_WHITE} /></View>
    <View style={styles.socialTextContainer}>
        <Text style={styles.socialLabel}>{label}</Text>
        <Text style={styles.socialSubLabel} numberOfLines={1}>{val}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FAFAFA" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  topNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12, backgroundColor: UNIVERSITY_WHITE },
  backButton: { padding: 8, borderRadius: 12, backgroundColor: '#FFF2F2' },
  shareIconButton: { padding: 8 },
  topNavTitle: { fontSize: 13, fontWeight: "800", color: "#666", textTransform: 'uppercase' },
  container: { padding: 20, paddingBottom: 60 },
  headerSection: { alignItems: 'center', marginBottom: 25 },
  avatarWrapper: { marginBottom: 15, position: 'relative' },
  avatarInner: { width: 120, height: 120, borderRadius: 40, backgroundColor: DARK_NAVY, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  profileImage: { width: '100%', height: '100%' },
  verifiedBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#FFF', borderRadius: 18, padding: 2 },
  devName: { fontSize: 28, fontWeight: "900", color: "#111", textAlign: 'center' },
  devRole: { fontSize: 14, color: UNIVERSITY_RED, fontWeight: "700", marginTop: 4, textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  primaryAction: { flex: 1.2, backgroundColor: UNIVERSITY_RED, flexDirection: 'row', height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  primaryActionText: { color: UNIVERSITY_WHITE, fontWeight: '800', marginLeft: 10 },
  secondaryAction: { flex: 2, backgroundColor: UNIVERSITY_WHITE, height: 54, borderRadius: 16, paddingHorizontal: 15, justifyContent: 'center', borderWidth: 1, borderColor: BORDER_COLOR },
  statLabelHeader: { fontSize: 9, color: '#999', fontWeight: 'bold' },
  statValueHeader: { fontSize: 13, color: UNIVERSITY_RED, fontWeight: '800' },
  coalitionCard: { backgroundColor: '#F5F7FF', padding: 18, borderRadius: 24, marginBottom: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DCE4FF' },
  coalitionContent: { flex: 1 },
  coalitionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  coalitionTitle: { fontSize: 14, fontWeight: '900', color: DARK_NAVY, marginLeft: 8 },
  coalitionSubText: { fontSize: 11, color: '#667EEA', lineHeight: 16 },
  coalitionBtn: { backgroundColor: DARK_NAVY, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  coalitionBtnText: { color: UNIVERSITY_WHITE, fontSize: 10, fontWeight: '900' },
  slateSection: { marginBottom: 30 },
  memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: UNIVERSITY_WHITE, padding: 12, borderRadius: 18, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  memberAvatar: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#EEE' },
  memberInfo: { marginLeft: 12, flex: 1 },
  memberName: { fontSize: 14, fontWeight: '800', color: '#222' },
  memberPosition: { fontSize: 11, color: UNIVERSITY_RED, fontWeight: '600' },
  selfBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  selfText: { fontSize: 9, fontWeight: '900', color: '#2E7D32' },
  bioCard: { backgroundColor: UNIVERSITY_WHITE, padding: 22, borderRadius: 24, marginBottom: 35, borderWidth: 1, borderColor: '#F0F0F0' },
  bioText: { fontSize: 15, color: '#4F4F4F', fontStyle: 'italic', lineHeight: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: "#222" },
  titleLine: { flex: 1, height: 1, backgroundColor: '#EEE', marginLeft: 15 },
  socialGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  socialBox: { width: '48%', backgroundColor: UNIVERSITY_WHITE, padding: 12, borderRadius: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  iconCircle: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  socialTextContainer: { marginLeft: 10, flex: 1 },
  socialLabel: { fontSize: 11, fontWeight: '800', color: '#333' },
  socialSubLabel: { fontSize: 10, color: '#AAA' },
  footer: { marginTop: 40, alignItems: 'center' },
  footerDivider: { width: 40, height: 3, backgroundColor: UNIVERSITY_RED, marginBottom: 15 },
  footerBrand: { fontSize: 11, fontWeight: '900', color: '#333' },
  footerSub: { fontSize: 10, color: '#BBB', marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '92%', height: '75%', backgroundColor: '#FFF', borderRadius: 25, padding: 20, elevation: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: DARK_NAVY },
  inputLabel: { fontSize: 11, fontWeight: '900', color: '#777', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: '#F8F9FA', borderRadius: 14, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: '#EEE' },
  submitBtn: { backgroundColor: UNIVERSITY_RED, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10, shadowColor: UNIVERSITY_RED, shadowOpacity: 0.3, shadowRadius: 10 },
  submitBtnText: { color: '#FFF', fontWeight: '900', letterSpacing: 1 },
  joinItem: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#F9FAFB', borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  joinItemName: { fontSize: 14, fontWeight: '800', color: '#111' },
  joinItemSlogan: { fontSize: 11, color: '#777', marginTop: 2 },
  colorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 }
});