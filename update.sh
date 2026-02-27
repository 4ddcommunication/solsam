#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  SOLSAM — Jährliches Update-Script
# ═══════════════════════════════════════════════════════════════
#
#  Dieses Script aktualisiert alle Dateien für das neue Jahr.
#  Einfach ausführen: ./update.sh
#
#  Was wird aktualisiert:
#  - Event-Nummer (z.B. 17. → 18.)
#  - Datum (z.B. "06. September 2025" → "05. September 2026")
#  - Meta-Titel & -Descriptions (automatisch)
#  - Alt-Texte der Bilder
#
#  NICHT automatisch: Logo-Bild & Hero-Bild (manuell ersetzen)
# ═══════════════════════════════════════════════════════════════

set -e
cd "$(dirname "$0")"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   SOLSAM — Jährliches Update            ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# --- Aktuelle Werte aus index.html lesen ---
CURRENT_NUM=$(grep -oP '\d+(?=\.\s*Solinger Schneidwaren Samstag)' index.html | head -1)
if [ -z "$CURRENT_NUM" ]; then
    CURRENT_NUM=$(grep -oP 'alt="\K\d+(?=\.)' index.html | head -1)
fi
echo "Aktuelle Event-Nummer: ${CURRENT_NUM}."

CURRENT_DATE=$(grep -oP '\d{2}\.\s+\w+\s+\d{4}' index.html | head -1)
echo "Aktuelles Datum: $CURRENT_DATE"
echo ""

# --- Neue Werte abfragen ---
read -p "Neue Event-Nummer (z.B. $((CURRENT_NUM + 1))): " NEW_NUM
NEW_NUM=${NEW_NUM:-$((CURRENT_NUM + 1))}

read -p "Neues Datum (z.B. 05. September 2026): " NEW_DATE
if [ -z "$NEW_DATE" ]; then
    echo "Fehler: Datum muss angegeben werden."
    exit 1
fi

# Neues Jahr aus Datum extrahieren
NEW_YEAR=$(echo "$NEW_DATE" | grep -oP '\d{4}')
CURRENT_YEAR=$(echo "$CURRENT_DATE" | grep -oP '\d{4}')

# Kurzes Datum (DD.MM.YYYY) aus Langform ableiten
get_short_date() {
    local long_date="$1"
    local day=$(echo "$long_date" | grep -oP '^\d{2}')
    local month_name=$(echo "$long_date" | grep -oP '[A-Za-zÄÖÜäöü]+')
    local year=$(echo "$long_date" | grep -oP '\d{4}')
    case "$month_name" in
        Januar)    mon="01" ;;
        Februar)   mon="02" ;;
        März)      mon="03" ;;
        April)     mon="04" ;;
        Mai)       mon="05" ;;
        Juni)      mon="06" ;;
        Juli)      mon="07" ;;
        August)    mon="08" ;;
        September) mon="09" ;;
        Oktober)   mon="10" ;;
        November)  mon="11" ;;
        Dezember)  mon="12" ;;
        *) echo "Unbekannter Monat: $month_name"; exit 1 ;;
    esac
    echo "${day}.${mon}.${year}"
}

NEW_SHORT_DATE=$(get_short_date "$NEW_DATE")
CURRENT_SHORT_DATE=$(get_short_date "$CURRENT_DATE")

echo ""
echo "Änderungen:"
echo "  Event-Nummer: ${CURRENT_NUM}. → ${NEW_NUM}."
echo "  Datum lang:   $CURRENT_DATE → $NEW_DATE"
echo "  Datum kurz:   $CURRENT_SHORT_DATE → $NEW_SHORT_DATE"
echo "  Jahr:         $CURRENT_YEAR → $NEW_YEAR"
echo ""
read -p "Korrekt? (j/N): " CONFIRM
if [ "$CONFIRM" != "j" ] && [ "$CONFIRM" != "J" ]; then
    echo "Abgebrochen."
    exit 0
fi

echo ""
echo "Aktualisiere Dateien..."

# --- Alle HTML-Dateien aktualisieren ---
FILES="index.html manufakturen.html galerie.html impressum.html datenschutz.html"

for f in $FILES; do
    if [ -f "$f" ]; then
        # Event-Nummer aktualisieren (z.B. "17." → "18." in Alt-Texten und Content)
        sed -i '' "s/${CURRENT_NUM}\. Solinger Schneidwaren Samstag/${NEW_NUM}. Solinger Schneidwaren Samstag/g" "$f"
        sed -i '' "s/alt=\"${CURRENT_NUM}\./alt=\"${NEW_NUM}./g" "$f"

        # Langes Datum aktualisieren
        sed -i '' "s/${CURRENT_DATE}/${NEW_DATE}/g" "$f"

        # Kurzes Datum aktualisieren (z.B. 06.09.2025 → 05.09.2026)
        sed -i '' "s/${CURRENT_SHORT_DATE}/${NEW_SHORT_DATE}/g" "$f"

        # Jahr in Config-Kommentar und Meta
        sed -i '' "s/Datum:         ${CURRENT_DATE}/Datum:         ${NEW_DATE}/g" "$f"

        echo "  ✓ $f"
    fi
done

# --- Config-Kommentar in index.html aktualisieren ---
sed -i '' "s/Event-Nummer:  ${CURRENT_NUM}\./Event-Nummer:  ${NEW_NUM}./g" index.html

echo ""
echo "═══════════════════════════════════════════"
echo ""
echo "Automatische Änderungen abgeschlossen!"
echo ""
echo "MANUELLE SCHRITTE:"
echo "  1. Neues Logo ersetzen:  images/logo.jpg"
echo "  2. Neues Hero-Bild:     images/hero-bg.jpg (falls nötig)"
echo "  3. Stempelkarte PDF:    pdfs/stempelkarte-${CURRENT_YEAR}.pdf"
echo "     → Neue PDF hochladen und in index.html Dateinamen anpassen"
echo ""
echo "Dann committen und pushen:"
echo "  git add -A && git commit -m 'Update auf ${NEW_NUM}. SOLSAM ${NEW_YEAR}' && git push"
echo ""
echo "Das Deployment auf Hostinger erfolgt automatisch!"
echo ""
