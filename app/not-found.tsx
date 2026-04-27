import Link from "next/link";

export default function NotFound() {
  return (
    <html>
      <body style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontFamily: "system-ui, sans-serif",
        background: "#050416",
        color: "#f5f4ff",
      }}>
        <div style={{ textAlign: "center" }}>
          <h1>404</h1>
          <p style={{ opacity: 0.6 }}>This page does not exist.</p>
          <p style={{ marginTop: 16 }}>
            <Link href="/en">→ English</Link> · <Link href="/zh-HK">→ 繁體中文</Link>
          </p>
        </div>
      </body>
    </html>
  );
}
