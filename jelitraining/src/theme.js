export const C = {
  gold: "#C9A84C", goldLight: "#E8C56A",
  goldAlpha: "rgba(201,168,76,0.12)", goldBorder: "rgba(201,168,76,0.3)",
  bg: "#080808", s1: "#101010", s2: "#181818", s3: "#232323",
  border: "#2a2a2a", text: "#EFEFEF", muted: "#777", muted2: "#444",
  green: "#5aaa5a", greenAlpha: "rgba(90,170,90,0.15)",
  red: "#cc4444", redAlpha: "rgba(204,68,68,0.12)",
  orange: "#cc8833", orangeAlpha: "rgba(204,136,51,0.12)",
  // Shadows for depth
  shadow1: "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)",
  shadow2: "0 4px 14px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.3)",
  shadow3: "0 10px 30px rgba(0,0,0,0.5), 0 4px 10px rgba(0,0,0,0.35)",
  shadowGold: "0 4px 20px rgba(201,168,76,0.15)",
};

export const iStyle = {
  width: "100%", backgroundColor: C.s3, border: `1px solid ${C.border}`,
  borderRadius: 10, padding: "11px 14px", color: C.text, fontSize: 14,
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  transition: "border-color 0.2s, box-shadow 0.2s",
};
