/**
 * StudentChecklist Component - Accordion-style checklist with 3 sections
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TripStudent } from '../../types/api.types';
import { StudentCard } from './StudentCard';

interface StudentChecklistProps {
  students: TripStudent[];
  onBoardingPress: (student: TripStudent) => void;
  onAlightingPress: (student: TripStudent) => void;
  onAbsentPress: (student: TripStudent) => void;
  isLoading?: boolean;
  isCompacting?: boolean;
}

interface Section {
  title: string;
  data: TripStudent[];
  count: number;
  type: 'pending' | 'boarded' | 'alighted';
}

export function StudentChecklist({
  students,
  onBoardingPress,
  onAlightingPress,
  onAbsentPress,
  isLoading = false,
  isCompacting = false,
}: StudentChecklistProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['pending'])
  );

  // Filter students by section
  const pendingStudents = students.filter((s) => s.boardingStatus === 'PENDING');
  const boardedStudents = students.filter((s) => s.boardingStatus === 'BOARDED');
  const alightedStudents = students.filter((s) => s.boardingStatus === 'ALIGHTED');

  // Section data
  const sections: Section[] = [
    {
      title: 'Pending Pickup',
      data: pendingStudents,
      count: pendingStudents.length,
      type: 'pending',
    },
    {
      title: 'Boarded',
      data: boardedStudents,
      count: boardedStudents.length,
      type: 'boarded',
    },
    {
      title: 'Alighted',
      data: alightedStudents,
      count: alightedStudents.length,
      type: 'alighted',
    },
  ];

  const toggleSection = (sectionTitle: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionTitle)) {
      newExpanded.delete(sectionTitle);
    } else {
      newExpanded.add(sectionTitle);
    }
    setExpandedSections(newExpanded);
  };

  const getSectionColor = (type: 'pending' | 'boarded' | 'alighted') => {
    switch (type) {
      case 'pending':
        return '#F59E0B';
      case 'boarded':
        return '#10B981';
      case 'alighted':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const getSectionIcon = (type: 'pending' | 'boarded' | 'alighted') => {
    switch (type) {
      case 'pending':
        return 'schedule';
      case 'boarded':
        return 'check-circle';
      case 'alighted':
        return 'done-all';
      default:
        return 'info';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading students...</Text>
      </View>
    );
  }

  if (students.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="groups" size={48} color="#D1D5DB" />
        <Text style={styles.emptyText}>No students assigned to this trip</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary badge */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>{students.length}</Text>
        </View>
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
            {pendingStudents.length}
          </Text>
        </View>
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryLabel}>Boarded</Text>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>
            {boardedStudents.length}
          </Text>
        </View>
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryLabel}>Alighted</Text>
          <Text style={[styles.summaryValue, { color: '#3B82F6' }]}>
            {alightedStudents.length}
          </Text>
        </View>
      </View>

      {/* Sections */}
      <View style={styles.sectionsContainer}>
        {sections.map((section) => (
          <View key={section.type} style={styles.section}>
            {/* Section Header */}
            <TouchableOpacity
              style={[
                styles.sectionHeader,
                {
                  borderLeftColor: getSectionColor(section.type),
                },
              ]}
              onPress={() => toggleSection(section.title)}
            >
              <View style={styles.headerContent}>
                <MaterialIcons
                  name={getSectionIcon(section.type) as any}
                  size={20}
                  color={getSectionColor(section.type)}
                />
                <View style={styles.headerText}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionCount}>
                    {section.count} student{section.count !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              {/* Expand/Collapse indicator */}
              <View
                style={{
                  transform: [
                    {
                      rotate: expandedSections.has(section.title) ? '180deg' : '0deg',
                    },
                  ],
                }}
              >
                <MaterialIcons name="expand-more" size={24} color="#6B7280" />
              </View>
            </TouchableOpacity>

            {/* Section Items */}
            {expandedSections.has(section.title) && (
              <View style={styles.sectionContent}>
                {section.data.length === 0 ? (
                  <View style={styles.emptySectionMessage}>
                    <Text style={styles.emptySectionText}>
                      No students in this section
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={section.data}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <StudentCard
                        student={item}
                        section={section.type}
                        onBoardingPress={onBoardingPress}
                        onAlightingPress={onAlightingPress}
                        onAbsentPress={onAbsentPress}
                      />
                    )}
                    scrollEnabled={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                  />
                )}
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Compacting indicator */}
      {isCompacting && (
        <View style={styles.compactingBanner}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.compactingText}>Updating student status...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  summaryBadge: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionsContainer: {
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  section: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderLeftWidth: 4,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  sectionCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  sectionContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  separator: {
    height: 0,
  },
  emptySectionMessage: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptySectionText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  compactingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  compactingText: {
    fontSize: 12,
    color: '#0284C7',
  },
});
