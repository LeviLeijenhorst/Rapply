// TODO: write documentation about fonts and typography along with guides on how to add custom fonts in own
// markdown file and add links from here

import { Platform } from "react-native"
import {
  Catamaran_300Light as catamaranLight,
  Catamaran_400Regular as catamaranRegular,
  Catamaran_500Medium as catamaranMedium,
  Catamaran_600SemiBold as catamaranSemiBold,
  Catamaran_700Bold as catamaranBold,
} from "@expo-google-fonts/catamaran"

export const customFontsToLoad = {
  catamaranLight,
  catamaranRegular,
  catamaranMedium,
  catamaranSemiBold,
  catamaranBold,
}

const fonts = {
  catamaran: {
    // Cross-platform Google font.
    light: "catamaranLight",
    normal: "catamaranRegular",
    medium: "catamaranMedium",
    semiBold: "catamaranSemiBold",
    bold: "catamaranBold",
  },
  helveticaNeue: {
    // iOS only font.
    thin: "HelveticaNeue-Thin",
    light: "HelveticaNeue-Light",
    normal: "Helvetica Neue",
    medium: "HelveticaNeue-Medium",
  },
  courier: {
    // iOS only font.
    normal: "Courier",
  },
  sansSerif: {
    // Android only font.
    thin: "sans-serif-thin",
    light: "sans-serif-light",
    normal: "sans-serif",
    medium: "sans-serif-medium",
  },
  monospace: {
    // Android only font.
    normal: "monospace",
  },
}

export const typography = {
  /**
   * The fonts are available to use, but prefer using the semantic name.
   */
  fonts,
  /**
   * The primary font. Used in most places.
   */
  primary: fonts.catamaran,
  /**
   * An alternate font used for perhaps titles and stuff.
   */
  secondary: Platform.select({ ios: fonts.helveticaNeue, android: fonts.sansSerif }),
  /**
   * Lets get fancy with a monospace font!
   */
  code: Platform.select({ ios: fonts.courier, android: fonts.monospace }),
}
