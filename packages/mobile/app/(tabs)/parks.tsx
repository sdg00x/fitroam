import { View, Text } from 'react-native'
import { useTheme } from '../../src/theme/useTheme'

export default function ParksScreen() {
  const { colors, typography } = useTheme()
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <Text style={{ color: colors.textMuted, fontSize: typography.size.body }}>Parks — coming soon</Text>
    </View>
  )
}