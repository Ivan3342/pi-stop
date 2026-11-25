import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
export interface BusArrival {
  id: string;
  lineNumber: string;
  route: string;
  isLive: boolean;
  currentPassengers: number;
  maxCapacity: number;
}

// ============================================================================
// THEME PALETTE (Pixel-matched Light + Adaptive Dark Mode)
// ============================================================================
const LightTheme = {
  background: '#F4F7FA',
  surface: '#FFFFFF',
  surfaceBorder: '#E2E8F0',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  accentBlue: '#1A56DB',
  accentBluePressed: '#1545B3',
  liveDot: '#22C55E',
  moonIcon: '#111827',
  footerBg: '#FFFFFF',
  footerBorder: '#E5E7EB',
  // Crowd Pill Colors
  lowBg: '#DCFCE7',
  lowText: '#15803D',
  lowFill: '#22C55E',
  lowTrack: '#BBF7D0',
  medBg: '#FEF9C3',
  medText: '#B45309',
  medFill: '#EAB308',
  medTrack: '#FDE68A',
  highBg: '#FEE2E2',
  highText: '#B91C1C',
  highFill: '#EF4444',
  highTrack: '#FECACA',
};

const DarkTheme = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceBorder: '#334155',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  accentBlue: '#3B82F6',
  accentBluePressed: '#2563EB',
  liveDot: '#22C55E',
  moonIcon: '#FBBF24',
  footerBg: '#1E293B',
  footerBorder: '#334155',
  // Crowd Pill Colors (Dark Mode adapted)
  lowBg: 'rgba(34, 197, 94, 0.16)',
  lowText: '#4ADE80',
  lowFill: '#22C55E',
  lowTrack: 'rgba(34, 197, 94, 0.25)',
  medBg: 'rgba(234, 179, 8, 0.16)',
  medText: '#FACC15',
  medFill: '#EAB308',
  medTrack: 'rgba(234, 179, 8, 0.25)',
  highBg: 'rgba(239, 68, 68, 0.16)',
  highText: '#F87171',
  highFill: '#EF4444',
  highTrack: 'rgba(239, 68, 68, 0.25)',
};

// ============================================================================
// INITIAL MOCK DATA (Matches Screenshot)
// ============================================================================
const INITIAL_BUS_DATA: BusArrival[] = [
  {
    id: '1',
    lineNumber: '1',
    route: 'Goločelo / Dragobraća →\nKorman / Botunje',
    isLive: true,
    currentPassengers: 30,
    maxCapacity: 72, // ~41.6% -> Srednja gužva
  },
  {
    id: '13',
    lineNumber: '13',
    route: 'Trmbas → Grošnica',
    isLive: true,
    currentPassengers: 14,
    maxCapacity: 72, // ~19.4% -> Mala gužva
  },
  {
    id: '16',
    lineNumber: '16',
    route: 'Veliko Polje → Desimirovac',
    isLive: true,
    currentPassengers: 18,
    maxCapacity: 72, // 25% -> Mala gužva
  },
  {
    id: '17',
    lineNumber: '17',
    route: 'Baljkovac → Dom Starih /\nJezero',
    isLive: true,
    currentPassengers: 12,
    maxCapacity: 72, // ~16.6% -> Mala gužva
  },
];

export default function HomeScreen() {
  const systemColorScheme = useColorScheme();
  // Automatically follows device default theme; allows manual override via moon icon
  const [manualDark, setManualDark] = useState<boolean | null>(null);
  const isDark = manualDark !== null ? manualDark : systemColorScheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [buses, setBuses] = useState<BusArrival[]>(INITIAL_BUS_DATA);
  const [loading, setLoading] = useState<boolean>(false);
  // Tracks which bus cards are toggled open to show "30/72"
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // ==========================================================================
  // YOUR API INTEGRATION HOOK
  // ==========================================================================
  const fetchBusCrowdData = async () => {
    try {
      // TODO: Replace with your actual API endpoint
      const API_URL = 'https://your-api-endpoint.com/api/buses';

      // Uncomment the block below once your API is live:
      /*
      setLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Network response failed');
      const data: BusArrival[] = await response.json();
      setBuses(data);
      */
    } catch (error) {
      console.error('Error fetching bus data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusCrowdData();

    // Optional: Poll your API every 10 seconds for real-time crowd meter updates
    const interval = setInterval(fetchBusCrowdData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Toggle passenger count visibility ("30/72") on card press
  const toggleCardExpand = (id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filter buses by line number or route name
  const filteredBuses = useMemo(() => {
    if (!searchQuery.trim()) return buses;
    const query = searchQuery.toLowerCase();
    return buses.filter(
      (bus) =>
        bus.lineNumber.toLowerCase().includes(query) ||
        bus.route.toLowerCase().includes(query)
    );
  }, [buses, searchQuery]);

  // Helper to compute crowd level colors, labels, and fill percentage
  const getCrowdMeta = (current: number, max: number) => {
    const ratio = max > 0 ? Math.min(Math.max(current / max, 0), 1) : 0;
    const percentage = Math.round(ratio * 100);

    if (percentage < 35) {
      return {
        label: 'Mala gužva',
        bg: theme.lowBg,
        text: theme.lowText,
        fill: theme.lowFill,
        track: theme.lowTrack,
        widthPercent: `${Math.max(percentage, 12)}%` as const,
      };
    } else if (percentage < 70) {
      return {
        label: 'Srednja gužva',
        bg: theme.medBg,
        text: theme.medText,
        fill: theme.medFill,
        track: theme.medTrack,
        widthPercent: `${percentage}%` as const,
      };
    } else {
      return {
        label: 'Velika gužva',
        bg: theme.highBg,
        text: theme.highText,
        fill: theme.highFill,
        track: theme.highTrack,
        widthPercent: `${percentage}%` as const,
      };
    }
  };

  const renderBusCard = ({ item }: { item: BusArrival }) => {
    const crowd = getCrowdMeta(item.currentPassengers, item.maxCapacity);
    const isExpanded = !!expandedCards[item.id];

    return (
      <Pressable
        onPress={() => toggleCardExpand(item.id)}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: isDark ? theme.surfaceBorder : 'transparent',
            borderWidth: isDark ? 1 : 0,
            opacity: Platform.OS === 'ios' && pressed ? 0.9 : 1,
          },
        ]}
      >
        {/* Left Column: Line Number + Live Dot & Route */}
        <View style={styles.cardLeft}>
          <View style={styles.lineHeader}>
            <Text style={[styles.lineNumber, { color: theme.accentBlue }]}>
              {item.lineNumber}
            </Text>
            {item.isLive && (
              <View style={[styles.liveDot, { backgroundColor: theme.liveDot }]} />
            )}
          </View>
          <Text style={[styles.routeText, { color: theme.textSecondary }]}>
            {item.route}
          </Text>
        </View>

        {/* Right Column: Crowd Pill + Progress Bar + Passenger Ratio on Tap */}
        <View style={styles.cardRight}>
          <View style={[styles.crowdPill, { backgroundColor: crowd.bg }]}>
            <Text style={[styles.crowdLabel, { color: crowd.text }]}>
              {crowd.label}
            </Text>
            <View style={[styles.progressTrack, { backgroundColor: crowd.track }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: crowd.fill,
                    width: crowd.widthPercent,
                  },
                ]}
              />
            </View>
          </View>

          {isExpanded && (
            <View style={styles.passengerBadge}>
              <Ionicons
                name="people"
                size={13}
                color={theme.textMuted}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.passengerCountText, { color: theme.textPrimary }]}>
                {item.currentPassengers}/{item.maxCapacity}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <View style={styles.titleBlock}>
            <Text style={[styles.titleText, { color: theme.textPrimary }]}>
              Dobrodošli u
            </Text>
            <View style={styles.brandRow}>
              <Text style={[styles.titleText, { color: theme.textPrimary }]}>
                PiStop!
              </Text>
              {/* Custom Bus Stop Pole Icon matching the screenshot */}
              <View style={styles.busPoleIcon}>
                <View style={styles.busPoleSign} />
                <View style={styles.busPoleStick} />
                <View style={styles.busPoleBase} />
              </View>
            </View>
          </View>

          {/* Theme Toggle Icon (Defaults to system theme, tap to preview dark/light) */}
          <Pressable
            onPress={() => setManualDark((prev) => (prev === null ? !isDark : !prev))}
            hitSlop={12}
            style={styles.themeButton}
          >
            <Ionicons
              name={isDark ? 'sunny' : 'moon'}
              size={26}
              color={theme.moonIcon}
            />
          </Pressable>
        </View>

        <Text style={[styles.subtitleText, { color: theme.textMuted }]}>
          Informacije za javni prevoz na dlanu
        </Text>

        {/* Search Input Bar */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: theme.surface,
              borderColor: theme.surfaceBorder,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color="#3B82F6"
            style={styles.searchIcon}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Pretraga..."
            placeholderTextColor={theme.textMuted}
            style={[styles.searchInput, { color: theme.textPrimary }]}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Dolasci
          </Text>
          {loading && <ActivityIndicator size="small" color={theme.accentBlue} />}
        </View>
      </View>

      {/* Bus Arrivals List */}
      <FlatList
        data={filteredBuses}
        keyExtractor={(item) => item.id}
        renderItem={renderBusCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// ============================================================================
// PIXEL-MATCHED STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleBlock: {
    flex: 1,
  },
  titleText: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Custom Bus Stop Sign Illustration matching the screenshot next to "PiStop!"
  busPoleIcon: {
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
  },
  busPoleSign: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
  },
  busPoleStick: {
    width: 2.5,
    height: 16,
    backgroundColor: '#94A3B8',
  },
  busPoleBase: {
    width: 14,
    height: 2.5,
    borderRadius: 1,
    backgroundColor: '#64748B',
  },
  themeButton: {
    paddingTop: 6,
    paddingLeft: 12,
  },
  subtitleText: {
    fontSize: 13.5,
    fontWeight: '400',
    marginTop: 6,
    marginBottom: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
    // Android & iOS soft card shadow
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardLeft: {
    flex: 1,
    paddingRight: 12,
  },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  lineNumber: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginLeft: 8,
    marginTop: -6,
  },
  routeText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  crowdPill: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 108,
    alignItems: 'center',
  },
  crowdLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  progressTrack: {
    width: 84,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  passengerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 6,
  },
  passengerCountText: {
    fontSize: 12.5,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 16 : 8,
    borderTopWidth: 1,
  },
  ctaButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#1A56DB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});