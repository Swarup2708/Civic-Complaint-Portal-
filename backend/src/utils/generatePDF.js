const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// sharp optional hai: WebP photos ko PDF mein dikhane ke liye (npm install sharp)
let sharp = null;
try {
  sharp = require("sharp");
} catch (e) {
  sharp = null;
}

// ---------- Design constants ----------
const MARGIN = 40;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM = PAGE_H - 62; // is se neeche content nahi jayega (footer ke liye jagah)

const C = {
  primary: "#065F46",
  accent: "#059669",
  text: "#1F2937",
  muted: "#6B7280",
  line: "#E5E7EB",
  zebra: "#F9FAFB",
  soft: "#ECFDF5",
  pending: "#B45309",
  progress: "#1D4ED8",
  resolved: "#047857",
};

const STATUS_STYLE = {
  Pending: { bg: "#FEF3C7", fg: "#B45309" },
  "In Progress": { bg: "#DBEAFE", fg: "#1D4ED8" },
  Resolved: { bg: "#D1FAE5", fg: "#047857" },
};

const CATEGORY_LABEL = {
  Road: "Road Issues",
  Streetlight: "Street Lights",
  Garbage: "Cleanliness",
  Water: "Water Supply",
  Other: "Others",
};

// ---------- Small helpers ----------
const pad = (n) => String(n).padStart(2, "0");
const titleCase = (s) => String(s || "").replace(/\b\w/g, (m) => m.toUpperCase());
const catLabel = (c) => CATEGORY_LABEL[c] || c;
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const fmtDateTime = (d) =>
  new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
const daysSince = (d) => Math.max(0, Math.floor((Date.now() - new Date(d)) / 86400000));

// Text ko width mein fit karo (lamba ho to ... laga do)
function fit(doc, text, maxWidth) {
  let s = String(text ?? "");
  if (doc.widthOfString(s) <= maxWidth) return s;
  while (s.length > 1 && doc.widthOfString(s + "...") > maxWidth) s = s.slice(0, -1);
  return s + "...";
}

function ensureSpace(doc, h) {
  if (doc.y + h > BOTTOM) {
    doc.addPage();
    doc.y = MARGIN;
  }
}

// ---------- Reusable blocks ----------
function drawBanner(doc, { title, subtitle, meta }) {
  doc.rect(0, 0, PAGE_W, 112).fill(C.primary);
  doc.rect(0, 112, PAGE_W, 4).fill(C.accent);

  doc
    .fillColor("#A7F3D0")
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("CIVIC COMPLAINT PORTAL", MARGIN, 30, { characterSpacing: 2, lineBreak: false });

  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(20)
    .text(title, MARGIN, 46, { lineBreak: false });

  doc.font("Helvetica").fontSize(10);
  doc
    .fillColor("#D1FAE5")
    .text(fit(doc, subtitle, 330), MARGIN, 78, { lineBreak: false });

  let my = 30;
  meta.forEach(([k, v]) => {
    doc
      .fillColor("#A7F3D0")
      .font("Helvetica")
      .fontSize(8)
      .text(k, PAGE_W - MARGIN - 170, my, { width: 170, align: "right", lineBreak: false });
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(v, PAGE_W - MARGIN - 170, my + 11, { width: 170, align: "right", lineBreak: false });
    my += 30;
  });

  doc.y = 136;
}

function sectionTitle(doc, text, minSpace = 50) {
  ensureSpace(doc, Math.max(50, minSpace));
  const y = doc.y + 8;
  doc
    .fillColor(C.primary)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(text.toUpperCase(), MARGIN, y, { characterSpacing: 1, lineBreak: false });
  doc
    .moveTo(MARGIN, y + 17)
    .lineTo(MARGIN + CONTENT_W, y + 17)
    .lineWidth(1)
    .strokeColor(C.accent)
    .stroke();
  doc.y = y + 26;
}

function statCards(doc, items) {
  ensureSpace(doc, 80);
  const y = doc.y;
  const gap = 10;
  const w = (CONTENT_W - gap * (items.length - 1)) / items.length;
  const h = 62;

  items.forEach((it, i) => {
    const x = MARGIN + i * (w + gap);
    doc.lineWidth(0.7).roundedRect(x, y, w, h, 6).fillAndStroke("#FFFFFF", C.line);
    doc.rect(x, y + 12, 3, h - 24).fill(it.color);
    doc
      .fillColor(it.color)
      .font("Helvetica-Bold")
      .fontSize(22)
      .text(String(it.value), x + 14, y + 11, { width: w - 18, lineBreak: false });
    doc
      .fillColor(C.muted)
      .font("Helvetica")
      .fontSize(8.5)
      .text(it.label, x + 14, y + 42, { width: w - 18, lineBreak: false });
  });

  doc.y = y + h + 12;
}

function bullets(doc, lines) {
  lines.forEach((line) => {
    ensureSpace(doc, 24);
    const y = doc.y;
    doc.circle(MARGIN + 4, y + 5, 2.2).fill(C.accent);
    doc
      .fillColor(C.text)
      .font("Helvetica")
      .fontSize(9.5)
      .text(line, MARGIN + 16, y, { width: CONTENT_W - 16 });
    doc.y += 4;
  });
}

// Generic table: columns = [{label, width, align, color(cell,row), bold}]
function drawTable(doc, columns, rows, opts = {}) {
  const x = MARGIN;
  const rowH = opts.rowHeight || 24;
  const headH = 24;
  const totalW = columns.reduce((s, c) => s + c.width, 0);
  const light = !!opts.light;
  const P = 6;

  const header = (yy) => {
    doc.rect(x, yy, totalW, headH).fill(light ? C.soft : C.primary);
    let cx = x;
    columns.forEach((c) => {
      doc.font("Helvetica-Bold").fontSize(8.5);
      doc
        .fillColor(light ? C.primary : "#FFFFFF")
        .text(fit(doc, c.label.toUpperCase(), c.width - P * 2), cx + P, yy + 8, {
          width: c.width - P * 2,
          align: c.align || "left",
          lineBreak: false,
          characterSpacing: 0.4,
        });
      cx += c.width;
    });
    return yy + headH;
  };

  const drawRow = (row, yy, i, bold) => {
    if (i % 2 === 0 && !bold) doc.rect(x, yy, totalW, rowH).fill(C.zebra);
    if (bold) doc.rect(x, yy, totalW, rowH).fill(C.soft);
    let cx = x;
    columns.forEach((c, ci) => {
      const cell = row[ci];
      const color = !bold && c.color ? c.color(cell, row) : C.text;
      doc.font(bold || c.bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
      doc
        .fillColor(color)
        .text(fit(doc, cell, c.width - P * 2), cx + P, yy + (rowH - 9) / 2, {
          width: c.width - P * 2,
          align: c.align || "left",
          lineBreak: false,
        });
      cx += c.width;
    });
    doc
      .moveTo(x, yy + rowH)
      .lineTo(x + totalW, yy + rowH)
      .lineWidth(0.5)
      .strokeColor(C.line)
      .stroke();
    return yy + rowH;
  };

  let y = doc.y;
  const needed = headH + (rows.length + (opts.footerRow ? 1 : 0)) * rowH;
  const mustFit = opts.keepTogether ? needed : headH + rowH;
  if (y + mustFit > BOTTOM) {
    doc.addPage();
    y = MARGIN;
  }
  y = header(y);

  rows.forEach((row, i) => {
    if (y + rowH > BOTTOM) {
      doc.addPage();
      y = header(MARGIN);
    }
    y = drawRow(row, y, i, false);
  });

  if (opts.footerRow) {
    if (y + rowH > BOTTOM) {
      doc.addPage();
      y = header(MARGIN);
    }
    y = drawRow(opts.footerRow, y, 0, true);
  }

  doc.y = y + 12;
}

const countColor = (key) => (cell) =>
  Number(cell) > 0 ? C[key] : C.muted;

function addFooters(doc, label) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const oldBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    const y = PAGE_H - 30;
    doc
      .moveTo(MARGIN, y - 10)
      .lineTo(PAGE_W - MARGIN, y - 10)
      .lineWidth(0.5)
      .strokeColor(C.line)
      .stroke();
    doc
      .fillColor(C.muted)
      .font("Helvetica")
      .fontSize(8)
      .text(label, MARGIN, y, { width: 380, lineBreak: false });
    doc
      .fillColor(C.muted)
      .font("Helvetica")
      .fontSize(8)
      .text(`Page ${i + 1} of ${range.count}`, PAGE_W - MARGIN - 100, y, {
        width: 100,
        align: "right",
        lineBreak: false,
      });

    doc.page.margins.bottom = oldBottom;
  }
}

// Photo ko PDF ke liye taiyar karo (JPG/PNG seedha, WebP sharp se convert)
async function loadImage(p) {
  if (!p) return null;
  const full = path.resolve(p);
  if (!fs.existsSync(full)) return null;
  const ext = path.extname(full).toLowerCase();
  if ([".jpg", ".jpeg", ".png"].includes(ext)) return full;
  if (sharp) {
    try {
      return await sharp(full).png().toBuffer();
    } catch (e) {
      return null;
    }
  }
  return null;
}

// =====================================================================
// 1) CONSOLIDATED REPORT (area-wise + category-wise)
// =====================================================================
const generateConsolidatedPDF = (summaryData, filePath, options = {}) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: MARGIN,
      bufferPages: true,
      info: {
        Title: "Consolidated Civic Complaint Report",
        Author: "Civic Complaint Portal",
      },
    });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const now = new Date();
    const refNo = `CCP-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
      now.getHours()
    )}${pad(now.getMinutes())}`;

    // ----- Data taiyar karo -----
    const blank = () => ({ count: 0, pending: 0, inProgress: 0, resolved: 0 });
    const add = (t, it) => {
      t.count += it.count;
      t.pending += it.pending;
      t.inProgress += it.inProgress;
      t.resolved += it.resolved;
    };

    const totals = blank();
    const byCategory = {};
    const byArea = {};

    summaryData.forEach((it) => {
      add(totals, it);
      const cat = it._id.category;
      const area = it._id.area;
      byCategory[cat] = byCategory[cat] || blank();
      add(byCategory[cat], it);
      byArea[area] = byArea[area] || { ...blank(), rows: [] };
      add(byArea[area], it);
      byArea[area].rows.push({ category: cat, ...it });
    });

    const unresolved = totals.pending + totals.inProgress;
    const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

    const areaList = Object.entries(byArea).sort((a, b) => b[1].count - a[1].count);
    const catList = Object.entries(byCategory).sort((a, b) => b[1].count - a[1].count);
    const topArea = areaList[0];
    const topCat = catList[0];

    // ----- Banner -----
    drawBanner(doc, {
      title: "Consolidated Complaint Report",
      subtitle: "Area-wise and category-wise summary of civic complaints",
      meta: [
        ["REPORT NO.", refNo],
        ["GENERATED ON", fmtDateTime(now)],
      ],
    });

    // ----- To / From boxes -----
    {
      const y = doc.y;
      const gap = 12;
      const w = (CONTENT_W - gap) / 2;
      const h = 58;
      const boxes = [
        {
          label: "SUBMITTED TO",
          title: "The Municipal Commissioner",
          sub: "Ward Office, Municipal Corporation",
        },
        {
          label: "PREPARED BY",
          title: "Civic Complaint Portal",
          sub: options.period
            ? `Period: ${fmtDate(options.period.from)} to ${fmtDate(options.period.to)}`
            : "Administration Desk",
        },
      ];
      boxes.forEach((b, i) => {
        const x = MARGIN + i * (w + gap);
        doc.lineWidth(0.7).roundedRect(x, y, w, h, 6).fillAndStroke("#FFFFFF", C.line);
        doc
          .fillColor(C.muted)
          .font("Helvetica")
          .fontSize(7.5)
          .text(b.label, x + 14, y + 10, { characterSpacing: 1, lineBreak: false });
        doc
          .fillColor(C.text)
          .font("Helvetica-Bold")
          .fontSize(11)
          .text(b.title, x + 14, y + 23, { width: w - 28, lineBreak: false });
        doc
          .fillColor(C.muted)
          .font("Helvetica")
          .fontSize(9)
          .text(b.sub, x + 14, y + 40, { width: w - 28, lineBreak: false });
      });
      doc.y = y + h + 14;

      doc
        .fillColor(C.text)
        .font("Helvetica")
        .fontSize(9.5)
        .text(
          "This report summarises the civic complaints received through the Civic Complaint Portal, " +
            "grouped by area and category, along with their current resolution status. " +
            "The high-priority items listed below are requested for your kind attention and necessary action.",
          MARGIN,
          doc.y,
          { width: CONTENT_W, lineGap: 2 }
        );
      doc.y += 4;
    }

    // ----- Executive summary -----
    sectionTitle(doc, "Executive Summary", 130);
    statCards(doc, [
      { label: "Total Complaints", value: totals.count, color: C.text },
      { label: "Pending", value: totals.pending, color: C.pending },
      { label: "In Progress", value: totals.inProgress, color: C.progress },
      { label: "Resolved", value: totals.resolved, color: C.resolved },
      { label: "Resolution Rate", value: `${pct(totals.resolved, totals.count)}%`, color: C.accent },
    ]);

    const insights = [];
    if (topArea) {
      insights.push(
        `${titleCase(topArea[0])} has the highest number of complaints: ${topArea[1].count} ` +
          `(${pct(topArea[1].count, totals.count)}% of all complaints).`
      );
    }
    if (topCat) {
      insights.push(
        `${catLabel(topCat[0])} is the most reported category with ${topCat[1].count} complaint(s).`
      );
    }
    insights.push(
      `${unresolved} complaint(s) (${pct(unresolved, totals.count)}%) are still unresolved ` +
        `(${totals.pending} pending, ${totals.inProgress} in progress).`
    );
    bullets(doc, insights);

    // ----- Priority complaints -----
    if (options.priority && options.priority.length) {
      sectionTitle(doc, "High-Priority Unresolved Complaints", 34 + 24 + options.priority.length * 22 + 20);
      const cols = [
        { label: "#", width: 22, align: "center" },
        { label: "Complaint", width: 134 },
        { label: "Address / Area", width: 128 },
        { label: "Category", width: 66 },
        { label: "Votes", width: 46, align: "center", bold: true },
        {
          label: "Status",
          width: 66,
          color: (cell) => (cell === "In Progress" ? C.progress : C.pending),
          bold: true,
        },
        { label: "Age", width: 53, align: "right" },
      ];
      const rows = options.priority.map((c, i) => [
        i + 1,
        c.title,
        c.address || titleCase(c.area),
        catLabel(c.category),
        c.upvotes,
        c.status,
        `${daysSince(c.createdAt)} days`,
      ]);
      drawTable(doc, cols, rows, { rowHeight: 22, keepTogether: true });
      doc
        .fillColor(C.muted)
        .font("Helvetica-Oblique")
        .fontSize(8)
        .text("Priority is decided by citizen upvotes. For equal upvotes, the older complaint comes first.", MARGIN, doc.y - 6, {
          width: CONTENT_W,
        });
      doc.y += 6;
    }

    // ----- Category-wise summary -----
    sectionTitle(doc, "Category-wise Summary", 34 + 24 + (catList.length + 1) * 22 + 6);
    {
      const cols = [
        { label: "Category", width: 165, bold: true },
        { label: "Total", width: 65, align: "center" },
        { label: "Pending", width: 70, align: "center", color: countColor("pending") },
        { label: "In Progress", width: 80, align: "center", color: countColor("progress") },
        { label: "Resolved", width: 70, align: "center", color: countColor("resolved") },
        { label: "Share", width: 65, align: "right" },
      ];
      const rows = catList.map(([cat, v]) => [
        catLabel(cat),
        v.count,
        v.pending,
        v.inProgress,
        v.resolved,
        `${pct(v.count, totals.count)}%`,
      ]);
      drawTable(doc, cols, rows, {
        keepTogether: true,
        rowHeight: 22,
        footerRow: ["Total", totals.count, totals.pending, totals.inProgress, totals.resolved, "100%"],
      });
    }

    // ----- Area-wise detail -----
    sectionTitle(doc, "Area-wise Detail", 130);
    areaList.forEach(([area, v]) => {
      const rows = v.rows
        .sort((a, b) => b.count - a.count)
        .map((r) => [catLabel(r.category), r.count, r.pending, r.inProgress, r.resolved]);

      ensureSpace(doc, 30 + 24 + rows.length * 22 + 20);

      const y = doc.y;
      doc.roundedRect(MARGIN, y, CONTENT_W, 26, 4).fill(C.soft);
      doc
        .fillColor(C.primary)
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(titleCase(area), MARGIN + 12, y + 8, { width: 260, lineBreak: false });
      doc
        .fillColor(C.muted)
        .font("Helvetica")
        .fontSize(9)
        .text(
          `${v.count} complaint(s)  |  ${v.resolved} resolved  |  ${v.pending + v.inProgress} open`,
          MARGIN + 250,
          y + 9,
          { width: CONTENT_W - 262, align: "right", lineBreak: false }
        );
      doc.y = y + 30;

      const cols = [
        { label: "Category", width: 215 },
        { label: "Total", width: 75, align: "center", bold: true },
        { label: "Pending", width: 75, align: "center", color: countColor("pending") },
        { label: "In Progress", width: 80, align: "center", color: countColor("progress") },
        { label: "Resolved", width: 70, align: "center", color: countColor("resolved") },
      ];
      drawTable(doc, cols, rows, { rowHeight: 22, light: true });
      doc.y += 2;
    });

    // ----- Action requested + sign-off -----
    ensureSpace(doc, 130);
    {
      const y = doc.y + 6;
      doc.lineWidth(0.7).roundedRect(MARGIN, y, CONTENT_W, 58, 6).fillAndStroke("#FFFBEB", "#FDE68A");
      doc
        .fillColor("#92400E")
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .text("ACTION REQUESTED", MARGIN + 14, y + 10, { characterSpacing: 1, lineBreak: false });
      doc
        .fillColor(C.text)
        .font("Helvetica")
        .fontSize(9)
        .text(
          "The concerned departments are requested to review the above complaints, take the necessary action, " +
            "and update the status on the Civic Complaint Portal so that citizens are informed of the progress.",
          MARGIN + 14,
          y + 25,
          { width: CONTENT_W - 28, lineGap: 1.5 }
        );

      const sy = y + 58 + 44;
      doc.moveTo(PAGE_W - MARGIN - 190, sy).lineTo(PAGE_W - MARGIN, sy).lineWidth(0.7).strokeColor(C.muted).stroke();
      doc
        .fillColor(C.text)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text("Authorised Signatory", PAGE_W - MARGIN - 190, sy + 5, { width: 190, align: "center", lineBreak: false });
      doc
        .fillColor(C.muted)
        .font("Helvetica")
        .fontSize(8)
        .text("Civic Complaint Portal - Administration", PAGE_W - MARGIN - 190, sy + 17, {
          width: 190,
          align: "center",
          lineBreak: false,
        });
      doc.y = sy + 30;
    }

    addFooters(doc, `Civic Complaint Portal  |  ${refNo}  |  Official report - for municipal use`);

    doc.end();
    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });

// =====================================================================
// 2) SINGLE COMPLAINT REPORT
// =====================================================================
function kvGrid(doc, items) {
  const cols = 2;
  const cellH = 42;
  const pd = 14;
  const rows = Math.ceil(items.length / cols);
  const h = rows * cellH + 10;
  ensureSpace(doc, h + 10);
  const y = doc.y;

  doc.lineWidth(0.7).roundedRect(MARGIN, y, CONTENT_W, h, 6).fillAndStroke("#FFFFFF", C.line);
  const cw = CONTENT_W / cols;

  items.forEach((it, i) => {
    const cx = MARGIN + (i % cols) * cw + pd;
    const cy = y + 10 + Math.floor(i / cols) * cellH;

    doc
      .fillColor(C.muted)
      .font("Helvetica")
      .fontSize(7.5)
      .text(it.label.toUpperCase(), cx, cy, { width: cw - pd * 2, lineBreak: false, characterSpacing: 0.8 });

    if (it.chip) {
      doc.font("Helvetica-Bold").fontSize(9);
      const tw = doc.widthOfString(it.value) + 20;
      doc.roundedRect(cx, cy + 12, tw, 17, 8.5).fill(it.chip.bg);
      doc
        .fillColor(it.chip.fg)
        .text(it.value, cx, cy + 16.5, { width: tw, align: "center", lineBreak: false });
    } else {
      doc.font("Helvetica-Bold").fontSize(10.5);
      doc
        .fillColor(C.text)
        .text(fit(doc, it.value, cw - pd * 2), cx, cy + 13, { width: cw - pd * 2, lineBreak: false });
    }
  });

  doc.y = y + h + 6;
}

function drawTimeline(doc, status, createdAt, updatedAt) {
  ensureSpace(doc, 90);
  const steps = ["Reported", "In Progress", "Resolved"];
  const current = status === "Resolved" ? 2 : status === "In Progress" ? 1 : 0;
  const y = doc.y + 4;
  const xs = [MARGIN + 70, MARGIN + CONTENT_W / 2, MARGIN + CONTENT_W - 70];

  for (let i = 0; i < 2; i++) {
    doc
      .moveTo(xs[i] + 12, y + 12)
      .lineTo(xs[i + 1] - 12, y + 12)
      .lineWidth(3)
      .strokeColor(i < current ? C.accent : "#D1D5DB")
      .stroke();
  }

  steps.forEach((s, i) => {
    const reached = i <= current;
    doc.circle(xs[i], y + 12, 12).fill(reached ? C.accent : "#D1D5DB");
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(String(i + 1), xs[i] - 12, y + 7.5, { width: 24, align: "center", lineBreak: false });
    doc
      .fillColor(reached ? C.text : C.muted)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(s, xs[i] - 55, y + 30, { width: 110, align: "center", lineBreak: false });

    let sub = "";
    if (i === 0) sub = fmtDate(createdAt);
    if (i === 2 && status === "Resolved") sub = fmtDate(updatedAt);
    if (sub) {
      doc
        .fillColor(C.muted)
        .font("Helvetica")
        .fontSize(8)
        .text(sub, xs[i] - 55, y + 43, { width: 110, align: "center", lineBreak: false });
    }
  });

  doc.y = y + 62;
}

function photoBox(doc, x, y, w, h, caption, image, emptyText) {
  doc
    .fillColor(C.muted)
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text(caption.toUpperCase(), x, y, { characterSpacing: 0.8, lineBreak: false });

  const by = y + 13;
  doc.lineWidth(0.7).roundedRect(x, by, w, h, 6).fillAndStroke("#F9FAFB", C.line);

  if (image) {
    try {
      doc.image(image, x + 6, by + 6, {
        fit: [w - 12, h - 12],
        align: "center",
        valign: "center",
      });
      return;
    } catch (e) {
      /* image problem ho to placeholder dikhao */
    }
  }
  doc
    .fillColor(C.muted)
    .font("Helvetica")
    .fontSize(9)
    .text(emptyText, x + 10, by + h / 2 - 5, { width: w - 20, align: "center" });
}

const generateComplaintPDF = async (complaint, filePath) => {
  const [beforeImg, afterImg] = await Promise.all([
    loadImage(complaint.photoUrl),
    loadImage(complaint.resolutionPhoto),
  ]);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: MARGIN,
      bufferPages: true,
      info: { Title: `Complaint Report ${complaint._id}`, Author: "Civic Complaint Portal" },
    });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const refNo = `CCP-${String(complaint._id).slice(-6).toUpperCase()}`;
    const style = STATUS_STYLE[complaint.status] || STATUS_STYLE.Pending;

    drawBanner(doc, {
      title: "Complaint Report",
      subtitle: complaint.title,
      meta: [
        ["REFERENCE NO.", refNo],
        ["GENERATED ON", fmtDateTime(new Date())],
      ],
    });

    // Subject
    doc
      .fillColor(C.muted)
      .font("Helvetica")
      .fontSize(7.5)
      .text("SUBJECT", MARGIN, doc.y, { characterSpacing: 1, lineBreak: false });
    doc
      .fillColor(C.text)
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(complaint.title, MARGIN, doc.y + 12, { width: CONTENT_W });
    doc.y += 8;

    // Details grid
    sectionTitle(doc, "Complaint Details", 190);
    kvGrid(doc, [
      { label: "Complaint ID", value: String(complaint._id) },
      { label: "Reported On", value: fmtDateTime(complaint.createdAt) },
      { label: "Category", value: catLabel(complaint.category) },
      { label: "Status", value: complaint.status, chip: style },
      { label: "Assigned To", value: complaint.assignedTo || "Not Assigned" },
      { label: "Citizen Upvotes", value: String(complaint.upvotes || 0) },
      { label: "Area / Locality", value: titleCase(complaint.area) },
      {
        label: complaint.status === "Resolved" ? "Resolved On" : "Last Updated",
        value: fmtDateTime(complaint.updatedAt),
      },
    ]);

    // Location
    {
      const text = complaint.address || "Address not provided";
      doc.font("Helvetica").fontSize(10);
      const th = doc.heightOfString(text, { width: CONTENT_W - 28 });
      sectionTitle(doc, "Location", th + 60);
      const y = doc.y;
      doc.lineWidth(0.7).roundedRect(MARGIN, y, CONTENT_W, th + 22, 6).fillAndStroke("#FFFFFF", C.line);
      doc
        .fillColor(C.text)
        .font("Helvetica")
        .fontSize(10)
        .text(text, MARGIN + 14, y + 11, { width: CONTENT_W - 28 });
      doc.y = y + th + 28;
    }

    // Description
    {
      const text = complaint.description || "-";
      doc.font("Helvetica").fontSize(10);
      const th = doc.heightOfString(text, { width: CONTENT_W - 28, lineGap: 2 });
      sectionTitle(doc, "Description", th + 60);
      const y = doc.y;
      doc.lineWidth(0.7).roundedRect(MARGIN, y, CONTENT_W, th + 22, 6).fillAndStroke("#FFFFFF", C.line);
      doc
        .fillColor(C.text)
        .font("Helvetica")
        .fontSize(10)
        .text(text, MARGIN + 14, y + 11, { width: CONTENT_W - 28, lineGap: 2 });
      doc.y = y + th + 28;
    }

    // Progress
    sectionTitle(doc, "Progress", 110);
    drawTimeline(doc, complaint.status, complaint.createdAt, complaint.updatedAt);

    // Photos
    sectionTitle(doc, "Photographic Evidence", 215);
    {
      const y = doc.y;
      const gap = 12;
      const w = (CONTENT_W - gap) / 2;
      const h = 160;
      photoBox(
        doc, MARGIN, y, w, h, "Reported photo (before)", beforeImg,
        complaint.photoUrl ? "Photo is available on the portal\n(format could not be embedded)" : "No photo uploaded"
      );
      photoBox(
        doc, MARGIN + w + gap, y, w, h, "Resolution proof (after)", afterImg,
        complaint.resolutionPhoto
          ? "Photo is available on the portal\n(format could not be embedded)"
          : complaint.status === "Resolved" ? "No proof uploaded" : "Awaiting resolution"
      );
      doc.y = y + h + 22;
    }

    // Official use
    sectionTitle(doc, "For Official Use", 130);
    {
      const y = doc.y;
      doc.lineWidth(0.7).roundedRect(MARGIN, y, CONTENT_W, 84, 6).fillAndStroke("#FFFFFF", C.line);
      doc.fillColor(C.muted).font("Helvetica").fontSize(8.5);
      doc.text("Action taken:", MARGIN + 14, y + 14, { lineBreak: false });
      doc.moveTo(MARGIN + 80, y + 24).lineTo(MARGIN + CONTENT_W - 14, y + 24).lineWidth(0.5).strokeColor(C.muted).stroke();
      doc.text("Officer name & signature:", MARGIN + 14, y + 52, { lineBreak: false });
      doc.moveTo(MARGIN + 130, y + 62).lineTo(MARGIN + 300, y + 62).stroke();
      doc.text("Date:", MARGIN + 320, y + 52, { lineBreak: false });
      doc.moveTo(MARGIN + 350, y + 62).lineTo(MARGIN + CONTENT_W - 14, y + 62).stroke();
      doc.y = y + 90;
    }

    addFooters(doc, `Civic Complaint Portal  |  ${refNo}  |  Official complaint report`);

    doc.end();
    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};

module.exports = { generateComplaintPDF, generateConsolidatedPDF };