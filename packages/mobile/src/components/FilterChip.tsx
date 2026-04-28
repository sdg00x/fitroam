import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { useTheme } from '../theme/useTheme'

interface Props {
  label:    string
  active:   boolean
  onPress:  () => void
}

export function FilterChip({ label, active, onPress }: Props) {
  const { colors, typography, radius, spacing } = useTheme()

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.accent       : colors.surfaceRaised,
          borderRadius:    radius.tag,
          paddingHorizontal: spacing.md,
          paddingVertical:   spacing.xs,
        }
      ]}
    >
      <Text style={{
        color:       active ? colors.accentText : colors.textSecondary,
        fontSize:    typography.size.label,
        fontWeight:  typography.weight.semibold,
        letterSpacing: 0.02,
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexShrink: 0,
  },
})