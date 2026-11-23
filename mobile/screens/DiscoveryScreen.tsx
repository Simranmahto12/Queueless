import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useMobile } from '../context/MobileContext';
import { MOCK_INSTITUTIONS, InstitutionSector } from '@queueless/shared';

export const DiscoveryScreen: React.FC = () => {
  const { setSelectedInstitution, setCurrentScreen, institutions } = useMobile();

  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');

  const filtered = institutions.filter((inst) => {
    if (selectedSector !== 'ALL' && inst.sector !== selectedSector) return false;
    if (search.trim()) {
      return (
        inst.name.toLowerCase().includes(search.toLowerCase()) ||
        inst.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover Institutions</Text>
        <Text style={styles.subtitle}>Find accredited hospitals, banks, and public counters</Text>

        {/* Search Input */}
        <TextInput
          style={styles.searchBar}
          placeholder="Search by facility name or service..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />

        {/* Sector Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {['ALL', 'HEALTHCARE', 'BANKING', 'GOVERNMENT'].map((sec) => (
            <TouchableOpacity
              key={sec}
              onPress={() => setSelectedSector(sec)}
              style={[
                styles.chip,
                selectedSector === sec && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedSector === sec && styles.chipTextActive,
                ]}
              >
                {sec === 'ALL' ? 'All Sectors' : sec.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.map((inst) => (
          <TouchableOpacity
            key={inst.institutionId}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => {
              setSelectedInstitution(inst);
              setCurrentScreen('service_selection');
            }}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.sectorTag}>{inst.sector.replace('_', ' ')}</Text>
                <Text style={styles.instName}>{inst.name}</Text>
              </View>
              <View style={styles.badgeOpen}>
                <Text style={styles.badgeOpenText}>Open Now</Text>
              </View>
            </View>

            <Text style={styles.instDesc}>{inst.description}</Text>

            <View style={styles.cardFooter}>
              <Text style={styles.footerInfo}>Max advance: {inst.settings.maxAdvanceBookingDays} days</Text>
              <Text style={styles.selectAction}>Select Services →</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5EAF1',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#172033',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  searchBar: {
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#E5EAF1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#172033',
    marginTop: 4,
  },
  chipRow: {
    gap: 8,
    paddingTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  chipActive: {
    backgroundColor: '#142B4A',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: 20,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5EAF1',
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectorTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  instName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#172033',
    marginTop: 2,
  },
  badgeOpen: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeOpenText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  instDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerInfo: {
    fontSize: 11,
    color: '#94A3B8',
  },
  selectAction: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
});
