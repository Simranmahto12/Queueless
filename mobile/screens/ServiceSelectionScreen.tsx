import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useMobile } from '../context/MobileContext';
import { MOCK_DEPARTMENTS, MOCK_SERVICES } from '@queueless/shared';

export const ServiceSelectionScreen: React.FC = () => {
  const {
    selectedInstitution,
    selectedDepartment,
    setSelectedDepartment,
    selectedService,
    setSelectedService,
    bookNewToken,
    setCurrentScreen,
  } = useMobile();

  const deptList = MOCK_DEPARTMENTS.filter(
    (d) => d.institutionId === selectedInstitution.institutionId
  );
  const activeDept = selectedDepartment || deptList[0];

  const serviceList = MOCK_SERVICES.filter(
    (s) => s.departmentId === activeDept?.departmentId
  );
  const activeService = selectedService || serviceList[0];

  const availableSlots = [
    { time: '09:30', estWait: '10 mins', recommended: true },
    { time: '10:00', estWait: '15 mins', recommended: false },
    { time: '10:30', estWait: '12 mins', recommended: true },
    { time: '11:00', estWait: '20 mins', recommended: false },
  ];
  const [selectedSlot, setSelectedSlot] = useState(availableSlots[0].time);

  const handleConfirm = async () => {
    await bookNewToken(selectedSlot);
    setCurrentScreen('booking_confirmation');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentScreen('discovery')} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Facilities</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{selectedInstitution.name}</Text>
        <Text style={styles.subtitle}>Configure appointment & arrival window</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Step 1: Department Selection */}
        <View style={styles.stepSection}>
          <Text style={styles.stepLabel}>1. SELECT DEPARTMENT</Text>
          <View style={styles.pillList}>
            {deptList.map((d) => {
              const isSelected = activeDept?.departmentId === d.departmentId;
              return (
                <TouchableOpacity
                  key={d.departmentId}
                  style={[styles.deptPill, isSelected && styles.deptPillSelected]}
                  onPress={() => {
                    setSelectedDepartment(d);
                    const srvs = MOCK_SERVICES.filter((s) => s.departmentId === d.departmentId);
                    if (srvs.length > 0) setSelectedService(srvs[0]);
                  }}
                >
                  <Text style={[styles.deptPillText, isSelected && styles.deptPillTextSelected]}>
                    {d.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Step 2: Service Selection */}
        <View style={styles.stepSection}>
          <Text style={styles.stepLabel}>2. SELECT SERVICE PROCEDURE</Text>
          <View style={styles.serviceCards}>
            {serviceList.map((srv) => {
              const isSelected = activeService?.serviceId === srv.serviceId;
              return (
                <TouchableOpacity
                  key={srv.serviceId}
                  style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
                  onPress={() => setSelectedService(srv)}
                >
                  <View style={styles.serviceHeaderRow}>
                    <Text style={[styles.serviceName, isSelected && styles.serviceNameSelected]}>
                      {srv.name}
                    </Text>
                    <Text style={styles.serviceDuration}>~{srv.estimatedDurationMinutes}m</Text>
                  </View>
                  <Text style={styles.serviceDesc}>{srv.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Step 3: Available Smart Arrival Slots */}
        <View style={styles.stepSection}>
          <Text style={styles.stepLabel}>3. SELECT SMART ARRIVAL SLOT</Text>
          <Text style={styles.slotExplainer}>
            Arrival slots are throttled to ensure lobby density remains below 60%.
          </Text>
          <View style={styles.slotGrid}>
            {availableSlots.map((slot) => {
              const isSelected = selectedSlot === slot.time;
              return (
                <TouchableOpacity
                  key={slot.time}
                  style={[styles.slotCard, isSelected && styles.slotCardSelected]}
                  onPress={() => setSelectedSlot(slot.time)}
                >
                  <Text style={[styles.slotTime, isSelected && styles.slotTimeSelected]}>
                    {slot.time}
                  </Text>
                  <Text style={styles.slotWait}>{slot.estWait}</Text>
                  {slot.recommended && (
                    <View style={styles.recommendedPill}>
                      <Text style={styles.recommendedText}>Recommended</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Bar */}
      <View style={styles.footerBar}>
        <View>
          <Text style={styles.footerLabel}>Slot: {selectedSlot} Today</Text>
          <Text style={styles.footerValue}>{activeService?.name || 'General'}</Text>
        </View>
        <TouchableOpacity style={styles.confirmButton} activeOpacity={0.85} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>Issue Digital Token →</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5EAF1',
  },
  backBtn: {
    marginBottom: 8,
  },
  backBtnText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#172033',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
    gap: 24,
  },
  stepSection: {
    gap: 10,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  pillList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deptPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAF1',
  },
  deptPillSelected: {
    backgroundColor: '#142B4A',
    borderColor: '#142B4A',
  },
  deptPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#172033',
  },
  deptPillTextSelected: {
    color: '#FFFFFF',
  },
  serviceCards: {
    gap: 10,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5EAF1',
  },
  serviceCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  serviceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#172033',
    flex: 1,
  },
  serviceNameSelected: {
    color: '#1D4ED8',
  },
  serviceDuration: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  serviceDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  slotExplainer: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5EAF1',
    alignItems: 'center',
  },
  slotCardSelected: {
    borderColor: '#142B4A',
    borderWidth: 2,
    backgroundColor: '#F0F4F8',
  },
  slotTime: {
    fontSize: 16,
    fontWeight: '800',
    color: '#172033',
  },
  slotTimeSelected: {
    color: '#142B4A',
  },
  slotWait: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  recommendedPill: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6,
  },
  recommendedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#166534',
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5EAF1',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4,
  },
  footerLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  footerValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#172033',
    maxWidth: 160,
  },
  confirmButton: {
    backgroundColor: '#142B4A',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
