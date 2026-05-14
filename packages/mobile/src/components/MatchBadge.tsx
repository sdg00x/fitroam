import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../theme/useTheme'

interface Props {
  score:   number
  isTop?:  boolean
}

export function MatchBadge({ score, isTop }: Props) {
  const { colors, typography, radius } = useTheme()

  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: colors.scoreBg,
        borderRadius:     radius.tag,
      }
    ]}>
      <Text style={[
        styles.text,
        {
          color:      colors.scoreText,
          fontSize:   typography.size.label,
          fontWeight: typography.weight.heavy,
        }
      ]}>
        {score}%{isTop ? ' match' : ''}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 9,
    paddingVertical:   3,
  },
  text: {
    letterSpacing: 0.2,
  },
})