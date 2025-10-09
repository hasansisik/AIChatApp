/**
 * useThemedStyles hook - React Native uygulaması için temaya dayalı stil oluşturucu
 */

import { StyleSheet } from 'react-native';
import { useTheme, ThemeColors } from './useThemeColor';

// StyleCreator tipi - Renk paletini alıp stil nesnesini döndüren fonksiyon
type StyleCreator<T> = (colors: ThemeColors) => T;

// useThemedStyles hook - Tema değiştiğinde otomatik olarak güncellenen stiller oluşturur
export const useThemedStyles = <T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  styleCreator: StyleCreator<T>
): T => {
  const { colors } = useTheme();
  return StyleSheet.create(styleCreator(colors));
};

/**
 * Kullanım örneği:
 * 
 * const styles = useThemedStyles((colors) => ({
 *   container: {
 *     backgroundColor: Colors.lightWhite,
 *     flex: 1,
 *   },
 *   text: {
 *     color: colors.text,
 *     fontSize: 16,
 *   },
 * }));
 * 
 * // Bileşen içinde doğrudan kullanım
 * return (
 *   <View style={styles.container}>
 *     <Text style={styles.text}>Hello World</Text>
 *   </View>
 * );
 */ 