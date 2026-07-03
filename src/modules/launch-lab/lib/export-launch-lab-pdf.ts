import type { IdeaCanvasClusters, LaunchLabSession, LaunchLabStep } from "../types";
import { BANNER_PLATFORMS, CLUSTER_META, PITCH_AUDIENCES, PITCH_INDUSTRIES, PITCH_TYPES } from "../constants";
import { deriveSessionTitle } from "./session-title";
import { getScoreGrade } from "./pitch-metrics";

const EXPORT_WIDTH_PX = 794;

const STYLES = {
  page: `width:${EXPORT_WIDTH_PX}px;padding:40px 44px;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#ffffff;color:#0f172a;line-height:1.5;box-sizing:border-box;`,
  hero: `border-radius:16px;border:1px solid rgba(124,58,237,0.25);background:linear-gradient(135deg,rgba(124,58,237,0.12) 0%,rgba(139,92,246,0.06) 50%,#ffffff 100%);padding:28px 32px;margin-bottom:28px;`,
  heroTitle: `margin:0 0 8px;font-size:28px;font-weight:700;letter-spacing:-0.02em;color:#0f172a;`,
  heroSub: `margin:0;font-size:14px;color:#64748b;max-width:560px;`,
  statRow: `display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;`,
  stat: `border-radius:12px;border:1px solid #e2e8f0;background:rgba(255,255,255,0.85);padding:12px 16px;min-width:88px;text-align:center;`,
  statValue: `font-size:20px;font-weight:700;margin:0;color:#0f172a;`,
  statLabel: `font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin:4px 0 0;`,
  section: `margin-bottom:28px;`,
  sectionHead: `display:flex;align-items:center;gap:10px;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid rgba(124,58,237,0.15);`,
  sectionNum: `display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;background:#7c3aed;color:#fff;font-size:13px;font-weight:700;`,
  sectionTitle: `margin:0;font-size:18px;font-weight:700;color:#0f172a;`,
  card: `border-radius:12px;border:1px solid #e2e8f0;background:#fafafa;padding:16px 18px;margin-bottom:12px;`,
  cardTitle: `margin:0 0 8px;font-size:13px;font-weight:600;color:#7c3aed;text-transform:uppercase;letter-spacing:0.06em;`,
  badge: `display:inline-block;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:600;margin-right:6px;margin-bottom:6px;border:1px solid #e2e8f0;background:#fff;color:#334155;`,
  badgePrimary: `border-color:rgba(124,58,237,0.35);background:rgba(124,58,237,0.1);color:#6d28d9;`,
  badgeSuccess: `border-color:rgba(16,185,129,0.35);background:rgba(16,185,129,0.1);color:#047857;`,
  scoreGrid: `display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:12px 0;`,
  scoreBox: `border-radius:10px;border:1px solid #e2e8f0;background:#fff;padding:12px;text-align:center;`,
  scoreNum: `font-size:22px;font-weight:700;color:#7c3aed;margin:0;`,
  scoreLbl: `font-size:10px;color:#64748b;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.05em;`,
  body: `margin:0;font-size:14px;color:#334155;white-space:pre-wrap;`,
  muted: `margin:0;font-size:13px;color:#64748b;`,
  clusterGrid: `display:grid;grid-template-columns:repeat(2,1fr);gap:12px;`,
  cluster: `border-radius:12px;border:1px solid #e2e8f0;padding:14px;background:#fff;`,
  clusterItem: `font-size:12px;color:#334155;margin:0 0 8px;padding-left:4px;border-left:3px solid #e2e8f0;`,
  list: `margin:0;padding-left:18px;font-size:13px;color:#334155;`,
  footer: `margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;`,
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function labelFor<T extends { value: string; label: string }>(list: T[], value: string): string {
  return list.find((item) => item.value === value)?.label ?? value;
}

export function getExportableSteps(session: LaunchLabSession): LaunchLabStep[] {
  const steps: LaunchLabStep[] = [];
  if (session.pitchAnalysis) steps.push(1);
  if (session.canvas?.clusters) steps.push(2);
  if (steps.includes(2)) {
    const hasCommand =
      session.step >= 3 ||
      session.step === 4 ||
      (session.launchBoard?.nodes?.length ?? 0) > 0 ||
      session.socialBanners?.hasGenerated ||
      session.socialBanners?.postsCreated;
    if (hasCommand) steps.push(3);
  }
  if (session.completedAt || session.step === 4) steps.push(4);
  return steps;
}

function renderClusterSection(clusters: IdeaCanvasClusters): string {
  const keys = ["problems", "ideas", "risks", "next_steps"] as const;
  const blocks = keys
    .map((key) => {
      const items = clusters[key] ?? [];
      if (items.length === 0) return "";
      const meta = CLUSTER_META[key];
      const list = items
        .map(
          (item) =>
            `<p style="${STYLES.clusterItem}"><strong>${escapeHtml(item.title)}</strong>${item.detail ? ` — ${escapeHtml(item.detail)}` : ""}</p>`,
        )
        .join("");
      return `<div style="${STYLES.cluster}"><p style="${STYLES.cardTitle}">${meta.emoji} ${meta.label}</p>${list}</div>`;
    })
    .filter(Boolean)
    .join("");

  return `<div style="${STYLES.clusterGrid}">${blocks}</div>`;
}

function renderStep1(session: LaunchLabSession): string {
  const { context, rawPitch, pitchAnalysis: analysis } = session;
  if (!analysis) return "";

  const grade = getScoreGrade(analysis.overall);
  const gradeColor =
    analysis.overall >= 85 ? "#047857" : analysis.overall >= 70 ? "#1d4ed8" : analysis.overall >= 55 ? "#b45309" : "#64748b";

  const scores = [
    { label: "Clarity", value: analysis.scores.clarity },
    { label: "Structure", value: analysis.scores.structure },
    { label: "Value", value: analysis.scores.value },
    { label: "CTA", value: analysis.scores.cta },
  ]
    .map(
      (s) =>
        `<div style="${STYLES.scoreBox}"><p style="${STYLES.scoreNum}">${s.value}</p><p style="${STYLES.scoreLbl}">${s.label}</p></div>`,
    )
    .join("");

  const fixes =
    analysis.fixes.length > 0
      ? `<div style="${STYLES.card}"><p style="${STYLES.cardTitle}">Top fixes</p><ul style="${STYLES.list}">${analysis.fixes.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}</ul></div>`
      : "";

  const objections =
    analysis.objections.length > 0
      ? `<div style="${STYLES.card}"><p style="${STYLES.cardTitle}">Objections &amp; answers</p>${analysis.objections
          .slice(0, 4)
          .map(
            (o) =>
              `<p style="${STYLES.body}"><strong>Q:</strong> ${escapeHtml(o.question)}<br/><strong>A:</strong> ${escapeHtml(o.suggested_answer)}</p>`,
          )
          .join("")}</div>`
      : "";

  return `
    <section style="${STYLES.section}">
      <div style="${STYLES.sectionHead}">
        <span style="${STYLES.sectionNum}">1</span>
        <h2 style="${STYLES.sectionTitle}">Idea Coach — Refine</h2>
      </div>
      <div style="margin-bottom:12px;">
        <span style="${STYLES.badge} ${STYLES.badgePrimary}">${escapeHtml(labelFor(PITCH_TYPES, context.pitchType))}</span>
        <span style="${STYLES.badge}">${escapeHtml(labelFor(PITCH_AUDIENCES, context.audience))}</span>
        <span style="${STYLES.badge}">${escapeHtml(labelFor(PITCH_INDUSTRIES, context.industry))}</span>
      </div>
      <div style="${STYLES.card}">
        <p style="${STYLES.cardTitle}">Pitch score</p>
        <p style="margin:0 0 8px;font-size:32px;font-weight:700;color:#7c3aed;">${analysis.overall}<span style="font-size:16px;color:#64748b;">/100</span></p>
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:${gradeColor};">${escapeHtml(grade.label)}</p>
        <div style="${STYLES.scoreGrid}">${scores}</div>
      </div>
      ${analysis.headline ? `<div style="${STYLES.card}"><p style="${STYLES.cardTitle}">Headline</p><p style="${STYLES.body}">${escapeHtml(analysis.headline)}</p></div>` : ""}
      ${analysis.tagline ? `<div style="${STYLES.card}"><p style="${STYLES.cardTitle}">Tagline</p><p style="${STYLES.body}">${escapeHtml(analysis.tagline)}</p></div>` : ""}
      <div style="${STYLES.card}"><p style="${STYLES.cardTitle}">Polished pitch</p><p style="${STYLES.body}">${escapeHtml(analysis.improved_pitch)}</p></div>
      <div style="${STYLES.card}"><p style="${STYLES.cardTitle}">Original pitch</p><p style="${STYLES.body}">${escapeHtml(rawPitch)}</p></div>
      ${fixes}
      ${objections}
    </section>
  `;
}

function renderStep2(session: LaunchLabSession): string {
  const canvas = session.canvas;
  if (!canvas?.clusters) return "";

  const checked = new Set(session.checkedSteps);
  const checklist = canvas.clusters.next_steps
    .map((step) => {
      const done = checked.has(step.id);
      return `<li style="${done ? "text-decoration:line-through;color:#94a3b8;" : ""}">${done ? "☑" : "☐"} ${escapeHtml(step.title)}${step.detail ? ` — ${escapeHtml(step.detail)}` : ""}</li>`;
    })
    .join("");

  const kpis =
    canvas.kpis && canvas.kpis.length > 0
      ? `<div style="${STYLES.card}"><p style="${STYLES.cardTitle}">KPIs</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">${canvas.kpis
          .slice(0, 6)
          .map(
            (kpi) =>
              `<div style="${STYLES.scoreBox}"><p style="${STYLES.muted}">${escapeHtml(kpi.label)}</p><p style="${STYLES.scoreNum}">${escapeHtml(kpi.target)}</p></div>`,
          )
          .join("")}</div></div>`
      : "";

  const milestones =
    canvas.milestones && canvas.milestones.length > 0
      ? `<div style="${STYLES.card}"><p style="${STYLES.cardTitle}">30-day milestones</p><ul style="${STYLES.list}">${canvas.milestones
          .map(
            (m) =>
              `<li><strong>Week ${m.week}:</strong> ${escapeHtml(m.title)}${m.goals?.length ? ` — ${escapeHtml(m.goals.join(", "))}` : ""}</li>`,
          )
          .join("")}</ul></div>`
      : "";

  const hooks =
    canvas.elevator_hooks && canvas.elevator_hooks.length > 0
      ? `<div style="${STYLES.card}"><p style="${STYLES.cardTitle}">Elevator hooks</p>${canvas.elevator_hooks
          .slice(0, 3)
          .map((hook) => `<p style="${STYLES.body}">&ldquo;${escapeHtml(hook)}&rdquo;</p>`)
          .join("")}</div>`
      : "";

  return `
    <section style="${STYLES.section}">
      <div style="${STYLES.sectionHead}">
        <span style="${STYLES.sectionNum}">2</span>
        <h2 style="${STYLES.sectionTitle}">Idea Canvas</h2>
      </div>
      ${renderClusterSection(canvas.clusters)}
      ${canvas.synthesis ? `<div style="${STYLES.card}"><p style="${STYLES.cardTitle}">Launch plan synthesis</p><p style="${STYLES.body}">${escapeHtml(canvas.synthesis)}</p></div>` : ""}
      ${kpis}
      ${milestones}
      ${hooks}
      ${checklist ? `<div style="${STYLES.card}"><p style="${STYLES.cardTitle}">Action checklist</p><ul style="${STYLES.list}">${checklist}</ul></div>` : ""}
    </section>
  `;
}

function renderStep3(session: LaunchLabSession): string {
  const { pitchAnalysis, canvas, launchBoard, socialBanners, checkedSteps } = session;
  if (!canvas?.clusters || !pitchAnalysis) return "";

  const nextStepIds = new Set(canvas.clusters.next_steps.map((s) => s.id));
  const checklistDone = checkedSteps.filter((id) => nextStepIds.has(id)).length;
  const checklistTotal = canvas.clusters.next_steps.length;
  const checklistPct = checklistTotal ? Math.round((checklistDone / checklistTotal) * 100) : 0;
  const launchReadiness = Math.round((pitchAnalysis.overall + checklistPct) / 2);
  const grade = getScoreGrade(launchReadiness);

  const flowNodes =
    launchBoard?.nodes && launchBoard.nodes.length > 0
      ? `<div style="${STYLES.card}"><p style="${STYLES.cardTitle}">Launch flow</p><ul style="${STYLES.list}">${launchBoard.nodes
          .map((node) => {
            const detail = node.data.detail ? ` — ${node.data.detail}` : "";
            const week = node.type === "week" && node.data.week ? ` (Week ${node.data.week})` : "";
            return `<li><strong>${escapeHtml(node.type)}:</strong> ${escapeHtml(node.data.label)}${week}${escapeHtml(detail)}</li>`;
          })
          .join("")}</ul>${
          launchBoard.edges.length > 0
            ? `<p style="${STYLES.muted};margin-top:10px;">Connections: ${launchBoard.edges
                .map((e) => `${escapeHtml(e.source)} → ${escapeHtml(e.target)}`)
                .join(" · ")}</p>`
            : ""
        }</div>`
      : "";

  const posts = socialBanners
    ? BANNER_PLATFORMS.filter((platform) => socialBanners[platform]?.suggestedPost)
        .map(
          (platform) =>
            `<div style="margin-bottom:10px;"><strong style="text-transform:capitalize;">${platform}</strong><p style="${STYLES.body}">${escapeHtml(socialBanners[platform].suggestedPost ?? "")}</p></div>`,
        )
        .join("")
    : "";
  const socialSection = posts
    ? `<div style="${STYLES.card}"><p style="${STYLES.cardTitle}">Social launch copy</p>${posts}</div>`
    : "";

  return `
    <section style="${STYLES.section}">
      <div style="${STYLES.sectionHead}">
        <span style="${STYLES.sectionNum}">3</span>
        <h2 style="${STYLES.sectionTitle}">Launch Command</h2>
      </div>
      <div style="${STYLES.card};background:linear-gradient(135deg,rgba(124,58,237,0.08),#fafafa);">
        <p style="${STYLES.cardTitle}">Launch readiness</p>
        <p style="margin:0;font-size:28px;font-weight:700;color:#7c3aed;">${launchReadiness}<span style="font-size:14px;color:#64748b;">/100</span></p>
        <p style="margin:8px 0 0;font-size:13px;font-weight:600;color:#6d28d9;">${escapeHtml(grade.label)}</p>
        <p style="${STYLES.muted};margin-top:8px;">Checklist ${checklistDone}/${checklistTotal} complete (${checklistPct}%)</p>
      </div>
      ${canvas.synthesis ? `<div style="${STYLES.card}"><p style="${STYLES.cardTitle}">Launch brief</p><p style="${STYLES.body}">${escapeHtml(canvas.synthesis)}</p></div>` : ""}
      ${flowNodes}
      ${socialSection}
    </section>
  `;
}

export function buildLaunchLabExportHtml(session: LaunchLabSession, steps: LaunchLabStep[]): string {
  const title = deriveSessionTitle(session);
  const stepLabels = steps.map((s) => (s === 1 ? "Refine" : s === 2 ? "Canvas" : "Command")).join(" · ");

  const sections = [
    steps.includes(1) ? renderStep1(session) : "",
    steps.includes(2) ? renderStep2(session) : "",
    steps.includes(3) ? renderStep3(session) : "",
  ].join("");

  return `
    <div style="${STYLES.page}">
      <header style="${STYLES.hero}">
        <h1 style="${STYLES.heroTitle}">${escapeHtml(title)} — Launch Lab</h1>
        <p style="${STYLES.heroSub}">Export includes completed steps: ${escapeHtml(stepLabels)}</p>
        <div style="${STYLES.statRow}">
          <div style="${STYLES.stat}"><p style="${STYLES.statValue}">${steps.length}/3</p><p style="${STYLES.statLabel}">Steps</p></div>
          <div style="${STYLES.stat}"><p style="${STYLES.statValue}">${session.pitchAnalysis?.overall ?? "—"}</p><p style="${STYLES.statLabel}">Score</p></div>
          <div style="${STYLES.stat}"><p style="${STYLES.statValue}">Live</p><p style="${STYLES.statLabel}">Agent</p></div>
        </div>
      </header>
      ${sections}
      <footer style="${STYLES.footer}">Generated ${escapeHtml(new Date().toLocaleString())} · Launch Lab</footer>
    </div>
  `;
}

async function renderHtmlToPdf(element: HTMLElement, filename: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * pageWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

export async function downloadLaunchLabPdf(session: LaunchLabSession): Promise<void> {
  const steps = getExportableSteps(session);
  if (steps.length === 0) {
    throw new Error("Nothing to export yet — complete at least the Idea Coach step first.");
  }

  const name = (session.context.productName || "launch-lab").toLowerCase().replace(/\s+/g, "-");
  const filename = `${name}-launch-lab.pdf`;
  const html = buildLaunchLabExportHtml(session, steps);

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.zIndex = "-1";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const page = container.firstElementChild as HTMLElement;
    await renderHtmlToPdf(page, filename);
  } finally {
    document.body.removeChild(container);
  }
}
