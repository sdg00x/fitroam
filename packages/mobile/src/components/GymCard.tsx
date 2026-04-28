import React from 'react'
import {
  View, Text, TouchableOpacity,
  StyleSheet, StyleProp, ViewStyle,
} from 'react-native'
import { useTheme } from '../theme/useTheme'
import { MatchBadge } from './MatchBadge'

export interface GymCardData {
  id:              string
  name:            string
  address:         string
  distanceMinutes: number
  equipmentTags:   string[]
  rating:          number | null
  openNow:         boolean
  matchScore:      number
  matchReasons:    string[]
  priceDisplay:    string
  priceSubDisplay: string
}

interface Props {
  gym:       GymCardData
  variant?:  'featured' | 'compact'
  onPress?:  (gym: GymCardData) => void
  onGoHere?: (gym: GymCardData) => void
  style?:    StyleProp<ViewStyle>
}

export function GymCard({
  gym,
  variant = 'featured',
  onPress,
  onGoHere,
  style,
}: Props) {
  const { colors, typography, spacing, radius } = useTheme()

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        onPress={() => onPress?.(gym)}
        activeOpacity={0.8}
        style={[
          styles.compact,
          {
            backgroundColor: colors.surface,
            borderRadius:    radius.listRow,
            borderColor:     colors.border,
            padding:         spacing.cardPadding,
          },
          style,
        ]}
      >
        <View style={[styles.compactDot, { backgroundColor: colors.surfaceRaised, borderRadius: radius.tag }]} />
        <View style={styles.compactInfo}>
          <Text style={{
            fontSize:   typography.size.bodySmall,
            fontWeight: typography.weight.bold,
            color:      colors.textPrimary,
          }}>
            {gym.name}
          </Text>
          <Text style={{
            fontSize: typography.size.tag,
            color:    colors.textMuted,
            marginTop: 2,
          }}>
            {gym.distanceMinutes} min · {gym.matchReasons[0] ?? ''}
          </Text>
        </View>
        <View style={styles.compactRight}>
          <Text style={{
            fontSize:   typography.size.label,
            fontWeight: typography.weight.heavy,
            color:      colors.accent,
          }}>
            {gym.matchScore}%
          </Text>
          <Text style={{
            fontSize: typography.size.tag,
            color:    colors.textMuted,
            marginTop: 2,
          }}>
            {gym.priceDisplay}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  // Featured card
  return (
    <TouchableOpacity
      onPress={() => onPress?.(gym)}
      activeOpacity={0.85}
      style={[
        styles.featured,
        {
          backgroundColor: colors.surface,
          borderRadius:    radius.card,
          borderColor:     colors.border,
        },
        style,
      ]}
    >
      {/* Card header */}
      <View style={[
        styles.featuredHeader,
        {
          backgroundColor: colors.surfaceRaised,
          padding:         spacing.cardPadding,
        }
      ]}>
        <View style={styles.headerLeft}>
          <Text style={{
            fontSize:    typography.size.cardTitle,
            fontWeight:  typography.weight.heavy,
            color:       colors.textPrimary,
            letterSpacing: -0.3,
          }}>
            {gym.name}
          </Text>
          <Text style={{
            fontSize:  typography.size.tag,
            color:     colors.textMuted,
            marginTop: 3,
          }}>
            {gym.distanceMinutes} min walk
            {gym.openNow ? ' · Open now' : ' · Closed'}
          </Text>
        </View>
        <MatchBadge score={gym.matchScore} isTop />
      </View>

      {/* Tags */}
      <View style={[styles.tagsRow, { padding: spacing.cardPadding }]}>
        {gym.equipmentTags.slice(0, 4).map(tag => (
          <View
            key={tag}
            style={[
              styles.tag,
              {
                backgroundColor: colors.surfaceRaised,
                borderRadius:    radius.tag,
                borderColor:     colors.border,
              }
            ]}
          >
            <Text style={{
              fontSize:    typography.size.tag,
              fontWeight:  typography.weight.semibold,
              color:       colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 0.03,
            }}>
              {tag.replace(/_/g, ' ')}
            </Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={[
        styles.featuredFooter,
        {
          backgroundColor: colors.surfaceFooter,
          padding:         spacing.cardPadding,
          borderRadius:    radius.card,
        }
      ]}>
        <View>
          <Text style={{
            fontSize:   typography.size.bodySmall,
            fontWeight: typography.weight.heavy,
            color:      colors.textPrimary,
          }}>
            {gym.priceDisplay}
          </Text>
          {gym.priceSubDisplay ? (
            <Text style={{
              fontSize:  typography.size.tag,
              color:     colors.textMuted,
              marginTop: 2,
            }}>
              {gym.priceSubDisplay}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() => onGoHere?.(gym)}
          activeOpacity={0.8}
          style={[
            styles.goBtn,
            {
              backgroundColor: colors.accent,
              borderRadius:    radius.button,
            }
          ]}
        >
          <Text style={{
            fontSize:    typography.size.tag,
            fontWeight:  typography.weight.heavy,
            color:       colors.accentText,
            textTransform: 'uppercase',
            letterSpacing: 0.04,
          }}>
            I'm going
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  featured: {
    borderWidth:  1,
    overflow:     'hidden',
    marginBottom: 10,
  },
  featuredHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           5,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderWidth:       1,
  },
  featuredFooter: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  goBtn: {
    paddingHorizontal: 14,
    paddingVertical:    7,
  },
  compact: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    borderWidth:   1,
    marginBottom:  8,
  },
  compactDot: {
    width:  36,
    height: 36,
  },
  compactInfo: {
    flex: 1,
  },
  compactRight: {
    alignItems: 'flex-end',
  },
})