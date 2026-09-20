const COUNTRY_NAMES_ZH = {
  INTL: "国际",
  CN: "中国",
  US: "美国",
  JP: "日本",
  SG: "新加坡",
  FR: "法国",
  GB: "英国",
  CA: "加拿大",
  AU: "澳大利亚",
  DE: "德国",
  IT: "意大利",
  ES: "西班牙",
  KR: "韩国",
  TH: "泰国",
  CH: "瑞士",
  NO: "挪威",
  MX: "墨西哥",
  BR: "巴西",
  IN: "印度",
  ZA: "南非",
  NZ: "新西兰"
};

const REGION_NAMES_ZH = typeof Intl !== "undefined" && Intl.DisplayNames
  ? new Intl.DisplayNames(["zh-Hans"], { type: "region" })
  : null;

const HOLIDAY_TYPE_LABELS = {
  Public: "公众节日",
  Bank: "银行假日",
  School: "学校假日",
  Authorities: "政府机关假日",
  Optional: "可选假日",
  Observance: "纪念日"
};

const DAY_INTROS = {
  "New Year's Day": "公历新年的第一天，用烟火和微光开启新一年的日历。",
  "Valentine's Day": "情人节，以玫瑰、书信和温柔心意纪念亲密关系。",
  "Saint Patrick's Day": "爱尔兰文化节日，常以三叶草和绿色游行庆祝。",
  Songkran: "泰国传统新年，泼水象征洗去旧岁、迎接祝福。",
  "Earth Day": "世界地球日，提醒人们关注环境保护与生态共生。",
  "International Workers' Day": "国际劳动节，纪念劳动者权益与春日劳动精神。",
  "Children's Day Japan": "日本儿童节，鲤鱼旗象征孩子健康成长、乘风向上。",
  "Tonga Emancipation Day": "汤加解放日，纪念自由与岛屿共同体的历史时刻。",
  "Iceland National Day": "冰岛国庆日，纪念共和国成立和北大西洋夏日传统。",
  "Seychelles National Day": "塞舌尔国庆日，用群岛旗色与海风庆祝国家身份。",
  "Mozambique Independence Day": "莫桑比克独立日，纪念国家独立与海岸节庆鼓点。",
  "Seychelles Independence Day": "塞舌尔独立日，纪念印度洋群岛走向独立的日子。",
  "Independence Day": "美国独立日，常以烟火、旗帜和夏夜聚会庆祝。",
  Tanabata: "七夕源自星河传说，人们写下愿望挂在短册上。",
  "Bastille Day": "法国国庆日，纪念法国大革命中的巴士底狱事件。",
  "Maldives Independence Day": "马尔代夫独立日，以珊瑚海与绿色旗影纪念主权。",
  "Vanuatu Independence Day": "瓦努阿图独立日，纪念南太平洋岛国的独立庆典。",
  "Swiss National Day": "瑞士国庆日，山间灯火和红白旗色是节日符号。",
  "Singapore National Day": "新加坡国庆日，城市海湾常被红白旗色与烟火点亮。",
  "San Marino Foundation Day": "圣马力诺建国日，纪念山城古国的共和国传统。",
  "Andorra National Day": "安道尔国家日，纪念比利牛斯山间小国的守护传统。",
  "Mexico Independence Day": "墨西哥独立日，钟声、广场和绿白红旗帜是核心意象。",
  "Tuvalu Independence Day": "图瓦卢独立日，纪念太平洋岛国的国家生日。",
  "Germany Unity Day": "德国统一日，纪念东西德重新统一的现代历史时刻。",
  Halloween: "万圣夜前夕，南瓜灯、夜色和装扮构成十月节庆。",
  "All Saints' Day": "诸圣节，用鲜花与烛光纪念圣徒和逝去的人。",
  "Dia de Muertos": "亡灵节，以万寿菊、祭坛和色彩记住亲人。",
  "Remembrance Day": "阵亡将士纪念日，红罂粟象征静默追思。",
  "Saint Lucia Day": "圣露西亚节，冬夜烛冠与歌声象征光回到人间。",
  "Bhutan National Day": "不丹国庆日，在山风和彩旗中纪念国家历史。",
  "Christmas Eve": "平安夜，冬夜窗灯、松枝与等待构成节日前奏。",
  "Christmas Day": "圣诞节，用松枝、钟声和雪光庆祝冬日团聚。",
  "New Year's Eve": "跨年夜，在倒数与烟火中告别旧岁、迎向新年。",
  Thanksgiving: "感恩节，以秋日餐桌和团聚表达感谢。",
  "World Oceans Day": "世界海洋日，提醒人们保护潮汐、海风与蓝色星球。",
  "Fiji Day": "斐济日，纪念群岛国家的独立与南太平洋节庆传统。",
  "Monaco National Day": "摩纳哥国庆日，海岸城邦用红白旗色纪念国家传统。",
  "Liechtenstein National Day": "列支敦士登国庆日，在阿尔卑斯山间庆祝国家身份。",
  "Tonga National Day": "汤加国庆日，以岛风、旗色和共同体记忆庆祝国家日。",
  "Kiribati Independence Day": "基里巴斯独立日，纪念太平洋岛国走向独立。",
  "Nauru Independence Day": "瑙鲁独立日，纪念蓝海岛国的国家生日。",
  "Palau Constitution Day": "帕劳宪法日，纪念宪法秩序与太平洋岛国身份。",
  "Samoa Independence Day": "萨摩亚独立日，纪念南太平洋群岛国家的独立。",
  "San Marino Civic Day": "圣马力诺公民日，纪念共和国传统与山城公民身份。",
  "Malta Republic Day": "马耳他共和国日，纪念地中海岛国的共和国历史。",
  "Cyprus Independence Day": "塞浦路斯独立日，纪念地中海岛国的独立。",
  "Belize Independence Day": "伯利兹独立日，纪念中美洲国家的独立与热带庆典。",
  "Cape Verde Independence Day": "佛得角独立日，纪念大西洋群岛国家的独立。",
  "Saint Lucia Independence Day": "圣卢西亚独立日，纪念加勒比岛国的独立。",
  "Barbados Independence Day": "巴巴多斯独立日，纪念加勒比岛国的独立与金蓝旗色。",
  "Botswana Day": "博茨瓦纳日，纪念国家独立与蓝白黑旗色传统。",
  "Estonia Independence Day": "爱沙尼亚独立日，纪念北方国家的独立。",
  "Georgia Independence Day": "格鲁吉亚独立日，纪念高加索国家的独立。",
  "Nepal Constitution Day": "尼泊尔宪法日，纪念喜马拉雅山国的宪法时刻。",
  "Laos National Day": "老挝国庆日，纪念湄公河畔国家的现代历史。",
  "Qatar National Day": "卡塔尔国庆日，纪念海湾国家的历史与酒红旗色。",
  "Oman National Day": "阿曼国庆日，以红绿白旗色纪念海湾国家传统。",
  "Mongolia Naadam": "那达慕是蒙古传统节庆，草原竞技与彩旗是核心意象。",
  "Norway Constitution Day": "挪威宪法日，峡湾蓝与五月旗海庆祝国家宪法。"
};

const FIXED_HOLIDAYS = [
  ["01-01", "New Year's Day", "New Year's Day · 新年第一束光", "fireworks", ["#151a2d", "#493456", "#111316"], "#d6c070", "#78b8e6", 90],
  ["02-14", "Valentine's Day", "Valentine's Day · 玫瑰色的二月心跳", "petals", ["#241525", "#643044", "#111214"], "#e87a94", "#d7b56b", 70],
  ["03-17", "Saint Patrick's Day", "Saint Patrick's Day · 绿意、三叶草与春日游行", "clover", ["#0d2a20", "#184936", "#111516"], "#72c46b", "#d7bc58", 82],
  ["04-13", "Songkran", "Songkran · 清水、花影与新年祝福", "waterFlowers", ["#0d2836", "#1d5a64", "#101518"], "#70d6d0", "#f2b8c6", 80],
  ["04-22", "Earth Day", "Earth Day · 山海与绿色星球", "aurora", ["#102622", "#2f5c4c", "#101516"], "#77c98e", "#75bdd8", 76],
  ["05-01", "International Workers' Day", "International Workers' Day · 春日劳动者之歌", "tricolor", ["#181b24", "#4d2c2f", "#111315"], "#e2534f", "#d8b95b", 74],
  ["05-05", "Children's Day Japan", "Children's Day · 鲤旗乘风，五月晴朗", "streamers", ["#102238", "#365a70", "#101418"], "#78bde6", "#e66b58", 72],
  ["06-04", "Tonga Emancipation Day", "Tonga Emancipation Day · 岛风、自由与珊瑚海", "waterFlowers", ["#10293a", "#2c6470", "#101417"], "#75cce8", "#d8555b", 84],
  ["06-17", "Iceland National Day", "Iceland National Day · 北大西洋的夏日微光", "aurora", ["#0f2233", "#274861", "#121419"], "#78c6e6", "#d8555b", 82],
  ["06-18", "Seychelles National Day", "Seychelles National Day · 印度洋的彩色海风", "sunRibbons", ["#10283a", "#345e68", "#101417"], "#6ecbe6", "#f0c95c", 76],
  ["06-25", "Mozambique Independence Day", "Mozambique Independence Day · 海岸、星光与鼓点", "starfield", ["#10251f", "#4b5134", "#111515"], "#77c98e", "#d8b95b", 72],
  ["06-29", "Seychelles Independence Day", "Seychelles Independence Day · 群岛的夏日旗色", "tricolor", ["#11233a", "#513044", "#111416"], "#6da2ff", "#f0c95c", 76],
  ["07-04", "Independence Day", "Independence Day · 烟火照亮夏夜", "fireworks", ["#101a34", "#4a2734", "#111316"], "#6aa7ff", "#e85a63", 78],
  ["07-07", "Tanabata", "Tanabata · 星河、短册与夏夜愿望", "tanabata", ["#0f1734", "#25265f", "#11131d"], "#9fc8ff", "#e6c86f", 78],
  ["07-14", "Bastille Day", "Bastille Day · 蓝白红的夏日庆典", "tricolor", ["#101d3f", "#4c2734", "#131318"], "#6aa7ff", "#e85a63", 78],
  ["07-26", "Maldives Independence Day", "Maldives Independence Day · 珊瑚海与绿色旗影", "waterFlowers", ["#0c2b32", "#1e5b54", "#101516"], "#6fd0d2", "#d8555b", 74],
  ["07-30", "Vanuatu Independence Day", "Vanuatu Independence Day · 南太平洋的晨风", "sunRibbons", ["#102621", "#514f29", "#101514"], "#d8bd5f", "#78c08a", 74],
  ["08-01", "Swiss National Day", "Swiss National Day · 山间灯火与红白旗色", "mountainFlags", ["#151b27", "#4d2727", "#111314"], "#e65b5b", "#f0f0f2", 76],
  ["08-09", "Singapore National Day", "Singapore National Day · 城市海湾的红白光", "fireworks", ["#121b2d", "#543038", "#111315"], "#e85a63", "#f3f3f5", 76],
  ["09-03", "San Marino Foundation Day", "San Marino Foundation Day · 山城古国的蓝白日", "mountainFlags", ["#112138", "#334a62", "#101417"], "#7fbbe8", "#f0f0f2", 80],
  ["09-08", "Andorra National Day", "Andorra National Day · 比利牛斯山间的节日", "mountainFlags", ["#121c33", "#54371f", "#111314"], "#f0b64d", "#6da2cf", 80],
  ["09-16", "Mexico Independence Day", "Mexico Independence Day · 绿白红与广场钟声", "tricolor", ["#10251f", "#4f2c31", "#111515"], "#70bf75", "#e85a63", 76],
  ["10-01", "Tuvalu Independence Day", "Tuvalu Independence Day · 太平洋小岛的晴蓝国庆", "waterFlowers", ["#0c2635", "#255d70", "#101417"], "#76cce8", "#f0c95c", 82],
  ["10-03", "Germany Unity Day", "Germany Unity Day · 黑红金的秋日光带", "tricolor", ["#151515", "#55302d", "#111111"], "#d8b95b", "#d65345", 74],
  ["10-31", "Halloween", "Halloween · 南瓜灯与十月夜色", "pumpkin", ["#17121f", "#4b2d13", "#111113"], "#f08a2d", "#8d65c5", 80],
  ["11-01", "All Saints' Day", "All Saints' Day · 烛光、花束与静默记忆", "petals", ["#151520", "#473d4c", "#111214"], "#d8c78f", "#b68fd8", 70],
  ["11-02", "Dia de Muertos", "Dia de Muertos · 鲜花与记忆之日", "marigold", ["#221535", "#5e2348", "#171115"], "#f2a23a", "#cf4f73", 86],
  ["11-11", "Remembrance Day", "Remembrance Day · 红罂粟与静默时刻", "petals", ["#17161c", "#4f2832", "#111214"], "#d65345", "#8e8e93", 72],
  ["12-13", "Saint Lucia Day", "Saint Lucia Day · 冬夜里的烛光歌声", "candle", ["#101827", "#37304d", "#111214"], "#f0c95c", "#f2f0d6", 78],
  ["12-17", "Bhutan National Day", "Bhutan National Day · 山风中的彩旗", "mountainFlags", ["#182035", "#583522", "#121316"], "#f0b64d", "#6da2cf", 82],
  ["12-24", "Christmas Eve", "Christmas Eve · 冬夜窗灯与松枝", "snow", ["#101827", "#263a35", "#111314"], "#d8c070", "#86b38c", 78],
  ["12-25", "Christmas Day", "Christmas Day · 松枝、雪光与节日钟声", "snow", ["#101827", "#2d4436", "#111314"], "#d8c070", "#d65345", 84],
  ["12-31", "New Year's Eve", "New Year's Eve · 倒数与新年的微光", "fireworks", ["#111729", "#493456", "#111316"], "#d6c070", "#8fc8ff", 82]
];

const FLOATING_RULES = [
  {
    title: "Thanksgiving",
    caption: "Thanksgiving · 秋日餐桌与感谢之夜",
    motif: "grain",
    gradient: ["#211916", "#604026", "#111314"],
    accent: "#d8a05f",
    secondary: "#9bb06d",
    priority: 76,
    match: (date) => date.getMonth() === 10 && nthWeekdayOfMonth(date, 4, 4)
  },
  {
    title: "World Oceans Day",
    caption: "World Oceans Day · 潮汐、海风与蓝色星球",
    motif: "waterFlowers",
    gradient: ["#0c2134", "#225a6a", "#101418"],
    accent: "#70cce8",
    secondary: "#8bd0b6",
    priority: 74,
    match: (date) => monthDay(date) === "06-08"
  }
];

const THEME_ENGINE_RANKING_RULES = globalThis.ThemeRankingRules || {
  withRankingMetadata(theme) {
    return theme;
  }
};

function createTheme({ title, caption, motif, gradient, accent, secondary, priority = 50, description, contentSource = "curated", tags = [], source = null, holidayFamily = "", popularityTier = "", scopeTier = "" }) {
  const theme = {
    title,
    caption,
    description: description || inferThemeDescription(title, caption),
    contentSource,
    motif,
    tags: Array.from(new Set([...(MOTIF_TAGS[motif] || []), ...inferThemeTags(title, caption), ...tags])),
    gradient,
    accent,
    secondary,
    priority,
    source,
    holidayFamily,
    popularityTier,
    scopeTier
  };
  return THEME_ENGINE_RANKING_RULES.withRankingMetadata(applyCulturalPalette(theme));
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16)
  ];
}

function rgbToHex([r, g, b]) {
  const channels = [r, g, b].map((value) => {
    const channel = Math.max(0, Math.min(255, Math.round(value)));
    return channel.toString(16).padStart(2, "0");
  });
  return `#${channels.join("")}`;
}

function mixHex(base, overlay, amount) {
  const a = hexToRgb(base);
  const b = hexToRgb(overlay);
  return rgbToHex(a.map((value, index) => value * (1 - amount) + b[index] * amount));
}

function hasTag(theme, tag) {
  return theme.tags && theme.tags.includes(tag);
}

function themeVariant(theme, modulo, salt = 0) {
  const text = `${theme.title}:${theme.motif}:${salt}`;
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash % modulo;
}

function applyCulturalPalette(theme) {
  const text = `${theme.title} ${theme.caption}`.toLowerCase();
  const countryPalette = theme.source?.countryCode ? CULTURAL_PALETTES[theme.source.countryCode] : null;
  const occasionPalette = OCCASION_PALETTES.find(([pattern]) => pattern.test(text))?.[1];
  const palette = occasionPalette || countryPalette;
  if (!palette) return theme;

  return {
    ...theme,
    gradient: palette.gradient,
    accent: palette.accent,
    secondary: palette.secondary,
    tags: Array.from(new Set([...theme.tags, ...(palette.tags || [])]))
  };
}

function applyPaletteAtmosphere(theme, date, index) {
  const tint = PALETTE_ATMOSPHERES[(dayOfYearForTheme(date) + themeVariant(theme, PALETTE_ATMOSPHERES.length) + index * 7) % PALETTE_ATMOSPHERES.length];
  const warmTint = PALETTE_ATMOSPHERES[(dayOfYearForTheme(date) * 3 + themeVariant(theme, PALETTE_ATMOSPHERES.length, 4)) % PALETTE_ATMOSPHERES.length];
  const culturalWeight = theme.source?.countryCode || /christmas|halloween|valentine|thanksgiving/i.test(theme.title) ? 0.12 : 0.22;
  const accentWeight = theme.source?.countryCode ? 0.1 : 0.18;

  return {
    ...theme,
    gradient: [
      mixHex(theme.gradient[0], tint, culturalWeight),
      mixHex(mixHex(theme.gradient[1], tint, culturalWeight * 0.8), theme.accent, 0.08),
      mixHex(theme.gradient[2], warmTint, culturalWeight * 0.55)
    ],
    accent: mixHex(theme.accent, tint, accentWeight),
    secondary: mixHex(theme.secondary, warmTint, accentWeight * 0.85)
  };
}

function inferThemeDescription(title, caption) {
  if (DAY_INTROS[title]) return DAY_INTROS[title];

  const phrase = caption.includes("·") ? caption.split("·").slice(1).join("·").trim() : caption;
  if (/Independence Day/i.test(title)) {
    return `${title.replace(" Independence Day", "")}的独立纪念日，${phrase}。`;
  }
  if (/National Day/i.test(title)) {
    return `${title.replace(" National Day", "")}的国家纪念日，${phrase}。`;
  }
  if (/Foundation Day/i.test(title)) {
    return `${title.replace(" Foundation Day", "")}的建国纪念日，${phrase}。`;
  }
  if (/Constitution Day/i.test(title)) {
    return `${title.replace(" Constitution Day", "")}的宪法纪念日，${phrase}。`;
  }
  if (/Republic Day/i.test(title)) {
    return `${title.replace(" Republic Day", "")}的共和国纪念日，${phrase}。`;
  }
  if (/Civic Day/i.test(title)) {
    return `${title.replace(" Civic Day", "")}的公民纪念日，${phrase}。`;
  }
  if (/Day$/i.test(title)) {
    return `${title}是具有地方或国家意义的纪念日，${phrase}。`;
  }

  return `${phrase}。`;
}

function inferThemeTags(title, caption) {
  const text = `${title} ${caption}`.toLowerCase();
  const tags = [];
  if (/ocean|sea|island|coast|pacific|atlantic|indian|maldives|seychelles|tonga|tuvalu|vanuatu|palau|fiji|samoa|kiribati|barbados|cape verde/.test(text)) tags.push("water", "island");
  if (/national|independence|republic|constitution|foundation|unity|workers|emancipation|bastille|swiss|mexico|germany/.test(text)) tags.push("civic");
  if (/christmas|winter|snow|lucia|estonia|norway|iceland|北方|冬|雪/.test(text)) tags.push("winter", "light");
  if (/earth|spring|flower|petal|rose|bud|clover|grain|harvest|谷|雨|春|麦|花|草|叶/.test(text)) tags.push("botanical");
  if (/star|firework|night|tanabata|eve|星|烟火|夜|光/.test(text)) tags.push("sky", "light");
  if (/mountain|alps|andes|pyrenees|himalaya|bhutan|nepal|andorra|san marino|山/.test(text)) tags.push("mountain");
  if (/memorial|remembrance|saints|muertos|candle|记忆|纪念|烛/.test(text)) tags.push("memorial");
  if (/halloween|children|songkran|thanksgiving|valentine|day|festival|庆典|节日|祝福/.test(text)) tags.push("celebration");
  if (/eid|ramadan|adha|fitr|islam|hijri|muharram|mawlid/.test(text)) tags.push("islamic", "religious");
  if (/saint|christian|church|orthodox|easter|pentecost|epiphany|buddha|vesak|diwali|hindu|buddhist/.test(text)) tags.push("religious");
  if (/parade|procession|carnival|festival|mardi gras|fiesta/.test(text)) tags.push("procession");
  if (/market|fair|bank holiday/.test(text)) tags.push("market");
  if (/indigenous|culture|heritage|language|literature|autonomy|regional|folk|tradition/.test(text)) tags.push("heritage", "folk");
  if (/sea|ocean|island|marine|harbour|harbor|azores|port/.test(text)) tags.push("maritime");
  if (/memorial|remembrance|reconciliation|peace|martyr|dead|souls|ancestors|muertos/.test(text)) tags.push("remembrance");
  if (/language|literature|book|education|teacher|poetry|press/.test(text)) tags.push("literature");
  if (/sport|youth|games|medal|olympic/.test(text)) tags.push("sports");
  if (/music|radio|jazz|choir|concert|dance|theatre|theater/.test(text)) tags.push("music", "culture");
  if (/science|space|astronomy|cosmos|technology|research|pi day/.test(text)) tags.push("science", "sky");
  if (/garden|nature|environment|ecology|forest|wildlife/.test(text)) tags.push("botanical");
  if (/navigation|nautical|sail|seafarer|navy|voyage/.test(text)) tags.push("maritime", "travel");
  return tags;
}

function monthDay(date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dayOfYearForTheme(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date - start) / 86400000) + 1;
}

function nthWeekdayOfMonth(date, weekday, nth) {
  if (date.getDay() !== weekday) return false;
  return Math.floor((date.getDate() - 1) / 7) + 1 === nth;
}

function seedForDate(date) {
  return date.getFullYear() * 1000 + dayOfYearForTheme(date);
}

function seededJitter(seed, index) {
  const x = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function fallbackTheme(date, motif = seasonalFallbackMotifs(date)[0], priorityOffset = 0) {
  const mood = MONTH_MOODS[date.getMonth()];
  const copy = seasonalFallbackCopy(date, mood, motif, priorityOffset);

  return createTheme({
    title: copy.title,
    caption: copy.caption,
    description: copy.description,
    contentSource: "seasonal",
    motif,
    gradient: mood.gradient,
    accent: mood.accent,
    secondary: mood.secondary,
    priority: 30 - priorityOffset,
    tags: [
      ...mood.tags,
      "month-mood"
    ]
  });
}

function fallbackThemes(date) {
  return seasonalFallbackMotifs(date).map((motif, index) => fallbackTheme(date, motif, index * 0.25));
}

function seasonalFallbackCopy(date, mood, motif, priorityOffset) {
  const motifCopy = SEASONAL_MOTIF_COPY[motif] || {
    titles: [mood.title],
    descriptions: [mood.intro]
  };
  const variantIndex = (date.getDate() + Math.round(priorityOffset * 4)) % motifCopy.titles.length;
  const title = `${mood.zhMonth}${motifCopy.titles[variantIndex]}`;
  const description = `${mood.intro}${motifCopy.descriptions[variantIndex]}`;
  return {
    title,
    caption: `${mood.zhMonth} · ${mood.mood}`,
    description
  };
}

function seasonalFallbackMotifs(date) {
  const motifs = MONTH_MOTIF_ROTATION[date.getMonth()];
  const start = (date.getDate() - 1) % motifs.length;
  return [...motifs.slice(start), ...motifs.slice(0, start)];
}

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function cachedHolidayThemes(date) {
  const cache = window.YearCalendarHolidayCache;
  const rawThemes = cache?.days?.[dateKey(date)];
  if (!Array.isArray(rawThemes)) return [];

  return rawThemes.map((theme) => createTheme({
    title: theme.title,
    caption: theme.caption,
    description: displayDescriptionForSource(theme),
    contentSource: contentSourceForTheme(theme),
    motif: theme.motif,
    gradient: theme.gradient,
    accent: theme.accent,
    secondary: theme.secondary,
    priority: theme.priority,
    tags: theme.tags || [],
    source: theme.source || null,
    holidayFamily: theme.holidayFamily || "",
    popularityTier: theme.popularityTier || "",
    scopeTier: theme.scopeTier || ""
  }));
}

function contentSourceForTheme(theme) {
  if (!["Nager.Date", "OpenHolidays"].includes(theme.source?.provider)) return "curated";
  if (holidayContentFor(theme.title, theme.source)?.description) return "structured";
  if (holidayIntroFor(theme.title, theme.source)) return "legacy";
  return "generic";
}

function displayDescriptionForSource(theme) {
  if (!theme.source) return theme.description;
  if (theme.source.provider === "Curated Cultural Observances") return theme.description;

  return holidayIntroduction(theme.title, theme.source, theme.description);
}

function holidayIntroduction(title, source, fallback) {
  const intro = holidayIntroFor(title, source);
  if (intro) return intro;

  const text = `${title} ${source?.localName || ""}`.toLowerCase();
  const country = countryNameZh(source);
  const localName = source?.localName && source.localName !== title ? source.localName : "";

  if (/king'?s birthday|queen'?s birthday/.test(text)) {
    if (source?.countryCode === "AU") {
      return "这是澳大利亚庆祝英国君主生日的假日，多数地区会把它安排成六月长周末，人们常借此休息、出行或参加社区活动。";
    }
    return "这是英联邦传统中的君主生日假日，用来象征君主制与国家礼仪，也常成为当地的长周末。";
  }
  if (/new year/.test(text)) return "新年假日标志公历年份开始，人们常用倒数、烟火、聚会和休息迎接新的日历周期。";
  if (/christmas/.test(text)) return "圣诞节源自基督教传统，后来也成为许多地方的冬日团聚节日，常见象征包括灯饰、松枝、礼物和家庭餐桌。";
  if (/boxing day/.test(text)) return "节礼日延续自英联邦传统，通常在圣诞节后一天，人们会继续休假、探亲、购物或观看体育赛事。";
  if (/good friday/.test(text)) return "耶稣受难日纪念基督教传统中耶稣受难的日子，许多地方会以静默礼拜和复活节前的休假来标记。";
  if (/easter/.test(text)) return "复活节源自基督教传统，纪念复活与新生，许多地方也有彩蛋、家庭聚会和春日休假的习俗。";
  if (/sacred heart/.test(text)) return "圣心节源自天主教传统，纪念耶稣圣心，许多地区会以弥撒、游行或地方守护庆典标记。";
  if (/corpus christi/.test(text)) return "基督圣体圣血节源自天主教传统，常以圣体游行、花毯和城镇仪式表达信仰共同体。";
  if (/midsummer|st john|st\. john|john's day/.test(text)) return "仲夏相关节日常见于欧洲传统，篝火、夏夜聚会和地方仪式是重要习俗。";
  if (/st\.?\s|saint|sankt|san |santa |santo /.test(text)) return saintDayIntroduction(title, country);
  if (/carnival|karneval|mardi gras/.test(text)) return "狂欢节通常出现在大斋期前后，人们以游行、面具、音乐和街头庆祝暂时打破日常秩序。";
  if (/municipal holiday|city day|town day|communal holiday|community holiday/.test(text)) return `${country}的地方假日，通常由城市或市镇纪念守护圣人、建城传统或本地共同体历史。`;
  if (/independence day/.test(text)) return `${country}的独立纪念日，通常纪念国家取得主权或脱离殖民统治的历史时刻，常伴随旗帜、仪式和公共庆祝。`;
  if (/national day/.test(text)) return `${country}的国家纪念日，通常用来纪念国家成立、宪法传统或重要历史节点，常有官方仪式和公共庆典。`;
  if (/republic day/.test(text)) return `${country}的共和国纪念日，通常纪念共和国体制确立或重要宪政转折，是国家身份的一部分。`;
  if (/constitution day/.test(text)) return `${country}的宪法纪念日，纪念宪法秩序或现代国家制度的重要节点。`;
  if (/foundation day/.test(text)) return `${country}的建国或奠基纪念日，通常回望国家、城市或共同体形成的历史。`;
  if (/labou?r day|workers'? day|may day/.test(text)) return "劳动节纪念劳动者权益与劳动生活，许多地方会在这一天休假，也可能举行游行、集会或公共活动。";
  if (/thanksgiving/.test(text)) return "感恩节以感谢、收获和团聚为核心，常见习俗包括家庭餐桌、秋日食物和与亲友共度假日。";
  if (/remembrance|memorial/.test(text)) return "这是带有追思性质的纪念日，常用静默、花束、仪式或公共纪念来记住历史与逝去的人。";
  if (/all saints/.test(text)) return "诸圣节源自基督教传统，用来纪念圣徒，也常与献花、点烛和追思逝者联系在一起。";
  if (/bank holiday/.test(text)) return `${country}的银行假日通常是公共休息日，人们会利用这一天旅行、聚会或处理家庭与社区活动。`;
  if (/^day of /i.test(title)) {
    const place = title.replace(/^Day of /i, "");
    return `${place}日通常纪念地方身份、自治传统或区域历史，是当地公共生活与社区记忆的一部分。`;
  }
  if (localName) return `${country}以「${localName}」为名标记这一天，名称本身往往保留了地方语言、宗教传统或社区记忆。`;
  if (fallback && !/的.+节日/.test(fallback)) return fallback;
  return genericHolidayIntroduction(title, source, country);
}

function saintDayIntroduction(title, country) {
  const saint = title.replace(/^(st\.?|saint|sankt|san|santa|santo)\s+/i, "").trim();
  if (saint) return `${title}多与基督教圣人纪念和地方守护传统有关，在${country}可能以礼拜、集市、游行或社区聚会延续。`;
  return `${country}的圣人纪念日多与地方守护传统有关，常见形式包括礼拜、游行、集市和社区聚会。`;
}

function genericHolidayIntroduction(title, source, country) {
  const typeLabel = holidayTypeLabelFromSource(source);
  if (source?.nationwide === false) return `${title}是${country}的地方性${typeLabel}，多半与特定城市、地区守护传统或地方历史记忆有关。`;
  if (/公众节日|银行假日|Public|Bank/.test((source?.typeLabels || []).join(" "))) return `${title}是${country}的${typeLabel}，这一天会进入公共日历，常伴随休息、仪式或地方社区活动。`;
  return `${title}在${country}日历中标记一段地方记忆、宗教传统或公共生活节点。`;
}

function holidayIntroFor(title, source = {}) {
  const content = holidayContentFor(title, source);
  if (content?.description) return content.description;

  const intros = globalThis.YearCalendarHolidayIntros || {};
  const keys = holidayLookupKeys(title, source);

  for (const key of keys) {
    const intro = intros[key] || introByNormalizedKey(intros, key);
    if (intro) return intro;
  }
  return "";
}

function holidayContentFor(title, source = {}) {
  const content = globalThis.YearCalendarHolidayContent;
  const entries = Array.isArray(content?.entries) ? content.entries : [];
  if (!entries.length) return null;

  const keys = holidayLookupKeys(title, source);
  const countryScopedKeys = keys.filter(isCountryScopedHolidayKey);
  const countryLookup = new Set(countryScopedKeys.map(normalizeIntroKey));
  const countryMatch = entries.find((entry) => holidayContentKeys(entry).some((key) => countryLookup.has(normalizeIntroKey(key))));
  if (countryMatch) return countryMatch;

  const genericLookup = new Set(keys.filter((key) => !isCountryScopedHolidayKey(key)).map(normalizeIntroKey));
  return entries.find((entry) => {
    const entryKeys = holidayContentKeys(entry);
    if (entryKeys.some(isCountryScopedHolidayKey)) return false;
    return entryKeys.some((key) => genericLookup.has(normalizeIntroKey(key)));
  }) || null;
}

function holidayContentKeys(entry) {
  return Array.isArray(entry.keys) ? entry.keys.filter(Boolean) : [];
}

function holidayLookupKeys(title, source = {}) {
  return [
    source?.countryCode ? `${source.countryCode}|${title}` : "",
    source?.countryCode && source?.localName ? `${source.countryCode}|${source.localName}` : "",
    title,
    source?.localName || ""
  ].filter(Boolean);
}

function isCountryScopedHolidayKey(key) {
  return /^[A-Z]{2}\|/.test(key);
}

function introByNormalizedKey(intros, key) {
  const normalizedKey = normalizeIntroKey(key);
  const match = Object.entries(intros).find(([introKey]) => normalizeIntroKey(introKey) === normalizedKey);
  return match?.[1] || "";
}

function normalizeIntroKey(value) {
  return value.toLowerCase().replace(/[’']/g, "").replace(/\s+/g, " ").trim();
}

function countryNameZh(source = {}) {
  if (source.zhName) return source.zhName;
  if (COUNTRY_NAMES_ZH[source.countryCode]) return COUNTRY_NAMES_ZH[source.countryCode];
  try {
    const regionName = source.countryCode ? REGION_NAMES_ZH?.of(source.countryCode) : "";
    if (regionName && regionName !== source.countryCode) return regionName;
  } catch {
    // Some upstream country codes are not valid ISO regions.
  }
  return "当地";
}

function holidayTypeLabelFromSource(source) {
  if (Array.isArray(source?.typeLabels) && source.typeLabels[0]) return source.typeLabels[0];
  return primaryHolidayTypeLabel(source?.types);
}

function primaryHolidayTypeLabel(types = []) {
  const type = Array.isArray(types) ? types.find((value) => HOLIDAY_TYPE_LABELS[value]) : null;
  return type ? HOLIDAY_TYPE_LABELS[type] : "节日";
}

globalThis.ThemeEngineInternals = {
  MOTIF_TAGS,
  MONTH_MOTIF_ROTATION,
  FIXED_HOLIDAYS,
  FLOATING_RULES,
  applyPaletteAtmosphere,
  cachedHolidayThemes,
  createTheme,
  fallbackThemes,
  monthDay,
  seedForDate,
  seededJitter,
  themeVariant
};
