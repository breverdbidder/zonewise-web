import { useState, useEffect, useRef, useMemo } from "react";

// ═══════════════════════════════════════════════════════════
// ZONEWISE.AI — Site Feasibility Intelligence Platform
// Proprietary IP of Everest Capital USA / BidDeed.AI
// ═══════════════════════════════════════════════════════════

const MAPBOX_TOKEN = "pk.eyJ1IjoiZXZlcmVzdDE4IiwiYSI6ImNtanB5cDQ5ZzF1eWgzaHB2cGVhZXdqbjMifQ.4RPrkTf84GL1-clmhmCnTw"; // nosemgrep: generic.secrets.security.detected-jwt-token.detected-jwt-token -- public Mapbox pk. token, safe for client exposure by design (verified noise, recon #18878)

const COLORS = {
  brand: "#0D9488",       // teal-600 — primary
  brandDark: "#0F766E",   // teal-700
  brandLight: "#CCFBF1",  // teal-100
  accent: "#F59E0B",      // amber-500
  navy: "#0F172A",        // slate-900
  surface: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  success: "#059669",
  danger: "#DC2626",
  info: "#2563EB",
};

const fmt = (n) => new Intl.NumberFormat("en-US").format(Math.round(n));
const fmtD = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

// ── Demo Data (Satellite Beach, FL example for Brevard County) ──
const SITE = {
  address: "1233 Highway A1A, Satellite Beach, FL 32937",
  parcelId: "26-37-03-76-00012.0-0001.00",
  parcelValue: 485000,
  ownership: "COASTAL HOLDINGS LLC",
  zone: "GU (General Use)",
  zoneCity: "Satellite Beach",
  county: "Brevard",
  flood: "AE",
  qoz: "No",
  lotArea: 12500,
  maxHeight: 35,
  far: 2.0,
  coverage: 0.50,
  setFront: 25,
  setSide: 10,
  setRear: 20,
  parking: 1.5,
  yearBuilt: 1972,
  livingUnits: 1,
  lat: 28.1764,
  lng: -80.5901,
};

const COMPS = [
  { name: "Oceanfront Villas", addr: "1100 Hwy A1A", units: 24, year: 2019, occ: 96, one: 1850, two: 2400 },
  { name: "Beach Walk Apts", addr: "455 Jackson Ave", units: 16, year: 2021, occ: 98, one: 1750, two: 2250 },
  { name: "Pelican Landing", addr: "700 S Patrick Dr", units: 32, year: 2018, occ: 95, one: 1650, two: 2100 },
  { name: "Atlantic Breeze", addr: "890 Hwy A1A", units: 20, year: 2020, occ: 97, one: 1900, two: 2500 },
  { name: "Sea Grape Commons", addr: "320 Desoto Pkwy", units: 12, year: 2022, occ: 99, one: 1800, two: 2350 },
];

const UNIT_RENTS = [
  { type: "Studio", rent: 1450, sf: 425, psf: 3.41 },
  { type: "One BR", rent: 1790, sf: 650, psf: 2.75 },
  { type: "Two BR", rent: 2320, sf: 950, psf: 2.44 },
  { type: "Three BR", rent: 2850, sf: 1250, psf: 2.28 },
];

const MIX = [
  { type: "Studio", pct: 10, sf: 425, rent: 1450 },
  { type: "One BR", pct: 40, sf: 650, rent: 1790 },
  { type: "Two BR", pct: 35, sf: 950, rent: 2320 },
  { type: "Three BR", pct: 15, sf: 1250, rent: 2850 },
];

const ZONING_CONTROLS = [
  { control: "Max Height", value: "35 ft", assumption: "GU residential maximum (Brevard County)", citation: "§62-1334" },
  { control: "FAR", value: "2.0", assumption: "General Use district standard", citation: "§62-1336" },
  { control: "Lot Coverage", value: "50%", assumption: "Impervious surface maximum", citation: "§62-1338" },
  { control: "Front Setback", value: "25 ft", assumption: "Arterial road (A1A) requirement", citation: "§62-1340" },
  { control: "Side Setback", value: "10 ft", assumption: "Interior lot minimum", citation: "§62-1340" },
  { control: "Rear Setback", value: "20 ft", assumption: "Standard rear yard", citation: "§62-1340" },
  { control: "Parking", value: "1.5/unit", assumption: "Multifamily residential requirement", citation: "§62-1400" },
];

// ══════════════════════════════════════════
// COMPONENTS
// ══════════════════════════════════════════

function Nav({ tab, setTab }) {
  const tabs = ["Site", "Market", "Comps", "Capacity", "Develop", "Export"];
  return (
    <div style={{
      display: "flex", alignItems: "center", borderBottom: `2px solid ${COLORS.border}`,
      background: COLORS.navy, padding: "0 24px", height: 54, position: "sticky", top: 0, zIndex: 100,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 36 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6, background: `linear-gradient(135deg, ${COLORS.brand}, ${COLORS.accent})`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff",
        }}>Z</div>
        <span style={{ fontWeight: 700, fontSize: 17, color: "#fff", fontFamily: "'Space Grotesk','DM Sans',sans-serif", letterSpacing: "-0.5px" }}>
          ZoneWise<span style={{ color: COLORS.accent }}>.AI</span>
        </span>
      </div>
      {tabs.map((t) => (
        <button key={t} onClick={() => setTab(t)} style={{
          background: "none", border: "none", padding: "16px 16px", cursor: "pointer", fontSize: 13,
          fontFamily: "'DM Sans',sans-serif", fontWeight: 500, transition: "all .15s",
          color: tab === t ? "#fff" : "rgba(255,255,255,0.5)",
          borderBottom: tab === t ? `2px solid ${COLORS.brand}` : "2px solid transparent", marginBottom: -2,
        }}>{t}</button>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{
        display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.08)",
        padding: "6px 14px", borderRadius: 8, cursor: "pointer",
      }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>💬</span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>Ask anything about this site...</span>
      </div>
      <div style={{ marginLeft: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ background: COLORS.brand, padding: "3px 10px", borderRadius: 12, fontSize: 10, color: "#fff", fontWeight: 600 }}>PRO</span>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: COLORS.brand, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>AS</div>
      </div>
    </div>
  );
}

function Badge({ text, color = COLORS.brand }) {
  return <span style={{ fontSize: 10, background: color + "15", color, padding: "2px 8px", borderRadius: 10, fontWeight: 600, marginLeft: 8 }}>{text}</span>;
}

function Card({ children, style = {} }) {
  return <div style={{ background: COLORS.card, borderRadius: 10, border: `1px solid ${COLORS.border}`, overflow: "hidden", ...style }}>{children}</div>;
}

function SectionLabel({ text }) {
  return <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontWeight: 600 }}>{text}</div>;
}

// ── Live Mapbox Map ──
function MapboxMap({ lat, lng, zoom = 16, pitch = 45, style: mapStyle = {} }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (mapRef.current) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js";
    script.onload = () => {
      try {
        window.mapboxgl.accessToken = MAPBOX_TOKEN;
        const map = new window.mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/satellite-streets-v12",
          center: [lng, lat],
          zoom,
          pitch,
          bearing: -17.6,
          antialias: true,
        });
        map.addControl(new window.mapboxgl.NavigationControl(), "top-right");
        new window.mapboxgl.Marker({ color: COLORS.brand })
          .setLngLat([lng, lat])
          .addTo(map);

        map.on("load", () => {
          map.addLayer({
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 15,
            paint: {
              "fill-extrusion-color": "#aaa",
              "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "height"]],
              "fill-extrusion-base": ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "min_height"]],
              "fill-extrusion-opacity": 0.6,
            },
          });

          // Parcel boundary (simulated rectangle around marker)
          const offset = 0.0004;
          map.addSource("parcel", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [[
                  [lng - offset, lat - offset * 0.6],
                  [lng + offset, lat - offset * 0.6],
                  [lng + offset, lat + offset * 0.6],
                  [lng - offset, lat + offset * 0.6],
                  [lng - offset, lat - offset * 0.6],
                ]],
              },
            },
          });
          map.addLayer({
            id: "parcel-fill",
            type: "fill",
            source: "parcel",
            paint: { "fill-color": COLORS.brand, "fill-opacity": 0.2 },
          });
          map.addLayer({
            id: "parcel-line",
            type: "line",
            source: "parcel",
            paint: { "line-color": COLORS.brand, "line-width": 2.5, "line-dasharray": [2, 1] },
          });
          setLoaded(true);
        });
        mapRef.current = map;
      } catch (e) {
        setError(e.message);
      }
    };
    script.onerror = () => setError("Failed to load Mapbox GL JS");
    document.head.appendChild(script);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng, zoom, pitch]);

  return (
    <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", ...mapStyle }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {!loaded && !error && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.navy }}>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Loading satellite imagery...</div>
        </div>
      )}
      {error && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#1e293b" }}>
          <div style={{ color: "#ef4444", fontSize: 12 }}>Map error: {error}</div>
        </div>
      )}
      <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.6)", padding: "3px 8px", borderRadius: 4, fontSize: 10, color: "#fff" }}>
        ZoneWise.AI · Mapbox Satellite
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// TAB: SITE
// ══════════════════════════════════════════
function SiteTab() {
  const [subTab, setSubTab] = useState("Summary");
  return (
    <div style={{ display: "flex", gap: 20 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {["Summary", "Zoning", "Map View"].map((t) => (
            <button key={t} onClick={() => setSubTab(t)} style={{
              padding: "8px 20px", borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: "pointer",
              border: `1px solid ${COLORS.border}`, fontFamily: "'DM Sans',sans-serif",
              background: subTab === t ? COLORS.brand : "#fff", color: subTab === t ? "#fff" : COLORS.textSecondary,
              transition: "all .15s",
            }}>{t}</button>
          ))}
        </div>

        {subTab === "Summary" && (
          <Card>
            <div style={{ padding: 20, borderBottom: `1px solid ${COLORS.border}`, background: `linear-gradient(135deg, ${COLORS.brandLight}, #fff)` }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.brand }}>AI Site Intelligence</span>
                <Badge text="Claude-Powered" color={COLORS.brand} />
              </div>
              {[
                ["Location & Zoning", `Satellite Beach site (32937) zoned ${SITE.zone}, allowing residential and commercial mixed-use. Prime A1A corridor with ocean proximity and high-income demographics ($82K median HH).`],
                ["Site Characteristics", `${fmt(SITE.lotArea)} sq ft lot with existing ${SITE.yearBuilt} structure. FEMA Zone ${SITE.flood} requires flood mitigation. Lot dimensions support multifamily redevelopment.`],
                ["Development Potential", `FAR ${SITE.far} allows up to ${fmt(SITE.lotArea * SITE.far)} SF buildable area. Height limit ${SITE.maxHeight} ft (3 stories). Strong MTR demand from KSC/PAFB contractors.`],
                ["Market Signal", `97% average occupancy in comp set. Low vacancy (5.2%) with rent growth +4.8% YoY. Permits up 12% in Brevard County trailing 12 months.`],
                ["Investment Thesis", `Mid-term rental sweet spot: $1,790/mo 1BR vs $2,320/mo 2BR. KSC/SpaceX workforce demand supports 95%+ occupancy. Below-market acquisition basis enables strong YoC.`],
              ].map(([title, text]) => (
                <div key={title} style={{ marginBottom: 10, fontSize: 13, lineHeight: 1.65, color: COLORS.textSecondary }}>
                  <strong style={{ color: COLORS.textPrimary }}>{title}:</strong> {text}
                </div>
              ))}
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 14 }}>Property Summary</div>
              {[
                ["Parcel", [
                  ["Parcel ID", SITE.parcelId], ["Assessed Value", fmtD(SITE.parcelValue)],
                  ["Ownership", SITE.ownership], ["Year Built", SITE.yearBuilt],
                ]],
                ["Zoning", [
                  ["District", SITE.zone], ["Municipality", SITE.zoneCity],
                  ["Opportunity Zone", SITE.qoz], ["FEMA Flood Zone", SITE.flood],
                ]],
                ["Market Context", [
                  ["County", SITE.county], ["Zip Code", "32937"],
                  ["Median HH Income", "$82,100"], ["Vacancy Rate", "5.2%"],
                ]],
              ].map(([section, rows]) => (
                <div key={section} style={{ marginBottom: 16 }}>
                  <SectionLabel text={section} />
                  {rows.map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, borderBottom: `1px solid ${COLORS.surface}` }}>
                      <span style={{ color: COLORS.textSecondary }}>{k}</span>
                      <span style={{ fontWeight: 500, color: COLORS.textPrimary }}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>
        )}

        {subTab === "Zoning" && (
          <Card>
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.brand }}>Zoning Analysis</span>
                <Badge text="Claude-Powered" color={COLORS.brand} />
              </div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 20 }}>Data source: Brevard County Land Development Code · Last synced: Feb 2026</div>

              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>1. District Overview</div>
              {[
                ["Site Address", SITE.address],
                ["Zoning District", `${SITE.zone}`],
                ["District Purpose", "General Use allows single-family, multifamily, and limited commercial. Supports mixed-use redevelopment along A1A corridor."],
                ["Jurisdiction", "City of Satellite Beach / Brevard County"],
              ].map(([k, v]) => (
                <div key={k} style={{ fontSize: 13, marginBottom: 8, lineHeight: 1.5 }}><strong>{k}:</strong> {v}</div>
              ))}

              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>2. Development Controls</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: COLORS.surface }}>
                      {["Control", "Value", "Basis", "Code Reference"].map((h) => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: COLORS.textSecondary, borderBottom: `2px solid ${COLORS.border}`, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ZONING_CONTROLS.map((r, i) => (
                      <tr key={r.control} style={{ borderBottom: `1px solid ${COLORS.surface}`, background: i % 2 === 0 ? "#fff" : COLORS.surface }}>
                        <td style={{ padding: "10px 12px", fontWeight: 600, color: COLORS.textPrimary }}>{r.control}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: COLORS.brand }}>{r.value}</td>
                        <td style={{ padding: "10px 12px", color: COLORS.textSecondary, fontSize: 11 }}>{r.assumption}</td>
                        <td style={{ padding: "10px 12px", color: COLORS.textMuted, fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{r.citation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ background: COLORS.brandLight, borderRadius: 8, padding: 14, marginTop: 20, border: `1px solid ${COLORS.brand}30` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.brandDark, marginBottom: 4 }}>💡 ZoneWise Insight</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.6 }}>
                  GU zoning with {SITE.maxHeight}ft height and {SITE.far} FAR supports a 3-story garden apartment or townhome product.
                  The {SITE.parking}/unit parking requirement is manageable with surface parking on a {fmt(SITE.lotArea)} SF lot.
                  Consider requesting variance for height to unlock a 4th story podium design.
                </div>
              </div>
            </div>
          </Card>
        )}

        {subTab === "Map View" && (
          <MapboxMap lat={SITE.lat} lng={SITE.lng} zoom={17} pitch={50} style={{ height: 480, borderRadius: 10 }} />
        )}
      </div>

      {/* Right sidebar */}
      <div style={{ width: 300, flexShrink: 0 }}>
        <SectionLabel text="Subject Property" />
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 12, lineHeight: 1.4 }}>{SITE.address}</div>
        <MapboxMap lat={SITE.lat} lng={SITE.lng} zoom={15} pitch={0} style={{ height: 180, borderRadius: 10, marginBottom: 16 }} />
        <Card style={{ padding: 16 }}>
          <SectionLabel text="Quick Stats" />
          {[
            ["Lot Area", `${fmt(SITE.lotArea)} SF`], ["Max Height", `${SITE.maxHeight} ft`], ["FAR", `${SITE.far}`],
            ["Max Coverage", `${SITE.coverage * 100}%`], ["Parking Req", `${SITE.parking}/unit`], ["Flood Zone", SITE.flood],
            ["Max Buildable", `${fmt(SITE.lotArea * SITE.far)} SF`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12, borderBottom: `1px solid ${COLORS.surface}` }}>
              <span style={{ color: COLORS.textSecondary }}>{k}</span>
              <span style={{ fontWeight: 600, color: COLORS.textPrimary, fontFamily: "'JetBrains Mono',monospace" }}>{v}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// TAB: MARKET
// ══════════════════════════════════════════
function MarketTab() {
  return (
    <div style={{ display: "flex", gap: 20 }}>
      <div style={{ flex: 1 }}>
        <Card style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>{SITE.county} County Market Intelligence</span>
            <Badge text="Live Data" color={COLORS.success} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[
              ["Median HH Income", "$82,100", "+3.8% YoY", COLORS.brand],
              ["Population Growth", "+2.6%", "2024–2025", COLORS.info],
              ["Building Permits", "2,147", "trailing 12mo", COLORS.accent],
              ["Median Home Price", "$345,000", "+5.2% YoY", COLORS.success],
              ["Avg Rent (1BR)", "$1,790", "+4.8% YoY", COLORS.brand],
              ["MF Vacancy", "5.2%", "32937 zip", COLORS.danger],
            ].map(([label, val, sub, color]) => (
              <div key={label} style={{ background: COLORS.surface, borderRadius: 8, padding: 14, borderLeft: `3px solid ${color}` }}>
                <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary, marginTop: 4, fontFamily: "'JetBrains Mono',monospace" }}>{val}</div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>{sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ background: COLORS.brandLight, borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.brandDark, marginBottom: 8 }}>🏠 HUD Fair Market Rent (2026)</div>
              {[["Studio", "$1,280"], ["1-BR", "$1,450"], ["2-BR", "$1,750"], ["3-BR", "$2,200"]].map(([t, v]) => (
                <div key={t} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
                  <span style={{ color: COLORS.textSecondary }}>{t}</span>
                  <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "#FEF3C7", borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#92400E", marginBottom: 8 }}>🚀 Key Employment Drivers</div>
              {["Kennedy Space Center", "Patrick SFB", "L3Harris Technologies", "Health First", "SpaceX / Blue Origin"].map((e) => (
                <div key={e} style={{ fontSize: 12, color: COLORS.textSecondary, padding: "3px 0" }}>• {e}</div>
              ))}
            </div>
          </div>

          <div style={{ background: COLORS.surface, borderRadius: 8, padding: 12, border: `1px solid ${COLORS.border}` }}>
            <SectionLabel text="Data Sources" />
            <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.6 }}>
              Census ACS 5-Year (2024) · Bureau of Labor Statistics · HUD FMR (2026) · Census Building Permits Survey · Brevard County Property Appraiser
            </div>
          </div>
        </Card>
      </div>
      <div style={{ width: 300, flexShrink: 0 }}>
        <SectionLabel text="Location Context" />
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 12 }}>{SITE.address}</div>
        <MapboxMap lat={SITE.lat} lng={SITE.lng} zoom={12} pitch={0} style={{ height: 280, borderRadius: 10 }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// TAB: COMPS
// ══════════════════════════════════════════
function CompsTab() {
  const [view, setView] = useState("Table");
  return (
    <div style={{ display: "flex", gap: 20 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {["Map", "Table", "Charts"].map((t) => (
            <button key={t} onClick={() => setView(t)} style={{
              padding: "8px 20px", borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: "pointer",
              border: `1px solid ${COLORS.border}`, fontFamily: "'DM Sans',sans-serif",
              background: view === t ? COLORS.brand : "#fff", color: view === t ? "#fff" : COLORS.textSecondary,
              transition: "all .15s",
            }}>{t}</button>
          ))}
        </div>

        {view === "Map" && (
          <MapboxMap lat={SITE.lat} lng={SITE.lng} zoom={14} pitch={30} style={{ height: 400, borderRadius: 10, marginBottom: 16 }} />
        )}

        {view !== "Map" && (
          <Card>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: COLORS.surface }}>
                  {["Property", "Address", "Units", "Year", "Occ", "1BR", "2BR"].map((h) => (
                    <th key={h} style={{ padding: "10px 10px", textAlign: "left", fontWeight: 600, color: COLORS.textSecondary, borderBottom: `2px solid ${COLORS.border}`, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPS.map((c, i) => (
                  <tr key={c.name} style={{ borderBottom: `1px solid ${COLORS.surface}`, background: i % 2 === 0 ? "#fff" : COLORS.surface }}>
                    <td style={{ padding: "10px", fontWeight: 600, color: COLORS.textPrimary }}>{c.name}</td>
                    <td style={{ padding: "10px", color: COLORS.textSecondary }}>{c.addr}</td>
                    <td style={{ padding: "10px", fontFamily: "'JetBrains Mono',monospace" }}>{c.units}</td>
                    <td style={{ padding: "10px", color: COLORS.textSecondary }}>{c.year}</td>
                    <td style={{ padding: "10px", fontWeight: 600, color: COLORS.success }}>{c.occ}%</td>
                    <td style={{ padding: "10px", color: COLORS.brand, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>{fmtD(c.one)}</td>
                    <td style={{ padding: "10px", color: COLORS.brand, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>{fmtD(c.two)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <Card style={{ padding: 16, marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>Rent Summary</span>
            <Badge text="5 Comps · 3mi Radius" color={COLORS.brand} />
          </div>
          <div style={{ display: "flex", gap: 20, marginBottom: 10, fontSize: 12, color: COLORS.textMuted }}>
            <span>Avg Units: <strong style={{ color: COLORS.textPrimary }}>21</strong></span>
            <span>Avg Year: <strong style={{ color: COLORS.textPrimary }}>2020</strong></span>
            <span>Avg Occ: <strong style={{ color: COLORS.textPrimary }}>97%</strong></span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
                {["Unit Type", "Avg Rent", "Avg SF", "$/SF/Mo"].map((h) => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: COLORS.textSecondary, fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {UNIT_RENTS.map((u) => (
                <tr key={u.type} style={{ borderBottom: `1px solid ${COLORS.surface}` }}>
                  <td style={{ padding: "8px 10px", fontWeight: 600, textAlign: "right" }}>{u.type}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", color: COLORS.brand, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{fmtD(u.rent)}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", color: COLORS.textSecondary, fontFamily: "'JetBrains Mono',monospace" }}>{fmt(u.sf)}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", color: COLORS.textSecondary, fontFamily: "'JetBrains Mono',monospace" }}>${u.psf.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div style={{ width: 260, flexShrink: 0 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.brand, marginBottom: 12 }}>Comp Filters</div>
          {[
            ["Max Comps", "10"], ["Radius", "3 mi"], ["Year Built ≥", "2015"],
            ["Asset Type", "Multifamily"], ["Class", "B+, A"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12, borderBottom: `1px solid ${COLORS.surface}` }}>
              <span style={{ color: COLORS.textSecondary }}>{k}</span>
              <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>{v}</span>
            </div>
          ))}
          <button style={{ width: "100%", marginTop: 12, padding: "10px", borderRadius: 8, border: "none", background: COLORS.brand, color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            🔄 Refresh Comps
          </button>
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// TAB: CAPACITY
// ══════════════════════════════════════════
function CapacityTab() {
  const [scenario, setScenario] = useState("Mixed");
  return (
    <div style={{ display: "flex", gap: 20 }}>
      <div style={{ flex: 1 }}>
        <MapboxMap lat={SITE.lat} lng={SITE.lng} zoom={18} pitch={60} style={{ height: 420, borderRadius: 10 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 14 }}>
          {[
            ["Est. Max Units", "16", COLORS.brand],
            ["Buildable Area", `${fmt(SITE.lotArea * SITE.coverage)} SF`, COLORS.success],
            ["Max Height", `${SITE.maxHeight} ft`, "#7c3aed"],
            ["FAR Used", `${SITE.far} (100%)`, COLORS.danger],
          ].map(([l, v, c]) => (
            <div key={l} style={{ background: "#fff", borderRadius: 8, padding: 14, borderLeft: `3px solid ${c}`, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{l}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.textPrimary, marginTop: 4, fontFamily: "'JetBrains Mono',monospace" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, background: COLORS.brandLight, borderRadius: 8, padding: 14, border: `1px solid ${COLORS.brand}30` }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.brandDark, marginBottom: 4 }}>🏗️ ZoneWise Capacity Analysis</div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.6 }}>
            After setbacks ({SITE.setFront}ft front, {SITE.setSide}ft sides, {SITE.setRear}ft rear), buildable footprint is ~{fmt(SITE.lotArea * SITE.coverage * 0.65)} SF.
            At 3 stories with {SITE.parking}/unit surface parking, optimal configuration yields 14-16 units in a garden apartment layout.
            Townhome alternative: 6-8 units at higher per-unit rent ($2,800-3,200/mo).
          </div>
        </div>
      </div>
      <div style={{ width: 260, flexShrink: 0 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 12 }}>Massing Controls</div>
          <SectionLabel text="Scenario" />
          <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
            {["Townhome", "Garden Apt", "Mixed"].map((s) => (
              <button key={s} onClick={() => setScenario(s)} style={{
                flex: 1, padding: "8px 4px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${COLORS.border}`, transition: "all .15s",
                background: scenario === s ? COLORS.brand : "#fff", color: scenario === s ? "#fff" : COLORS.textSecondary,
              }}>{s}</button>
            ))}
          </div>
          <SectionLabel text="Overrides" />
          {[
            ["Height", `${SITE.maxHeight} ft`], ["FAR", `${SITE.far}`],
            ["Front Setback", `${SITE.setFront} ft`], ["Side Setback", `${SITE.setSide} ft`],
            ["Rear Setback", `${SITE.setRear} ft`], ["Parking", `${SITE.parking}/unit`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12, borderBottom: `1px solid ${COLORS.surface}` }}>
              <span style={{ color: COLORS.textSecondary }}>{k}</span>
              <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>{v}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// TAB: DEVELOP (Pro Forma Engine)
// ══════════════════════════════════════════
function DevelopTab() {
  const [units, setUnits] = useState(16);
  const [vacancy, setVacancy] = useState(5);
  const [opex, setOpex] = useState(38);
  const [capRate, setCapRate] = useState(6.5);
  const [costPSF, setCostPSF] = useState(185);
  const [softPct, setSoftPct] = useState(18);

  const mix = MIX.map((m) => ({ ...m, count: Math.max(1, Math.round(units * m.pct / 100)) }));
  const adjustedUnits = mix.reduce((s, m) => s + m.count, 0);
  const totalGSF = mix.reduce((s, m) => s + m.count * m.sf, 0);
  const gpr = mix.reduce((s, m) => s + m.count * m.rent * 12, 0);
  const egi = gpr * (1 - vacancy / 100);
  const opexAmt = egi * (opex / 100);
  const noi = egi - opexAmt;
  const value = noi / (capRate / 100);
  const hard = totalGSF * costPSF;
  const soft = hard * (softPct / 100);
  const totalCost = hard + soft;
  const profit = value - totalCost;
  const yoc = (noi / totalCost) * 100;
  const spread = yoc - capRate;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16, gap: 12 }}>
        <div style={{ flex: 1 }}>
          <SectionLabel text="Development Pro Forma" />
          <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
            {SITE.zone} · {fmt(SITE.lotArea)} SF lot · FAR {SITE.far} · {SITE.maxHeight}ft max
          </div>
        </div>
        <Badge text="Interactive" color={COLORS.accent} />
      </div>

      {/* Top KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 18 }}>
        {[
          ["NOI", fmtD(noi), true], ["Value", fmtD(value), true],
          ["Dev Cost", fmtD(totalCost), false], ["Profit", fmtD(profit), profit > 0],
          ["YoC", `${yoc.toFixed(1)}%`, spread > 0], ["Spread", `${spread > 0 ? "+" : ""}${spread.toFixed(1)}%`, spread > 0],
        ].map(([l, v, hi]) => (
          <div key={l} style={{
            background: hi ? COLORS.brandLight : COLORS.surface, borderRadius: 8, padding: "12px 14px",
            border: `1px solid ${hi ? COLORS.brand + "40" : COLORS.border}`,
          }}>
            <div style={{ fontSize: 9, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{l}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: hi ? COLORS.brandDark : COLORS.textPrimary, fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 18 }}>
        {/* LEFT: Inputs */}
        <div style={{ width: 360, flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center" }}>
            Assumptions<Badge text="ADJUST" color={COLORS.accent} />
          </div>
          <Card style={{ padding: 16 }}>
            {[
              { l: "Total Units", v: units, s: setUnits, min: 4, max: 40, step: 1, f: (x) => x },
              { l: "Vacancy %", v: vacancy, s: setVacancy, min: 0, max: 15, step: 0.5, f: (x) => x + "%" },
              { l: "OpEx Ratio %", v: opex, s: setOpex, min: 25, max: 50, step: 1, f: (x) => x + "%" },
              { l: "Cap Rate %", v: capRate, s: setCapRate, min: 4, max: 9, step: 0.25, f: (x) => x + "%" },
              { l: "Construction $/SF", v: costPSF, s: setCostPSF, min: 120, max: 350, step: 5, f: (x) => "$" + x },
              { l: "Soft Cost %", v: softPct, s: setSoftPct, min: 10, max: 30, step: 1, f: (x) => x + "%" },
            ].map((sl) => (
              <div key={sl.l} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{sl.l}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: COLORS.textPrimary }}>{sl.f(sl.v)}</span>
                </div>
                <input type="range" min={sl.min} max={sl.max} step={sl.step} value={sl.v}
                  onChange={(e) => sl.s(Number(e.target.value))}
                  style={{ width: "100%", accentColor: COLORS.brand, height: 4 }} />
              </div>
            ))}
          </Card>

          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 16, marginBottom: 10, display: "flex", alignItems: "center" }}>
            Unit Mix<Badge text="Comp-Derived" color={COLORS.success} />
          </div>
          <Card>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: COLORS.surface }}>
                  {["Type", "%", "Units", "SF", "Rent", "Annual"].map((h) => (
                    <th key={h} style={{ padding: "8px 6px", textAlign: "right", fontWeight: 600, color: COLORS.textSecondary, borderBottom: `2px solid ${COLORS.border}`, fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mix.map((m) => (
                  <tr key={m.type} style={{ borderBottom: `1px solid ${COLORS.surface}` }}>
                    <td style={{ padding: "8px 6px", fontWeight: 600, textAlign: "right" }}>{m.type}</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", color: COLORS.textSecondary }}>{m.pct}%</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>{m.count}</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", color: COLORS.textSecondary }}>{fmt(m.sf)}</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", color: COLORS.brand, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>{fmtD(m.rent)}</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", color: COLORS.textSecondary, fontFamily: "'JetBrains Mono',monospace" }}>{fmtD(m.count * m.rent * 12)}</td>
                  </tr>
                ))}
                <tr style={{ background: COLORS.brandLight }}>
                  <td style={{ padding: "8px 6px", fontWeight: 700, textAlign: "right" }}>Total</td>
                  <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 600 }}>100%</td>
                  <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{adjustedUnits}</td>
                  <td style={{ padding: "8px 6px", textAlign: "right" }}>{fmt(Math.round(totalGSF / adjustedUnits))}</td>
                  <td style={{ padding: "8px 6px", textAlign: "right" }}>—</td>
                  <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 700, color: COLORS.brand, fontFamily: "'JetBrains Mono',monospace" }}>{fmtD(gpr)}</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>

        {/* RIGHT: Pro Forma */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center" }}>
            Pro Forma Statement<Badge text="LIVE" color={COLORS.brand} />
          </div>
          <Card>
            {[
              { title: "Revenue", color: COLORS.brand, rows: [
                ["Gross Potential Rent", fmtD(gpr)],
                [`Less Vacancy (${vacancy}%)`, `(${fmtD(gpr * vacancy / 100)})`, COLORS.danger],
                ["Effective Gross Income", fmtD(egi), COLORS.success, true],
              ]},
              { title: "Expenses", color: COLORS.danger, rows: [
                [`Operating Expenses (${opex}%)`, `(${fmtD(opexAmt)})`, COLORS.danger],
                ["Net Operating Income", fmtD(noi), COLORS.success, true],
              ]},
              { title: "Valuation", color: COLORS.info, bg: "#EFF6FF", rows: [
                ["NOI ÷ Cap Rate", `${fmtD(noi)} ÷ ${capRate}%`],
                ["Stabilized Value", fmtD(value), COLORS.info, true],
                ["Per Unit", fmtD(Math.round(value / adjustedUnits))],
              ]},
              { title: "Development Cost", color: "#92400E", rows: [
                [`Hard (${fmt(totalGSF)} SF × $${costPSF})`, fmtD(hard)],
                [`Soft Costs (${softPct}%)`, fmtD(soft)],
                ["Total Dev Cost", fmtD(totalCost), "#92400E", true],
                ["Per Unit", fmtD(Math.round(totalCost / adjustedUnits))],
              ]},
              { title: "Returns", color: profit > 0 ? COLORS.success : COLORS.danger, bg: profit > 0 ? "#F0FDF4" : "#FEF2F2", rows: [
                ["Developer Profit", fmtD(profit), profit > 0 ? COLORS.success : COLORS.danger, true],
                ["Profit Margin", `${(profit / value * 100).toFixed(1)}%`],
                ["Yield on Cost", `${yoc.toFixed(2)}%`],
                ["Dev Spread", `${spread > 0 ? "+" : ""}${spread.toFixed(2)}%`, spread > 0 ? COLORS.success : COLORS.danger],
              ]},
            ].map((sec) => (
              <div key={sec.title} style={{ padding: "14px 18px", borderBottom: `1px solid ${COLORS.border}`, background: sec.bg || "transparent" }}>
                <div style={{ fontSize: 10, color: sec.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{sec.title}</div>
                {sec.rows.map(([l, v, c, b]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderTop: b ? `1.5px solid ${sec.color}` : "none", marginTop: b ? 4 : 0 }}>
                    <span style={{ fontSize: 12, color: COLORS.textSecondary, fontWeight: b ? 600 : 400 }}>{l}</span>
                    <span style={{ fontSize: b ? 15 : 12, fontWeight: b ? 800 : 500, color: c || COLORS.textPrimary, fontFamily: "'JetBrains Mono',monospace" }}>{v}</span>
                  </div>
                ))}
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// TAB: EXPORT
// ══════════════════════════════════════════
function ExportTab() {
  return (
    <div style={{ maxWidth: 640 }}>
      <Card style={{ padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>Export Feasibility Package</div>
        <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 20 }}>Generate investor-ready deliverables for {SITE.address}</div>
        {[
          ["📄 PDF Report", "Full feasibility study: site, zoning, market, comps, pro forma", true],
          ["📊 Excel Pro Forma", "Editable development model with sensitivity tables", true],
          ["🖼️ Investor Deck", "10-slide presentation with maps, massing, and returns", true],
          ["📐 3D Massing PNG", "Satellite overlay with building envelope render", false],
          ["📋 DOCX Memo", "Investment committee memo with executive summary", true],
        ].map(([title, desc, ready]) => (
          <div key={title} style={{ display: "flex", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${COLORS.surface}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>{title}</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{desc}</div>
            </div>
            <button style={{
              padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: "none", transition: "all .15s",
              background: ready ? COLORS.brand : COLORS.border,
              color: ready ? "#fff" : COLORS.textMuted,
            }}>{ready ? "Generate" : "Coming Q2"}</button>
          </div>
        ))}
      </Card>
      <div style={{ marginTop: 16, background: COLORS.brandLight, borderRadius: 10, padding: 16, border: `1px solid ${COLORS.brand}30` }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.brandDark, marginBottom: 4 }}>💬 NLP Export (Coming Soon)</div>
        <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.6 }}>
          "Generate a PDF feasibility report for 1233 Highway A1A comparing garden apartment vs townhome scenarios"
          — ZoneWise will generate the report from a single chat message.
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════
export default function ZoneWiseApp() {
  const [tab, setTab] = useState("Site");
  return (
    <div style={{ minHeight: "100vh", background: COLORS.surface, fontFamily: "'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      <Nav tab={tab} setTab={setTab} />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 20px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>{SITE.address}</h1>
          <span style={{ fontSize: 11, background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: "3px 8px", borderRadius: 6, color: COLORS.textSecondary }}>{SITE.zone}</span>
          <span style={{ fontSize: 11, background: "#FEF3C7", padding: "3px 8px", borderRadius: 6, color: "#92400E", fontWeight: 600 }}>Flood: {SITE.flood}</span>
        </div>
        {tab === "Site" && <SiteTab />}
        {tab === "Market" && <MarketTab />}
        {tab === "Comps" && <CompsTab />}
        {tab === "Capacity" && <CapacityTab />}
        {tab === "Develop" && <DevelopTab />}
        {tab === "Export" && <ExportTab />}
      </div>
    </div>
  );
}
