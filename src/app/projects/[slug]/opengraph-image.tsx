import { ImageResponse } from "next/og";
import { getProject } from "@/lib/server-api";
import { SITE } from "@/lib/site";

/**
 * A social card per project.
 *
 * Built from the project's own record, so a shared link previews what the page
 * actually says rather than a generic banner.
 */
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Project";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);

  const title = project?.name ?? SITE.name;
  const subtitle = project?.tagline ?? project?.summary ?? SITE.tagline;
  const technologies = project?.technologies.slice(0, 5) ?? [];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0a0b0d",
        padding: "72px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: "2px", fontSize: 30 }}>
        <span style={{ color: "#e2ab4e", fontWeight: 700 }}>0x</span>
        <span style={{ color: "#e9ecf1", fontWeight: 700 }}>Semantic</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
        <div
          style={{
            fontSize: title.length > 24 ? 62 : 78,
            color: "#e9ecf1",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 30, color: "#9ba3b0", lineHeight: 1.35, maxWidth: "900px" }}>
          {subtitle.length > 130 ? `${subtitle.slice(0, 130)}...` : subtitle}
        </div>
      </div>

      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
        {technologies.map((technology) => (
          <div
            key={technology}
            style={{
              display: "flex",
              fontSize: 22,
              color: "#9ba3b0",
              border: "1px solid #333944",
              borderRadius: "999px",
              padding: "8px 20px",
            }}
          >
            {technology}
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
