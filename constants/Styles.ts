// styles.ts
import { StyleSheet } from "react-native";
import { Colors } from "@/hooks/useThemeColor";
import { FontSizes } from "./Fonts";

const global = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  rowsSpaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowsGapSpaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 5,
  },
  rowsGapFlexStart: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 5,
    alignItems: "center",
  },
  columnsGapSpaceBetween: {
    flexDirection: "column",
    gap: 5,
  },
  paddingHV: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  // Companent Styles
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: "space-between",
  },
  containerSafe: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: "space-between",
    paddingHorizontal: 20,

  },
  footer: {
    position: "absolute",
    bottom: 30,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  statusBar: {
    paddingTop: 50,
    backgroundColor: Colors.lightWhite,
  },
  label: {
    fontFamily: "regular",
    color: Colors.description,
    fontSize: FontSizes.small,
    marginTop: 10,
    marginBottom: 5,
    marginEnd: 5,
    textAlign: "right",
  },
  boxIcon: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default global;
