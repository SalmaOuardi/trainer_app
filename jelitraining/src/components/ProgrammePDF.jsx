import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const GOLD = "#C9A84C";
const INK = "#111111";

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: INK, paddingBottom: 60 },
  header: { backgroundColor: INK, padding: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logo: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#fff", letterSpacing: 1 },
  logoGold: { color: GOLD },
  headerRight: { textAlign: "right", color: "#bbbbbb", fontSize: 9, lineHeight: 1.5 },
  body: { padding: 32 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#888888", marginBottom: 18 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 20 },
  badge: { backgroundColor: "#f5f5f5", borderRadius: 4, paddingVertical: 5, paddingHorizontal: 10, fontSize: 9, fontFamily: "Helvetica-Bold", marginRight: 6, marginBottom: 6 },
  badgeAccent: { color: GOLD },
  sectionTitle: { fontSize: 8, textTransform: "uppercase", letterSpacing: 1, color: "#999999", fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1.5, borderBottomColor: GOLD },
  infoBox: { backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee", borderRadius: 4, padding: 10, fontSize: 10, color: "#555555", lineHeight: 1.5 },
  nutriGrid: { flexDirection: "row", gap: 6, marginTop: 6 },
  nutriCardMain: { flex: 2, backgroundColor: INK, borderRadius: 4, padding: 10, borderWidth: 1, borderColor: GOLD },
  nutriCard: { flex: 1, backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eeeeee", borderRadius: 4, padding: 10 },
  nutriLabel: { fontSize: 7, textTransform: "uppercase", letterSpacing: 0.5, color: "#999999", fontFamily: "Helvetica-Bold", marginBottom: 4 },
  nutriLabelDark: { color: "#bbbbbb" },
  nutriVal: { fontSize: 18, fontFamily: "Helvetica-Bold", color: INK },
  nutriValDark: { color: GOLD },
  nutriUnit: { fontSize: 9, fontFamily: "Helvetica", color: "#aaaaaa" },
  macros: { flexDirection: "row", marginTop: 6, fontSize: 9, fontFamily: "Helvetica-Bold" },
  macroItem: { marginRight: 10 },
  table: { marginTop: 6, borderWidth: 1, borderColor: "#eeeeee", borderRadius: 4, overflow: "hidden" },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  trAlt: { backgroundColor: "#fafafa" },
  trLast: { borderBottomWidth: 0 },
  th: { backgroundColor: INK, color: GOLD, padding: 8, fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  td: { padding: 8, fontSize: 10, color: INK },
  colNum: { width: "7%" },
  colName: { width: "33%" },
  colSets: { width: "11%" },
  colReps: { width: "14%" },
  colRest: { width: "11%" },
  colNotes: { width: "24%" },
  num: { fontFamily: "Helvetica-Bold", color: GOLD, fontSize: 12 },
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, paddingTop: 10, borderTopWidth: 1.5, borderTopColor: GOLD, flexDirection: "row", justifyContent: "space-between" },
  footerLogo: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  footerRight: { fontSize: 8, color: "#888888", textAlign: "right", lineHeight: 1.5 },
});

export function ProgrammePDF({ client, prog, nutri, calTarget, coach, fdate, today }) {
  const goal = prog.goal || "maintien";
  const protG = Math.round((client.weight || 0) * 2);
  const eauL = ((client.weight || 0) * 0.035).toFixed(1);
  const meals = client.mealsPerDay || 3;

  return (
    <Document title={`Programme ${client.firstName} ${client.lastName}`} author={coach.fullName}>
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <Text style={s.logo}>JELI<Text style={s.logoGold}>TRAINING</Text></Text>
          <View style={s.headerRight}>
            <Text>{coach.title}{coach.city ? ` · ${coach.city}` : ""}</Text>
            {coach.email ? <Text>{coach.email}</Text> : null}
            {coach.insta ? <Text>{coach.insta}</Text> : null}
          </View>
        </View>

        <View style={s.body}>
          <Text style={s.title}>{prog.title || "Programme"}</Text>
          <Text style={s.subtitle}>
            Client : {client.firstName} {client.lastName}
            {client.weight ? ` · ${client.weight}kg` : ""} · Généré le {fdate(today())}
          </Text>

          <View style={s.metaRow}>
            <Text style={s.badge}>Durée : <Text style={s.badgeAccent}>{prog.duration} semaines</Text></Text>
            <Text style={s.badge}>Fréquence : <Text style={s.badgeAccent}>{prog.days} j/sem</Text></Text>
            <Text style={s.badge}>Niveau : <Text style={s.badgeAccent}>{prog.level}</Text></Text>
            {prog.goal ? <Text style={s.badge}>Objectif : <Text style={s.badgeAccent}>{prog.goal}</Text></Text> : null}
          </View>

          {nutri && calTarget && (
            <>
              <Text style={s.sectionTitle}>Bilan nutritionnel personnalisé</Text>
              <View style={s.nutriGrid}>
                <View style={s.nutriCardMain}>
                  <Text style={[s.nutriLabel, s.nutriLabelDark]}>Objectif calorique ({goal})</Text>
                  <Text style={[s.nutriVal, s.nutriValDark]}>
                    {calTarget.cal} <Text style={s.nutriUnit}>kcal/jour</Text>
                  </Text>
                  <View style={s.macros}>
                    <Text style={[s.macroItem, { color: "#5aaccc" }]}>P : {calTarget.prot}g</Text>
                    <Text style={[s.macroItem, { color: GOLD }]}>L : {calTarget.lip}g</Text>
                    <Text style={[s.macroItem, { color: "#9a77cc" }]}>G : {calTarget.gluc}g</Text>
                  </View>
                </View>
                <View style={s.nutriCard}>
                  <Text style={s.nutriLabel}>Maintien</Text>
                  <Text style={s.nutriVal}>{nutri.maintien.cal} <Text style={s.nutriUnit}>kcal</Text></Text>
                </View>
                <View style={s.nutriCard}>
                  <Text style={s.nutriLabel}>Perte MG</Text>
                  <Text style={s.nutriVal}>{nutri.perteMG.cal} <Text style={s.nutriUnit}>kcal</Text></Text>
                </View>
                <View style={s.nutriCard}>
                  <Text style={s.nutriLabel}>Prise masse</Text>
                  <Text style={s.nutriVal}>{nutri.priseMasse.cal} <Text style={s.nutriUnit}>kcal</Text></Text>
                </View>
              </View>
              <View style={[s.infoBox, { marginTop: 8 }]}>
                <Text>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>Protéines :</Text> {protG}g/jour  ·
                  <Text style={{ fontFamily: "Helvetica-Bold" }}> Eau :</Text> {eauL}L/jour  ·
                  <Text style={{ fontFamily: "Helvetica-Bold" }}> {meals} repas :</Text> ~{Math.round(calTarget.cal / meals)} kcal/repas
                </Text>
                {client.restrictions ? (
                  <Text style={{ marginTop: 4 }}>
                    <Text style={{ fontFamily: "Helvetica-Bold" }}>Restrictions :</Text> {client.restrictions}
                  </Text>
                ) : null}
              </View>
            </>
          )}

          <Text style={s.sectionTitle}>Échauffement</Text>
          <View style={s.infoBox}><Text>{prog.warmup}</Text></View>

          <Text style={s.sectionTitle}>Programme d'exercices</Text>
          <View style={s.table}>
            <View style={s.tr}>
              <Text style={[s.th, s.colNum]}>#</Text>
              <Text style={[s.th, s.colName]}>Exercice</Text>
              <Text style={[s.th, s.colSets]}>Séries</Text>
              <Text style={[s.th, s.colReps]}>Répétitions</Text>
              <Text style={[s.th, s.colRest]}>Repos</Text>
              <Text style={[s.th, s.colNotes]}>Notes coach</Text>
            </View>
            {prog.exercises.map((ex, i) => {
              const isLast = i === prog.exercises.length - 1;
              const rowStyle = [s.tr, i % 2 === 1 ? s.trAlt : null, isLast ? s.trLast : null];
              return (
                <View key={ex.id || i} style={rowStyle} wrap={false}>
                  <Text style={[s.td, s.colNum, s.num]}>{i + 1}</Text>
                  <Text style={[s.td, s.colName, { fontFamily: "Helvetica-Bold" }]}>{ex.name || "—"}</Text>
                  <Text style={[s.td, s.colSets]}>{ex.sets}</Text>
                  <Text style={[s.td, s.colReps]}>{ex.reps}</Text>
                  <Text style={[s.td, s.colRest]}>{ex.rest}s</Text>
                  <Text style={[s.td, s.colNotes, { color: "#888888" }]}>{ex.notes || "—"}</Text>
                </View>
              );
            })}
          </View>

          <Text style={s.sectionTitle}>Retour au calme</Text>
          <View style={s.infoBox}><Text>{prog.cooldown}</Text></View>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerLogo}>JELI<Text style={s.logoGold}>TRAINING</Text></Text>
          <View style={s.footerRight}>
            <Text>{coach.fullName} · {coach.title}</Text>
            <Text>{coach.email}{coach.insta ? ` · ${coach.insta}` : ""}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
