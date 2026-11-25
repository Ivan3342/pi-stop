import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LightTheme = {
  background: '#F4F7FA',
  surface: '#FFFFFF',
  surfaceBorder: '#E2E8F0',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  accentBlue: '#1A56DB',
  wipBg: '#FEF9C3',
  wipBorder: '#FDE047',
  wipText: '#A16207',
  wipIcon: '#CA8A04',
};

const DarkTheme = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceBorder: '#334155',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  accentBlue: '#3B82F6',
  wipBg: 'rgba(234, 179, 8, 0.14)',
  wipBorder: 'rgba(234, 179, 8, 0.35)',
  wipText: '#FACC15',
  wipIcon: '#FBBF24',
};

export default function ProfileScreen() {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Profil
        </Text>
      </View>

      {/* Centered Work-in-Progress Card */}
      <View style={styles.centerContent}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.surfaceBorder,
            },
          ]}
        >
          {/* Styled WIP Pill Badge */}
          <View
            style={[
              styles.wipBadge,
              {
                backgroundColor: theme.wipBg,
                borderColor: theme.wipBorder,
              },
            ]}
          >
            <Ionicons
              name="construct-outline"
              size={15}
              color={theme.wipIcon}
              style={styles.wipIcon}
            />
            <Text style={[styles.wipBadgeText, { color: theme.wipText }]}>
              WORK IN PROGRESS
            </Text>
          </View>

          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            Profil korisnika je u izradi
          </Text>

          <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
            Ova sekcija je trenutno u razvoju. Uskoro stižu sačuvane linije,
            omiljene stanice i prilagođena obaveštenja.
          </Text>

          <Text style={[styles.subtleHint, { color: theme.textMuted }]}>
            PiStop • Javni prevoz
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  wipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  wipIcon: {
    marginRight: 6,
  },
  wipBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 18,
  },
  subtleHint: {
    fontSize: 12,
    fontWeight: '600',
    fontStyle: Platform.OS === 'ios' ? 'italic' : 'normal',
  },
});