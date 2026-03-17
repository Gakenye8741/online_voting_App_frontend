import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Dimensions,
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

export default function LogsScreen() {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  const bootSequence = [
    "> INITIALIZING E-VOTE OS V1.0.4...",
    "> LOADING PERN STACK KERNEL...",
    "> CONNECTING TO POSTGRESQL CLUSTER... [OK]",
    "> SYNCHRONIZING WITH ETHEREUM SEPOLIA...",
    "> SMART CONTRACT: 0x742d...44e LOADED",
    "> AUTHENTICATING ARCHITECT: GAKENYE NDIRITU",
    "> ENCRYPTING P2P CHANNELS...",
    "> SYSTEM STATUS: OPTIMAL",
    "---------------------------------",
    "> LISTENING FOR INCOMING VOTES...",
  ];

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < bootSequence.length) {
        setLogs(prev => [...prev, bootSequence[index]]);
        index++;
      } else {
        // Add random "live" traffic logs
        const traffic = [
          `> [${new Date().toLocaleTimeString()}] RECEIVED ENCRYPTED PACKET`,
          `> [${new Date().toLocaleTimeString()}] BLOCKCHAIN VERIFICATION SUCCESS`,
          `> [${new Date().toLocaleTimeString()}] HEARTBEAT: NODE ALIVE`,
          `> [${new Date().toLocaleTimeString()}] IPFS CID PINNED`,
        ];
        setLogs(prev => [...prev, traffic[Math.floor(Math.random() * traffic.length)]]);
      }
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Terminal Title Bar */}
      <View style={styles.terminalHeader}>
        <View style={styles.dotContainer}>
          <View style={[styles.dot, { backgroundColor: '#FF5F56' }]} />
          <View style={[styles.dot, { backgroundColor: '#FFBD2E' }]} />
          <View style={[styles.dot, { backgroundColor: '#27C93F' }]} />
        </View>
        <Text style={styles.headerTitle}>bash — dev@ndiritu-laikipia</Text>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.terminalBody}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {logs.map((log, i) => (
          <Text key={i} style={styles.logText}>
            {log}
          </Text>
        ))}
        
        {/* Fixed Cursor Animation */}
        <View style={styles.cursorContainer}>
          <Text style={styles.logText}>{'> '}</Text>
          <Animatable.View 
            animation="flash"  // Changed from fadeInOut to flash
            iterationCount="infinite" 
            duration={1000} 
            style={styles.cursor} 
          />
        </View>
      </ScrollView>

      {/* System Stats Footer */}
      <View style={styles.footer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>LATENCY</Text>
          <Text style={styles.statValue}>24ms</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>UPTIME</Text>
          <Text style={styles.statValue}>99.9%</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>ENV</Text>
          <Text style={styles.statValue}>PROD</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  terminalHeader: { 
    height: 40, 
    backgroundColor: '#333', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10
  },
  dotContainer: { flexDirection: 'row', gap: 6 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  headerTitle: { 
    flex: 1, 
    textAlign: 'center', 
    color: '#BBB', 
    fontSize: 12, 
    fontWeight: '600',
    marginRight: 30 
  },
  terminalBody: { flex: 1, backgroundColor: '#000', paddingHorizontal: 15, paddingTop: 15 },
  scrollContent: { paddingBottom: 50 },
  logText: { 
    color: '#00FF41', 
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', 
    fontSize: 13, 
    lineHeight: 20,
    marginBottom: 4
  },
  cursorContainer: { flexDirection: 'row', alignItems: 'center' },
  cursor: { 
    width: 8, 
    height: 15, 
    backgroundColor: '#00FF41', 
    marginLeft: 2 
  },
  
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    paddingVertical: 20, 
    borderTopWidth: 1, 
    borderTopColor: '#222',
    backgroundColor: '#000'
  },
  statItem: { alignItems: 'center' },
  statLabel: { color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  statValue: { color: '#00FF41', fontSize: 14, fontWeight: '700', marginTop: 2 }
});