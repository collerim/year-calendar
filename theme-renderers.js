// Core canvas rendering helpers for year-calendar themes.

function drawDailyThemeBackground(ctx, theme, width, height) {
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, theme.gradient[0]);
  bg.addColorStop(0.5, theme.gradient[1]);
  bg.addColorStop(1, theme.gradient[2]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  drawAtmosphericColorField(ctx, theme, width, height);

  ctx.fillStyle = THEME_CONFIG.overlay;
  ctx.fillRect(0, 0, width, height);

  drawSoftGlow(ctx, 215, 250, 300, theme.accent, 0.1);
  drawSoftGlow(ctx, 1100, 2480, 360, theme.secondary, 0.1);

  const glow = ctx.createRadialGradient(width / 2, height * 0.2, 0, width / 2, height * 0.2, height * 0.75);
  glow.addColorStop(0, hexToRgba(theme.accent, 0.22));
  glow.addColorStop(0.58, hexToRgba(theme.secondary, 0.05));
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  drawThemeDecorations(ctx, theme, width, height);
}

function drawAtmosphericColorField(ctx, theme, width, height) {
  const variant = themeVariant(theme, 7, 8);

  const topWash = ctx.createRadialGradient(width * 0.22, height * 0.08, 0, width * 0.22, height * 0.08, height * 0.58);
  topWash.addColorStop(0, hexToRgba(theme.accent, 0.22));
  topWash.addColorStop(0.52, hexToRgba(theme.gradient[1], 0.08));
  topWash.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topWash;
  ctx.fillRect(0, 0, width, height);

  const lowerWash = ctx.createRadialGradient(width * 0.78, height * 0.88, 0, width * 0.78, height * 0.88, height * 0.62);
  lowerWash.addColorStop(0, hexToRgba(theme.secondary, 0.18));
  lowerWash.addColorStop(0.58, hexToRgba(theme.gradient[0], 0.07));
  lowerWash.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = lowerWash;
  ctx.fillRect(0, 0, width, height);

  for (let band = 0; band < 3; band++) {
    const y = 180 + band * 880 + variant * 18;
    const ribbon = ctx.createLinearGradient(0, y, width, y + 260);
    ribbon.addColorStop(0, "rgba(0,0,0,0)");
    ribbon.addColorStop(0.28, hexToRgba(band % 2 ? theme.secondary : theme.accent, 0.045));
    ribbon.addColorStop(0.5, hexToRgba(theme.gradient[1], 0.035));
    ribbon.addColorStop(0.72, hexToRgba(band % 2 ? theme.accent : theme.secondary, 0.045));
    ribbon.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = ribbon;
    ctx.save();
    ctx.translate(width / 2, y);
    ctx.rotate((-5 + band * 4 + variant) * Math.PI / 180);
    ctx.fillRect(-width, -90, width * 2, 260);
    ctx.restore();
  }

  const vignette = ctx.createLinearGradient(0, 0, 0, height);
  vignette.addColorStop(0, "rgba(0,0,0,0.18)");
  vignette.addColorStop(0.36, "rgba(0,0,0,0)");
  vignette.addColorStop(0.72, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.34)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function drawThemeCaption(ctx, theme, x, y) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const meta = themeMetaLine(theme);
  if (meta) {
    ctx.fillStyle = hexToRgba(theme.accent, 0.68);
    drawFittedText(ctx, meta, x, y - 58, 860, 18, 14);
    drawCaptionRule(ctx, theme, x, y - 42);
  }

  ctx.fillStyle = "rgba(242,242,246,0.86)";
  const title = themeDisplayTitle(theme);
  const titleSize = /^[\u4e00-\u9fff]{2,6}$/.test(title) ? 40 : 36;
  drawFittedText(ctx, title, x, y - 6, 980, titleSize, 25);

  ctx.fillStyle = "rgba(215,215,219,0.66)";
  drawFittedText(ctx, theme.description, x, y + 39, 1040, 23, 17);
  ctx.restore();
}

function themeMetaLine(theme) {
  if (theme.source?.countryName) {
    const countryName = countryNameWithFlag(theme.source);
    return `${countryName} · ${holidayTypeLabelFromSource(theme.source)}`;
  }
  if (hasTag(theme, "seasonal")) return "季节气质";
  if (hasTag(theme, "civic")) return "公共节日";
  if (hasTag(theme, "celebration")) return "节庆日";
  return "";
}

function countryNameWithFlag(source = {}) {
  const flag = countryFlagEmoji(source.countryCode);
  const country = countryNameZh(source);
  return flag ? `${flag} ${country}` : country;
}

function countryFlagEmoji(countryCode = "") {
  const code = String(countryCode).toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || code === "UN") return "";
  return [...code]
    .map((letter) => String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65))
    .join("");
}

function themeDisplayTitle(theme) {
  const content = holidayContentFor(theme.title, theme.source || {});

  if (theme.source?.countryCode === "CN") {
    const localName = theme.source.localName && theme.source.localName !== theme.title ? theme.source.localName : "";
    if (localName && /[\u4e00-\u9fff]/.test(localName) && !/[\u4e00-\u9fff]/.test(theme.title)) {
      return `${localName} · ${content?.title || theme.title}`;
    }
  }

  if (hasTag(theme, "month-mood")) return seasonalDisplayTitle(theme);
  if (content?.title) return content.title;
  return theme.title;
}

function seasonalDisplayTitle(theme) {
  const zhMonth = theme.caption?.split("·")[0]?.trim() || "";
  const month = ZH_MONTH_TO_EN[zhMonth] || "Seasonal";
  const suffix = theme.title.replace(zhMonth, "");
  const motifTitle = SEASONAL_TITLE_EN[suffix] || theme.title;
  return `${month} ${motifTitle}`;
}

function drawCaptionRule(ctx, theme, x, y) {
  strokePath(ctx, [[x - 265, y], [x - 46, y]], theme.secondary, 1.4, 0.15);
  strokePath(ctx, [[x + 46, y], [x + 265, y]], theme.secondary, 1.4, 0.15);
  drawDiamond(ctx, x, y, 6, theme.accent, 0.28);
  drawDiamond(ctx, x - 32, y, 4, theme.secondary, 0.18);
  drawDiamond(ctx, x + 32, y, 4, theme.secondary, 0.18);
}

function drawFittedText(ctx, text, x, y, maxWidth, startSize, minSize) {
  let size = startSize;
  do {
    ctx.font = `${size}px ${FONT_STACK}`;
    if (ctx.measureText(text).width <= maxWidth || size <= minSize) break;
    size -= 1;
  } while (size > minSize);
  ctx.fillText(text, x, y);
}

function hexToRgba(hex, alpha) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawSoftGlow(ctx, x, y, r, color, alpha) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
  gradient.addColorStop(0, hexToRgba(color, alpha));
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function strokePath(ctx, points, color, width, alpha) {
  ctx.save();
  ctx.strokeStyle = hexToRgba(color, alpha);
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (p.length === 2) ctx.lineTo(p[0], p[1]);
    else ctx.bezierCurveTo(p[0], p[1], p[2], p[3], p[4], p[5]);
  }
  ctx.stroke();
  ctx.restore();
}

function drawEllipse(ctx, x, y, rx, ry, rotation, color, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = hexToRgba(color, alpha);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStar(ctx, x, y, outer, inner, color, alpha) {
  ctx.save();
  ctx.fillStyle = hexToRgba(color, alpha);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 10;
    const r = i % 2 === 0 ? outer : inner;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawDiamond(ctx, x, y, size, color, alpha) {
  ctx.save();
  ctx.fillStyle = hexToRgba(color, alpha);
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTinyGlyphFlower(ctx, theme, cx, cy, size, alpha) {
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6;
    drawEllipse(ctx, cx + Math.cos(angle) * size * 0.42, cy + Math.sin(angle) * size * 0.42, size * 0.14, size * 0.3, angle, i % 2 ? theme.secondary : theme.accent, alpha);
  }
  dot(ctx, cx, cy, size * 0.13, theme.accent, alpha);
}

function dot(ctx, x, y, r, color, alpha) {
  ctx.fillStyle = hexToRgba(color, alpha);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
