"use client";

export default function ChatV2Page() {
  return (
    <div style={{ 
      display: "flex", 
      height: "100vh", 
      backgroundColor: "#020617",
      color: "white",
      fontFamily: "Inter, system-ui, sans-serif"
    }}>
      <div style={{ 
        flex: 1, 
        borderRight: "1px solid #1E3A5F",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ color: "#F59E0B", fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            ZoneWise Chat
          </h2>
          <p style={{ color: "#64748B" }}>Split-screen UI — Sprint 3</p>
          <p style={{ color: "#64748B", fontSize: "0.875rem" }}>Powered by assistant-ui + Dify</p>
        </div>
      </div>
      <div style={{ 
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ color: "#F59E0B", fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            Artifacts Panel
          </h2>
          <p style={{ color: "#64748B" }}>Zoning data, maps, reports</p>
        </div>
      </div>
    </div>
  );
}
