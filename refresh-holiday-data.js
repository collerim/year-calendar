process.env.TZ = "Asia/Shanghai";

import fs from "fs";
import path from "path";
import { createHolidayCacheBuilder } from "./holiday-cache-builder.js";
import { RENDER_LOOKAHEAD_DAYS } from "./render-window.js";

const OUTPUT_FILE = path.join("data", "holiday-cache.js");
const API_ROOT = "https://date.nager.at/api/v3";
const OPEN_HOLIDAYS_API_ROOT = "https://openholidaysapi.org";
const LOOKAHEAD_DAYS = 90;
const MAX_CANDIDATES_PER_DAY = 8;
const DEFAULT_COUNTRY_AFFINITY = 3;
const NAGER_FETCH_CONCURRENCY = 8;
const OPEN_HOLIDAYS_FETCH_CONCURRENCY = 6;
const MIN_CACHE_DAYS_FOR_RENDER = 14;
const FETCH_TIMEOUT_MS = 15000;
const FETCH_RETRIES = 3;
const FETCH_BACKOFF_MS = 700;
const ERROR_SAMPLE_LIMIT = 12;

await import("./data/holiday-content.js");
await import("./data/holiday-intros.js");
await import("./theme-ranking-rules.js");
const HOLIDAY_CONTENT = globalThis.YearCalendarHolidayContent || {};
const HOLIDAY_INTROS = globalThis.YearCalendarHolidayIntros || {};
const RANKING_RULES = globalThis.ThemeRankingRules;

const FEATURED_COUNTRY_PROFILE = [
  ["CN", "China", "中国", 42],
  ["US", "United States", "美国", 34],
  ["JP", "Japan", "日本", 26],
  ["SG", "Singapore", "新加坡", 22],
  ["FR", "France", "法国", 18],
  ["GB", "United Kingdom", "英国", 16],
  ["CA", "Canada", "加拿大", 15],
  ["AU", "Australia", "澳大利亚", 15],
  ["DE", "Germany", "德国", 14],
  ["IT", "Italy", "意大利", 12],
  ["ES", "Spain", "西班牙", 12],
  ["KR", "South Korea", "韩国", 12],
  ["TH", "Thailand", "泰国", 12],
  ["CH", "Switzerland", "瑞士", 10],
  ["NO", "Norway", "挪威", 10],
  ["MX", "Mexico", "墨西哥", 10],
  ["BR", "Brazil", "巴西", 8],
  ["IN", "India", "印度", 8],
  ["ZA", "South Africa", "南非", 8],
  ["NZ", "New Zealand", "新西兰", 8]
];

const FEATURED_COUNTRY_BY_CODE = new Map(
  FEATURED_COUNTRY_PROFILE.map(([code, name, zhName, affinity]) => [code, { code, name, zhName, affinity }])
);

const MOTIF_TAGS = {
  grain: ["botanical", "harvest"],
  waterFlowers: ["water", "botanical"],
  marigold: ["botanical", "memorial", "celebration"],
  clover: ["botanical", "luck"],
  mountainFlags: ["mountain", "civic", "celebration"],
  tanabata: ["sky", "wish", "light"],
  tricolor: ["civic", "celebration"],
  pumpkin: ["night", "autumn", "playful"],
  snow: ["winter", "sky", "light"],
  springBuds: ["botanical", "spring"],
  sunRibbons: ["sun", "celebration"],
  fireworks: ["sky", "celebration", "light"],
  petals: ["botanical", "memorial"],
  candle: ["memorial", "light", "winter"],
  streamers: ["civic", "celebration"],
  starfield: ["sky", "light"],
  aurora: ["sky", "mountain", "light"],
  lanterns: ["light", "celebration", "culture"],
  paperKites: ["sky", "celebration", "wind"],
  wovenPattern: ["culture", "civic"],
  moonOrbit: ["sky", "light", "seasonal"],
  rainGarden: ["water", "botanical", "seasonal"],
  harvestSheaves: ["botanical", "harvest", "seasonal"],
  paperCut: ["civic", "celebration", "culture"],
  teaSteam: ["culture", "light", "winter"],
  dragonDance: ["celebration", "culture", "procession", "folk"],
  crescentLantern: ["islamic", "religious", "light", "sky"],
  lotusMandala: ["religious", "botanical", "culture", "heritage"],
  templeBells: ["religious", "heritage", "light"],
  carnivalMasks: ["celebration", "procession", "folk", "market"],
  folkEmbroidery: ["folk", "heritage", "culture"],
  cityParade: ["civic", "celebration", "procession"],
  maritimeFlags: ["maritime", "water", "civic", "island"],
  desertGeometry: ["islamic", "heritage", "sun"],
  tropicalBloom: ["island", "botanical", "water"],
  oliveBranches: ["heritage", "botanical", "civic"],
  laurelTorch: ["civic", "remembrance", "light"],
  sportsMedals: ["sports", "celebration", "civic"],
  bookPress: ["literature", "culture", "heritage"],
  marketBanners: ["market", "celebration", "folk"],
  ancestralTable: ["remembrance", "religious", "light"],
  doveGarland: ["remembrance", "light", "civic"],
  stainedGlass: ["religious", "heritage", "light"],
  musicWaves: ["music", "culture", "celebration"],
  cosmicObservatory: ["science", "sky", "light"],
  gardenGate: ["botanical", "heritage", "seasonal"],
  oceanCompass: ["maritime", "water", "travel"]
};

const MOTIF_STYLES = {
  fireworks: [["#101a34", "#4a2734", "#111316"], "#6aa7ff", "#e85a63"],
  petals: [["#241525", "#643044", "#111214"], "#e87a94", "#d7b56b"],
  clover: [["#0d2a20", "#184936", "#111516"], "#72c46b", "#d7bc58"],
  waterFlowers: [["#0d2836", "#1d5a64", "#101518"], "#70d6d0", "#f2b8c6"],
  aurora: [["#102622", "#2f5c4c", "#101516"], "#77c98e", "#75bdd8"],
  tricolor: [["#181b24", "#4d2c2f", "#111315"], "#e2534f", "#d8b95b"],
  streamers: [["#102238", "#365a70", "#101418"], "#78bde6", "#e66b58"],
  sunRibbons: [["#10283a", "#345e68", "#101417"], "#6ecbe6", "#f0c95c"],
  starfield: [["#10251f", "#4b5134", "#111515"], "#77c98e", "#d8b95b"],
  tanabata: [["#0f1734", "#25265f", "#11131d"], "#9fc8ff", "#e6c86f"],
  mountainFlags: [["#151b27", "#4d2727", "#111314"], "#e65b5b", "#f0f0f2"],
  pumpkin: [["#17121f", "#4b2d13", "#111113"], "#f08a2d", "#8d65c5"],
  marigold: [["#221535", "#5e2348", "#171115"], "#f2a23a", "#cf4f73"],
  candle: [["#101827", "#37304d", "#111214"], "#f0c95c", "#f2f0d6"],
  snow: [["#101827", "#263a35", "#111314"], "#d8c070", "#86b38c"],
  grain: [["#211916", "#604026", "#111314"], "#d8a05f", "#9bb06d"],
  springBuds: [["#18251f", "#5b6040", "#111516"], "#a9d37f", "#e6b6c8"],
  lanterns: [["#171427", "#523143", "#111214"], "#f0c95c", "#e85a63"],
  paperKites: [["#102238", "#365a70", "#101418"], "#78bde6", "#e6b66b"],
  wovenPattern: [["#171822", "#4d3d32", "#111314"], "#d8b95b", "#78bde8"],
  moonOrbit: [["#101729", "#2f3158", "#111316"], "#d8c070", "#9fc8ff"],
  rainGarden: [["#122735", "#346158", "#101518"], "#87c9b7", "#c8d58f"],
  harvestSheaves: [["#211916", "#604026", "#111314"], "#d8a05f", "#9bb06d"],
  paperCut: [["#25080c", "#7a1e26", "#12090a"], "#f6c85f", "#e83b36"],
  teaSteam: [["#101827", "#37304d", "#111214"], "#f0c95c", "#f2f0d6"],
  dragonDance: [["#25080c", "#7a1e26", "#12090a"], "#f6c85f", "#e83b36"],
  crescentLantern: [["#101729", "#27345f", "#111316"], "#d8c070", "#78bde8"],
  lotusMandala: [["#171427", "#4c3652", "#111214"], "#d6b6e8", "#87c9b7"],
  templeBells: [["#171822", "#4d3d32", "#111314"], "#d8b95b", "#78bde8"],
  carnivalMasks: [["#18142a", "#5a2f4c", "#111315"], "#e87a94", "#78bde8"],
  folkEmbroidery: [["#171822", "#4d2f32", "#111314"], "#d8b95b", "#e65b5b"],
  cityParade: [["#101d34", "#4a2432", "#111316"], "#78aee8", "#e85a63"],
  maritimeFlags: [["#0c2635", "#255d70", "#101417"], "#76cce8", "#f0c95c"],
  desertGeometry: [["#211916", "#604026", "#111314"], "#d8a05f", "#78bde8"],
  tropicalBloom: [["#102622", "#465c2d", "#101516"], "#77c98e", "#f0a24a"],
  oliveBranches: [["#10251f", "#465c2d", "#111515"], "#9bb06d", "#d8b95b"],
  laurelTorch: [["#151515", "#55302d", "#111111"], "#d8b95b", "#d65345"],
  sportsMedals: [["#101d34", "#365a70", "#101418"], "#d8b95b", "#78bde8"],
  bookPress: [["#171822", "#4d3d32", "#111314"], "#d8b95b", "#f2f0d6"],
  marketBanners: [["#211619", "#63362a", "#111314"], "#f0c95c", "#78bde8"],
  ancestralTable: [["#101827", "#37304d", "#111214"], "#f0c95c", "#d65345"],
  doveGarland: [["#101827", "#2e3d51", "#101316"], "#f2f0d6", "#d8c070"],
  stainedGlass: [["#101a34", "#4a2734", "#111316"], "#9fc8ff", "#e87a94"],
  musicWaves: [["#15172a", "#4c3158", "#111316"], "#e6c86f", "#8fc8ff"],
  cosmicObservatory: [["#0d1730", "#27365f", "#101219"], "#9fc8ff", "#d6b6e8"],
  gardenGate: [["#10251f", "#3f5d42", "#101516"], "#87c98e", "#e6b6c8"],
  oceanCompass: [["#0c2335", "#24566d", "#101417"], "#76cce8", "#e6c86f"]
};

const COUNTRY_PALETTES = {
  CN: [["#25080c", "#8f171c", "#12090a"], "#f6c85f", "#e83b36"],
  US: [["#101a34", "#4a2432", "#111316"], "#6aa7ff", "#e85a63"],
  JP: [["#171318", "#4b1f2a", "#111214"], "#f2eee6", "#d94a4d"],
  SG: [["#151821", "#5b2530", "#111315"], "#e85a63", "#f3f3f5"],
  FR: [["#101d3f", "#342742", "#4c2734"], "#6aa7ff", "#e85a63"],
  GB: [["#111b32", "#482538", "#111316"], "#7faee8", "#e65b5b"],
  CA: [["#17161c", "#5d2630", "#111214"], "#e85a63", "#f3f3f5"],
  AU: [["#101d34", "#263a54", "#111316"], "#78aee8", "#d8b95b"],
  DE: [["#151515", "#55302d", "#111111"], "#d8b95b", "#d65345"],
  IT: [["#10251f", "#4f2c31", "#111515"], "#70bf75", "#e65b5b"],
  ES: [["#211619", "#63362a", "#111314"], "#d8b95b", "#e65b5b"],
  KR: [["#11192d", "#3d2f4b", "#111316"], "#f3f3f5", "#d8555b"],
  TH: [["#111b34", "#4d2844", "#111316"], "#7fbbe8", "#e65b5b"],
  CH: [["#151b27", "#4d2727", "#111314"], "#e65b5b", "#f0f0f2"],
  NO: [["#101d34", "#4f2d38", "#101316"], "#6da2cf", "#e65b5b"],
  MX: [["#10251f", "#4f2c31", "#111515"], "#70bf75", "#e85a63"],
  BR: [["#102622", "#465c2d", "#101516"], "#77c98e", "#d8c070"],
  IN: [["#18251f", "#604026", "#111515"], "#f0a24a", "#70bf75"],
  ZA: [["#10251f", "#1f415a", "#111515"], "#77c98e", "#d8b95b"],
  NZ: [["#101d34", "#293f5d", "#101316"], "#78aee8", "#e85a63"]
};

const OCCASION_PALETTES = [
  [/christmas/i, [["#101827", "#2d4436", "#111314"], "#d8c070", "#d65345"]],
  [/halloween/i, [["#17121f", "#4b2d13", "#111113"], "#f08a2d", "#8d65c5"]],
  [/valentine/i, [["#241525", "#643044", "#111214"], "#e87a94", "#d7b56b"]],
  [/new year's day|new year's eve/i, [["#151a2d", "#493456", "#111316"], "#d6c070", "#78b8e6"]],
  [/thanksgiving|harvest/i, [["#211916", "#604026", "#111314"], "#d8a05f", "#9bb06d"]]
];

const CULTURAL_OBSERVANCES = [
  ["01-04", "World Braille Day", "世界盲文日", "联合国纪念日，关注盲文、无障碍阅读和信息平等。", "starfield", ["#101827", "#2e3d51", "#101316"], "#d8c070", "#78bde8", 66, ["culture", "international", "light"]],
  ["01-24", "International Day of Education", "国际教育日", "联合国设立的国际日，关注学习、知识与人的发展。", "starfield", ["#111d34", "#263e5b", "#101316"], "#78bde8", "#d8c070", 66, ["culture", "international", "light"]],
  ["01-27", "International Holocaust Remembrance Day", "国际大屠杀纪念日", "联合国纪念日，追思大屠杀受害者，并提醒人们警惕仇恨与暴力。", "candle", ["#101827", "#37304d", "#111214"], "#f0c95c", "#f2f0d6", 76, ["culture", "international", "memorial", "light"]],
  ["01-28", "Data Privacy Day", "数据隐私日", "关注个人数据、数字权利和网络生活边界的国际倡议日。", "wovenPattern", ["#101b33", "#2e4770", "#101316"], "#9fc8ff", "#e6c86f", 62, ["culture", "international", "civic"]],
  ["02-02", "World Wetlands Day", "世界湿地日", "纪念湿地生态、候鸟栖息地与水陆之间的生命系统。", "waterFlowers", ["#0d2836", "#1d5a64", "#101518"], "#70d6d0", "#8bd0b6", 70, ["culture", "international", "water", "botanical"]],
  ["02-11", "Women and Girls in Science Day", "妇女和女童参与科学国际日", "国际日，鼓励更多女性进入科学与探索的领域。", "cosmicObservatory", ["#17182d", "#3d2f59", "#111316"], "#b68fd8", "#78bde8", 68, ["culture", "international", "science", "sky"]],
  ["02-13", "World Radio Day", "世界广播日", "联合国教科文组织纪念日，关注声音媒介、公共传播和跨地域连接。", "musicWaves", ["#111729", "#493456", "#111316"], "#d6c070", "#8fc8ff", 66, ["culture", "international", "music", "light"]],
  ["02-21", "International Mother Language Day", "国际母语日", "联合国教科文组织倡议的日子，纪念语言多样性与文化传承。", "streamers", ["#151d2d", "#3f3a58", "#111316"], "#d8b95b", "#78bde8", 72, ["culture", "international", "celebration"]],
  ["03-03", "World Wildlife Day", "世界野生动植物日", "联合国纪念日，关注野生动植物、多样生态和人与自然的关系。", "springBuds", ["#14251d", "#496143", "#111516"], "#8fcb7d", "#d8c070", 70, ["culture", "international", "botanical"]],
  ["03-08", "International Women's Day", "国际妇女节", "纪念女性权益与创造力的国际节日。", "petals", ["#241525", "#643044", "#111214"], "#e87a94", "#d7b56b", 74, ["culture", "international", "celebration", "botanical"]],
  ["03-14", "Pi Day", "圆周率日", "以 3.14 纪念数学、好奇心和理性之美的轻量文化日。", "moonOrbit", ["#101729", "#2f3158", "#111316"], "#d8c070", "#9fc8ff", 62, ["culture", "international", "light"]],
  ["03-20", "International Day of Happiness", "国际幸福日", "联合国设立的国际日，提醒人们珍视幸福与共同生活。", "sunRibbons", ["#201d25", "#5e4a2a", "#111314"], "#f0c95c", "#e87a94", 66, ["culture", "international", "sun", "celebration"]],
  ["03-21", "World Poetry Day", "世界诗歌日", "联合国教科文组织设立的文化日，纪念诗歌、语言与想象力。", "petals", ["#17182d", "#473254", "#111316"], "#d6b6e8", "#d8c070", 70, ["culture", "international", "botanical"]],
  ["03-22", "World Water Day", "世界水日", "联合国设立的国际日，关注水资源与蓝色星球。", "waterFlowers", ["#0c2134", "#225a6a", "#101418"], "#70cce8", "#8bd0b6", 72, ["culture", "international", "water"]],
  ["03-23", "World Meteorological Day", "世界气象日", "纪念天气、气候观测和人类理解大气变化的科学工作。", "aurora", ["#102238", "#365a70", "#101418"], "#78bde6", "#e6b66b", 66, ["culture", "international", "sky"]],
  ["04-07", "World Health Day", "世界卫生日", "世界卫生组织纪念日，关注健康、公平和公共卫生系统。", "springBuds", ["#18251f", "#5b6040", "#111516"], "#a9d37f", "#e6b6c8", 70, ["culture", "international", "botanical"]],
  ["04-15", "World Art Day", "世界艺术日", "纪念艺术、创作与视觉文化的世界性日子。", "streamers", ["#19172d", "#5a344d", "#111316"], "#e87a94", "#78bde8", 72, ["culture", "international", "celebration"]],
  ["04-18", "World Heritage Day", "世界遗产日", "关注文化遗产、古迹保护和人类共同记忆的国际文化日。", "mountainFlags", ["#171822", "#4d3d32", "#111314"], "#d8b95b", "#78bde8", 70, ["culture", "international", "civic"]],
  ["04-22", "Earth Day", "世界地球日", "关注环境保护与生态共生的全球纪念日。", "gardenGate", ["#102622", "#2f5c4c", "#101516"], "#77c98e", "#75bdd8", 76, ["culture", "international", "botanical", "water"]],
  ["04-23", "World Book Day", "世界读书日", "联合国教科文组织设立的文化日，纪念阅读、书籍与出版。", "starfield", ["#171827", "#3c3350", "#111316"], "#d8c070", "#b68fd8", 70, ["culture", "international", "light"]],
  ["04-29", "International Dance Day", "国际舞蹈日", "纪念舞蹈、身体表达和跨文化表演传统的国际艺术日。", "streamers", ["#19172d", "#5a344d", "#111316"], "#e87a94", "#78bde8", 70, ["culture", "international", "celebration"]],
  ["04-30", "International Jazz Day", "国际爵士乐日", "联合国教科文组织设立的音乐日，纪念即兴、节奏与城市夜色。", "starfield", ["#111729", "#493456", "#111316"], "#d6c070", "#8fc8ff", 74, ["culture", "international", "sky", "celebration"]],
  ["05-03", "World Press Freedom Day", "世界新闻自由日", "联合国纪念日，关注新闻自由、公共信息和表达权利。", "paperKites", ["#102238", "#365a70", "#101418"], "#78bde6", "#e6b66b", 70, ["culture", "international", "civic"]],
  ["05-08", "World Red Cross and Red Crescent Day", "世界红十字与红新月日", "纪念人道救援、志愿服务和跨国互助传统。", "candle", ["#101827", "#37304d", "#111214"], "#f0c95c", "#e85a63", 70, ["culture", "international", "light", "memorial"]],
  ["05-15", "International Day of Families", "国际家庭日", "联合国设立的国际日，关注家庭、照护关系和日常生活中的支持网络。", "lanterns", ["#171427", "#523143", "#111214"], "#f0c95c", "#e85a63", 66, ["culture", "international", "light"]],
  ["05-18", "International Museum Day", "国际博物馆日", "纪念博物馆、收藏与公共文化记忆。", "mountainFlags", ["#171822", "#4d3d32", "#111314"], "#d8b95b", "#78bde8", 70, ["culture", "international", "civic"]],
  ["05-20", "World Bee Day", "世界蜜蜂日", "联合国纪念日，关注授粉、农业生态和小型生命对食物系统的影响。", "springBuds", ["#18251f", "#604026", "#111515"], "#f0a24a", "#70bf75", 70, ["culture", "international", "botanical", "harvest"]],
  ["05-21", "International Tea Day", "国际茶日", "联合国设立的国际日，纪念茶、农耕与日常仪式感。", "springBuds", ["#14251d", "#496143", "#111516"], "#8fcb7d", "#d8c070", 72, ["culture", "international", "botanical", "harvest"]],
  ["05-22", "International Day for Biological Diversity", "国际生物多样性日", "联合国纪念日，关注生态系统、多样物种与共同栖居的地球。", "aurora", ["#102622", "#465c2d", "#101516"], "#77c98e", "#d8c070", 72, ["culture", "international", "botanical", "water"]],
  ["06-01", "Global Day of Parents", "全球父母节", "联合国设立的国际日，感谢父母和照护者在家庭生活中的支持与陪伴。", "lanterns", ["#171427", "#523143", "#111214"], "#f0c95c", "#e85a63", 64, ["culture", "international", "light"]],
  ["06-03", "World Bicycle Day", "世界自行车日", "联合国纪念日，关注低碳出行、城市道路和日常移动自由。", "paperKites", ["#102238", "#365a70", "#101418"], "#78bde6", "#e6b66b", 66, ["culture", "international", "wind"]],
  ["06-05", "World Environment Day", "世界环境日", "联合国环境日，关注生态、城市与地球未来。", "gardenGate", ["#102622", "#2f5c4c", "#101516"], "#77c98e", "#75bdd8", 74, ["culture", "international", "botanical", "water"]],
  ["06-07", "World Food Safety Day", "世界食品安全日", "联合国纪念日，关注食物生产、餐桌安全和公共健康。", "grain", ["#211916", "#604026", "#111314"], "#d8a05f", "#9bb06d", 66, ["culture", "international", "harvest"]],
  ["06-08", "World Oceans Day", "世界海洋日", "关注海洋、潮汐与蓝色星球的国际日。", "oceanCompass", ["#0c2134", "#225a6a", "#101418"], "#70cce8", "#8bd0b6", 76, ["culture", "international", "water", "island", "maritime"]],
  ["06-20", "World Refugee Day", "世界难民日", "联合国纪念日，关注被迫迁徙者的处境、尊严和重建生活的力量。", "mountainFlags", ["#111d34", "#263e5b", "#101316"], "#78bde8", "#d8c070", 72, ["culture", "international", "mountain", "civic"]],
  ["06-21", "World Music Day", "世界音乐日", "纪念音乐、节奏与公共空间中的街头庆祝。", "musicWaves", ["#1c2332", "#6c522e", "#111316"], "#f0c95c", "#79b7d8", 74, ["culture", "international", "celebration", "music"]],
  ["06-30", "Asteroid Day", "小行星日", "国际科普日，关注小行星、空间观测和行星防御意识。", "starfield", ["#101729", "#2f3158", "#111316"], "#d8c070", "#9fc8ff", 66, ["culture", "international", "sky", "light"]],
  ["07-11", "World Population Day", "世界人口日", "联合国纪念日，关注人口变化、城市生活、家庭与公共政策。", "wovenPattern", ["#171822", "#4d3d32", "#111314"], "#d8b95b", "#78bde8", 64, ["culture", "international", "civic"]],
  ["07-17", "World Emoji Day", "世界表情符号日", "轻量数字文化日，纪念表情符号如何改变日常表达和网络交流。", "streamers", ["#141d2f", "#493456", "#111316"], "#d6c070", "#78b8e6", 62, ["culture", "international", "celebration"]],
  ["07-20", "International Chess Day", "国际象棋日", "纪念棋类、策略思考和跨文化智力游戏传统的国际日。", "wovenPattern", ["#171822", "#4d3d32", "#111314"], "#d8b95b", "#78bde8", 64, ["culture", "international", "civic"]],
  ["07-28", "World Nature Conservation Day", "世界自然保护日", "关注自然保护、土地与水域生态，以及人与环境的长期关系。", "gardenGate", ["#102622", "#2f5c4c", "#101516"], "#77c98e", "#75bdd8", 68, ["culture", "international", "botanical", "water"]],
  ["07-30", "International Day of Friendship", "国际友谊日", "联合国设立的国际日，纪念友谊、理解与相互照亮。", "streamers", ["#141d2f", "#493456", "#111316"], "#d6c070", "#78b8e6", 68, ["culture", "international", "celebration", "light"]],
  ["08-09", "Indigenous Peoples Day", "世界土著人民国际日", "联合国设立的国际日，关注原住民文化、土地与传统。", "mountainFlags", ["#1a2019", "#5a5634", "#111515"], "#d8b95b", "#91c47c", 70, ["culture", "international", "mountain", "botanical"]],
  ["08-12", "International Youth Day", "国际青年日", "联合国设立的国际日，关注年轻人的创造力与公共参与。", "streamers", ["#102238", "#365a70", "#101418"], "#78bde6", "#e66b58", 68, ["culture", "international", "celebration"]],
  ["08-19", "World Photography Day", "世界摄影日", "纪念影像、光线与观看方式的文化日。", "starfield", ["#111827", "#2e3d51", "#101316"], "#d8c070", "#78bde8", 68, ["culture", "international", "light"]],
  ["08-29", "World Video Game Day", "世界电子游戏日", "轻量文化日，纪念电子游戏、互动叙事和数字娱乐中的创造力。", "starfield", ["#0f1734", "#25265f", "#11131d"], "#9fc8ff", "#e6c86f", 62, ["culture", "international", "sky", "light"]],
  ["09-08", "International Literacy Day", "国际扫盲日", "联合国教科文组织纪念日，关注阅读能力、教育公平和人的发展。", "starfield", ["#171827", "#3c3350", "#111316"], "#d8c070", "#b68fd8", 70, ["culture", "international", "light"]],
  ["09-15", "International Day of Democracy", "国际民主日", "联合国纪念日，关注公共参与、制度信任和公民生活。", "tricolor", ["#101d34", "#263a54", "#111316"], "#78aee8", "#f3f3f5", 68, ["culture", "international", "civic"]],
  ["09-21", "International Day of Peace", "国际和平日", "联合国设立的国际日，纪念和平、停火与共同生活。", "candle", ["#101827", "#37304d", "#111214"], "#f0c95c", "#f2f0d6", 76, ["culture", "international", "light", "memorial"]],
  ["09-27", "World Tourism Day", "世界旅游日", "关注旅行、地方文化与人与地点之间的连接。", "mountainFlags", ["#102039", "#5c4227", "#101417"], "#6da2cf", "#f0b64d", 66, ["culture", "international", "mountain", "celebration"]],
  ["09-29", "World Heart Day", "世界心脏日", "全球健康倡议日，关注心血管健康、运动和日常生活习惯。", "petals", ["#241525", "#643044", "#111214"], "#e87a94", "#d7b56b", 66, ["culture", "international", "botanical"]],
  ["10-01", "International Coffee Day", "国际咖啡日", "纪念咖啡、手作与城市日常节奏的国际文化日。", "grain", ["#1b1513", "#563321", "#111314"], "#d8a05f", "#9bb06d", 64, ["culture", "international", "harvest"]],
  ["10-04", "World Space Week", "世界空间周", "纪念空间探索、卫星科技和人类望向宇宙的想象力。", "cosmicObservatory", ["#101729", "#2f3158", "#111316"], "#d8c070", "#9fc8ff", 70, ["culture", "international", "science", "sky", "light"]],
  ["10-05", "World Teachers' Day", "世界教师日", "联合国教科文组织设立的国际日，感谢教育者与知识传递。", "starfield", ["#171827", "#3c3350", "#111316"], "#d8c070", "#b68fd8", 68, ["culture", "international", "light"]],
  ["10-10", "World Mental Health Day", "世界精神卫生日", "关注心理健康、照护网络和更温柔的公共讨论。", "candle", ["#101827", "#37304d", "#111214"], "#f0c95c", "#f2f0d6", 70, ["culture", "international", "light"]],
  ["10-16", "World Food Day", "世界粮食日", "联合国粮农组织纪念日，关注食物、土地与人类生活。", "grain", ["#211916", "#604026", "#111314"], "#d8a05f", "#9bb06d", 70, ["culture", "international", "harvest", "botanical"]],
  ["10-24", "United Nations Day", "联合国日", "纪念联合国宪章生效的国际日，象征合作、和平与公共秩序。", "tricolor", ["#101d34", "#263a54", "#111316"], "#78aee8", "#f3f3f5", 72, ["culture", "international", "civic"]],
  ["11-10", "World Science Day for Peace and Development", "世界科学促进和平与发展日", "联合国教科文组织纪念日，关注科学、公共利益和社会发展。", "cosmicObservatory", ["#17182d", "#3d2f59", "#111316"], "#b68fd8", "#78bde8", 68, ["culture", "international", "science", "sky"]],
  ["11-13", "World Kindness Day", "世界友善日", "纪念善意、照顾与人与人之间温柔连接的文化日。", "petals", ["#241525", "#643044", "#111214"], "#e87a94", "#d7b56b", 66, ["culture", "international", "botanical", "light"]],
  ["11-16", "International Day for Tolerance", "国际宽容日", "联合国教科文组织设立的国际日，纪念理解、差异与共处。", "candle", ["#101827", "#37304d", "#111214"], "#f0c95c", "#f2f0d6", 68, ["culture", "international", "light"]],
  ["11-19", "International Men's Day", "国际男性日", "民间倡议的国际日，关注男性健康、家庭角色和性别议题中的互相理解。", "wovenPattern", ["#171822", "#4d3d32", "#111314"], "#d8b95b", "#78bde8", 62, ["culture", "international", "civic"]],
  ["11-21", "World Television Day", "世界电视日", "联合国设立的国际日，纪念影像媒介与公共叙事。", "starfield", ["#101b33", "#2e4770", "#101316"], "#9fc8ff", "#e6c86f", 62, ["culture", "international", "sky", "light"]],
  ["12-03", "International Day of Persons with Disabilities", "国际残疾人日", "联合国纪念日，关注无障碍环境、平等参与和多样身体经验。", "paperKites", ["#102238", "#365a70", "#101418"], "#78bde6", "#e6b66b", 70, ["culture", "international", "civic"]],
  ["12-05", "International Volunteer Day", "国际志愿者日", "联合国纪念日，感谢志愿服务、社区互助和日常善意。", "lanterns", ["#171427", "#523143", "#111214"], "#f0c95c", "#e85a63", 68, ["culture", "international", "light"]],
  ["12-10", "Human Rights Day", "人权日", "联合国纪念日，关注人的尊严、自由与平等。", "candle", ["#101827", "#37304d", "#111214"], "#f0c95c", "#f2f0d6", 74, ["culture", "international", "civic", "light"]],
  ["12-11", "International Mountain Day", "国际山岳日", "联合国纪念日，关注山地生态、地方社区和高处风景中的生活。", "mountainFlags", ["#151b27", "#4d2727", "#111314"], "#e65b5b", "#f0f0f2", 68, ["culture", "international", "mountain"]],
  ["12-18", "International Migrants Day", "国际移民日", "联合国设立的国际日，关注迁徙、家园与跨文化生活。", "mountainFlags", ["#111d34", "#263e5b", "#101316"], "#78bde8", "#d8c070", 66, ["culture", "international", "mountain"]]
].map(([monthDay, title, localName, description, motif, gradient, accent, secondary, priority, tags]) => ({
  monthDay,
  title,
  localName,
  description,
  motif,
  gradient,
  accent,
  secondary,
  priority,
  tags
}));

function parseArgs(argv) {
  const options = {
    date: null,
    days: LOOKAHEAD_DAYS,
    ifNeeded: argv.includes("--if-needed"),
    strictProviders: argv.includes("--strict-providers"),
    minDays: MIN_CACHE_DAYS_FOR_RENDER,
    output: OUTPUT_FILE
  };

  const dateIndex = argv.indexOf("--date");
  if (dateIndex !== -1) options.date = argv[dateIndex + 1];

  const daysIndex = argv.indexOf("--days");
  if (daysIndex !== -1) options.days = Number(argv[daysIndex + 1]) || LOOKAHEAD_DAYS;

  const minDaysIndex = argv.indexOf("--min-days");
  if (minDaysIndex !== -1) options.minDays = Number(argv[minDaysIndex + 1]) || MIN_CACHE_DAYS_FOR_RENDER;

  const outputIndex = argv.indexOf("--output");
  if (outputIndex !== -1) options.output = argv[outputIndex + 1] || OUTPUT_FILE;

  return options;
}

function dateFromKey(key) {
  const match = key?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function shanghaiToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function yearsInRange(startDate, endDate) {
  const years = [];
  for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
    years.push(year);
  }
  return years;
}

function inRange(date, startDate, endDate) {
  return date >= startDate && date <= endDate;
}

function readExistingHolidayCache(filePath = OUTPUT_FILE) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf8");
  const match = content.match(/window\.YearCalendarHolidayCache\s*=\s*(\{[\s\S]*\});?\s*$/);
  if (!match) return null;

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function cacheCoversRenderWindow(cache, startDate, minDays) {
  const cacheStart = dateFromKey(cache?.window?.start);
  const cacheEnd = dateFromKey(cache?.window?.end);
  if (!cacheStart || !cacheEnd) return false;

  const requiredEnd = addDays(startDate, Math.max(minDays, RENDER_LOOKAHEAD_DAYS));
  return cacheStart <= startDate && cacheEnd >= requiredEnd;
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

async function fetchTextWithRetry(url, options = {}) {
  const label = options.label || url;
  let lastError = null;

  for (let attempt = 1; attempt <= FETCH_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        headers: options.headers,
        signal: controller.signal
      });
      const body = await response.text();

      if (response.ok) return body;

      const message = `${label}: ${response.status} ${response.statusText}${body ? ` - ${body.slice(0, 180)}` : ""}`;
      lastError = new Error(message);
      if (!isRetryableStatus(response.status) || attempt === FETCH_RETRIES) break;
    } catch (error) {
      lastError = error;
      if (!isRetryableFetchError(error) || attempt === FETCH_RETRIES) {
        throw new Error(`${label}: ${error.message}`);
      }
    } finally {
      clearTimeout(timeout);
    }

    await sleep(FETCH_BACKOFF_MS * attempt);
  }

  throw lastError || new Error(`${label}: fetch failed`);
}

async function fetchJsonWithRetry(url, options = {}) {
  const body = await fetchTextWithRetry(url, options);
  if (!body.trim()) return [];
  return JSON.parse(body);
}

function isRetryableStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

function isRetryableFetchError(error) {
  return error?.name === "AbortError" || /fetch failed|network|timeout|terminated|socket/i.test(error?.message || "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPublicHolidays(year, country) {
  const url = `${API_ROOT}/PublicHolidays/${year}/${country.code}`;
  return fetchJsonWithRetry(url, { label: `Nager.Date ${country.code} ${year}` });
}

async function fetchAvailableCountries() {
  return fetchJsonWithRetry(`${API_ROOT}/AvailableCountries`, { label: "Nager.Date country list" });
}

async function countryProfile() {
  try {
    const countries = await fetchAvailableCountries();
    return countries
      .map((country) => {
        const code = country.countryCode || country.code;
        const featured = FEATURED_COUNTRY_BY_CODE.get(code);
        return {
          code,
          name: country.name || featured?.name || code,
          zhName: featured?.zhName || country.name || code,
          affinity: featured?.affinity || DEFAULT_COUNTRY_AFFINITY
        };
      })
      .filter((country) => country.code)
      .sort((a, b) => b.affinity - a.affinity || a.name.localeCompare(b.name));
  } catch (error) {
    console.warn(`Could not fetch Nager country list, using featured countries only: ${error.message}`);
    return Array.from(FEATURED_COUNTRY_BY_CODE.values());
  }
}

async function fetchOpenHolidaysCountries() {
  const url = `${OPEN_HOLIDAYS_API_ROOT}/Countries?languageIsoCode=EN`;
  return fetchJsonWithRetry(url, {
    headers: { accept: "text/json" },
    label: "OpenHolidays country list"
  });
}

async function openHolidaysCountryProfile() {
  const countries = await fetchOpenHolidaysCountries();
  return countries
    .map((country) => {
      const code = country.isoCode;
      const featured = FEATURED_COUNTRY_BY_CODE.get(code);
      return {
        code,
        name: localizedText(country.name, "EN") || featured?.name || code,
        zhName: featured?.zhName || localizedText(country.name, "EN") || code,
        affinity: featured?.affinity || DEFAULT_COUNTRY_AFFINITY
      };
    })
    .filter((country) => country.code)
    .sort((a, b) => b.affinity - a.affinity || a.name.localeCompare(b.name));
}

async function fetchOpenPublicHolidays(country, startDate, endDate) {
  const params = new URLSearchParams({
    countryIsoCode: country.code,
    languageIsoCode: "EN",
    validFrom: dateKey(startDate),
    validTo: dateKey(endDate)
  });
  const url = `${OPEN_HOLIDAYS_API_ROOT}/PublicHolidays?${params.toString()}`;
  return fetchJsonWithRetry(url, {
    headers: { accept: "text/json" },
    label: `OpenHolidays ${country.code} ${dateKey(startDate)}..${dateKey(endDate)}`
  });
}

function localizedText(values = [], language = "EN") {
  if (!Array.isArray(values)) return "";
  return values.find((entry) => entry.language === language)?.text || values[0]?.text || "";
}

function datesForHolidayRange(startKey, endKey, minDate, maxDate) {
  const startDate = dateFromKey(startKey);
  const endDate = dateFromKey(endKey || startKey);
  if (!startDate || !endDate) return [];

  const dates = [];
  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    if (inRange(date, minDate, maxDate)) dates.push(date);
  }
  return dates;
}

function selectMotif(holiday, country) {
  const text = `${holiday.name} ${holiday.localName} ${country.name}`.toLowerCase();
  if (/dragon boat|lunar|spring festival|chinese new year|tết|tet|seollal|chuseok|duanwu|boat festival/.test(text)) return "dragonDance";
  if (/science|space|astronomy|cosmos|technology|research|pi day/.test(text)) return "cosmicObservatory";
  if (/music|radio|jazz|choir|concert|dance|theatre|theater/.test(text)) return "musicWaves";
  if (/garden|nature|environment|ecology|forest|wildlife|earth day/.test(text)) return "gardenGate";
  if (/navigation|nautical|sail|seafarer|navy|voyage|world oceans/.test(text)) return "oceanCompass";
  if (/eid|ramadan|adha|fitr|islam|hijri|muharram|mawlid/.test(text)) return /desert|oman|qatar|kuwait|saudi|emirates|uae|bahrain/.test(text) ? "desertGeometry" : "crescentLantern";
  if (/buddha|vesak|diwali|holi|guru|krishna|hindu|buddhist|lotus/.test(text)) return "lotusMandala";
  if (/saint|assumption|immaculate|corpus christi|pentecost|whit|orthodox|easter|good friday|epiphany|christian|church/.test(text)) return /church|cathedral|glass|saint|assumption|immaculate/.test(text) ? "stainedGlass" : "templeBells";
  if (/carnival|mardi gras|fiesta|festival|masquerade/.test(text)) return "carnivalMasks";
  if (/language|literature|book|education|teacher|press|poetry|trubar/.test(text)) return "bookPress";
  if (/indigenous|cultural diversity|heritage|culture|tradition|folk|autonomy|regional/.test(text)) return "folkEmbroidery";
  if (/dead|souls|ancestors|ancestral|muertos|all souls/.test(text)) return "ancestralTable";
  if (/memorial|remembrance|reconciliation|peace|human rights|martyr/.test(text)) return "doveGarland";
  if (/sea|ocean|island|marine|harbour|harbor|azores|fiji|samoa|tonga|kiribati|seychelles|maldives|barbados|cape verde/.test(text)) return /flower|bloom|tropical|flora/.test(text) ? "tropicalBloom" : "maritimeFlags";
  if (/independence|constitution|national|republic|liberation|victory|bastille|unity|foundation|statehood/.test(text)) return /victory|liberation|reconciliation|peace/.test(text) ? "laurelTorch" : "cityParade";
  if (/sport|youth|games|medal|olympic|parade/.test(text)) return "sportsMedals";
  if (/market|fair|bank holiday|summer bank|spring bank/.test(text)) return "marketBanners";
  if (/olive|democracy|freedom/.test(text)) return "oliveBranches";
  if (/christmas|boxing|new year|independence|constitution|national|republic|liberation|victory|bastille|unity|foundation/.test(text)) return "fireworks";
  if (/valentine|rose|mother|flower|buddha|vesak|all saints|memorial|remembrance/.test(text)) return "petals";
  if (/patrick/.test(text)) return "clover";
  if (/lantern/.test(text)) return "lanterns";
  if (/moon|mid-autumn/.test(text)) return "moonOrbit";
  if (/songkran|water|rain|garden/.test(text)) return "rainGarden";
  if (/sea|ocean|island|dragon boat|marine|harbour|harbor/.test(text)) return "waterFlowers";
  if (/mountain|swiss|norway|alps|himalaya|qingming|tomb/.test(text)) return "mountainFlags";
  if (/star|tanabata|eve/.test(text)) return "tanabata";
  if (/halloween/.test(text)) return "pumpkin";
  if (/dead|muertos/.test(text)) return "marigold";
  if (/lucia|candle|light/.test(text)) return "candle";
  if (/winter|snow|epiphany/.test(text)) return "snow";
  if (/labor|labour|workers|may day|flag|civic|state|federation/.test(text)) return "paperCut";
  if (/thanksgiving|harvest|autumn/.test(text)) return "harvestSheaves";
  if (/spring|easter|good friday|qingming/.test(text)) return "springBuds";
  return country.affinity >= 20 ? "sunRibbons" : "wovenPattern";
}

function visualScore(holiday) {
  const text = `${holiday.name} ${holiday.localName}`.toLowerCase();
  let score = 0;
  if (/christmas|new year|independence|national|republic|constitution|bastille|songkran|dragon boat|mid-autumn|halloween|thanksgiving|lantern/.test(text)) score += 24;
  if (/day$|festival|fest|fiesta|fete|celebration/.test(text)) score += 10;
  if (/observed|substitute|bridge|bank holiday/.test(text)) score -= 16;
  if (/good friday|easter|all saints|memorial|remembrance|tomb/.test(text)) score += 8;
  return score;
}

function inferTags(holiday, motif) {
  const text = `${holiday.name} ${holiday.localName}`.toLowerCase();
  const tags = [...(MOTIF_TAGS[motif] || [])];
  if (/public|national|independence|constitution|republic|state|civic|liberation|unity/.test(text)) tags.push("civic");
  if (/festival|christmas|new year|halloween|thanksgiving|songkran|dragon boat/.test(text)) tags.push("celebration");
  if (/water|sea|ocean|island|boat/.test(text)) tags.push("water");
  if (/moon|star|lantern|light|eve/.test(text)) tags.push("sky", "light");
  if (/spring|flower|rose|green|qingming/.test(text)) tags.push("botanical");
  if (/memorial|remembrance|tomb|all saints/.test(text)) tags.push("memorial");
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
  return Array.from(new Set(tags));
}

function priorityForHoliday(holiday, country, score) {
  const typeBoost = Array.isArray(holiday.types) && holiday.types.includes("Public") ? 2 : 0;
  const globalBoost = holiday.global ? 1 : 0;
  return Math.max(42, Math.min(94, Math.round(52 + score / 24 + typeBoost + globalBoost)));
}

function descriptionForHoliday(holiday, country) {
  const intro = holidayIntroFor(holiday.name, country, holiday.localName);
  if (intro) return intro;
  return holidayIntroduction(holiday, country);
}

function holidayIntroFor(title, country, localName = "") {
  const content = holidayContentFor(title, country, localName);
  if (content?.description) return content.description;

  const keys = holidayLookupKeys(title, country, localName);

  for (const key of keys) {
    const intro = HOLIDAY_INTROS[key] || introByNormalizedKey(key);
    if (intro) return intro;
  }
  return "";
}

function holidayContentFor(title, country, localName = "") {
  const entries = Array.isArray(HOLIDAY_CONTENT.entries) ? HOLIDAY_CONTENT.entries : [];
  if (!entries.length) return null;

  const keys = holidayLookupKeys(title, country, localName);
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

function holidayLookupKeys(title, country, localName = "") {
  return [
    `${country.code}|${title}`,
    localName ? `${country.code}|${localName}` : "",
    title,
    localName
  ].filter(Boolean);
}

function isCountryScopedHolidayKey(key) {
  return /^[A-Z]{2}\|/.test(key);
}

function introByNormalizedKey(key) {
  const normalizedKey = normalizeIntroKey(key);
  const match = Object.entries(HOLIDAY_INTROS).find(([introKey]) => normalizeIntroKey(introKey) === normalizedKey);
  return match?.[1] || "";
}

function normalizeIntroKey(value) {
  return value.toLowerCase().replace(/[’']/g, "").replace(/\s+/g, " ").trim();
}

function holidayIntroduction(holiday, country) {
  const title = holiday.name;
  const text = `${holiday.name} ${holiday.localName}`.toLowerCase();
  const localName = holiday.localName && holiday.localName !== holiday.name ? holiday.localName : "";

  if (/king'?s birthday|queen'?s birthday/.test(text)) {
    if (country.code === "AU") {
      return "这是澳大利亚庆祝英国君主生日的假日，多数地区会把它安排成六月长周末，人们常借此休息、出行或参加社区活动。";
    }
    return "这是英联邦传统中的君主生日假日，用来象征君主制与国家礼仪，也常成为当地的长周末。";
  }
  if (/new year/.test(text)) return "新年假日标志公历年份开始，人们常用倒数、烟火、聚会和休息迎接新的日历周期。";
  if (/christmas/.test(text)) return "圣诞节源自基督教传统，后来也成为许多地方的冬日团聚节日，常见象征包括灯饰、松枝、礼物和家庭餐桌。";
  if (/boxing day/.test(text)) return "节礼日延续自英联邦传统，通常在圣诞节后一天，人们会继续休假、探亲、购物或观看体育赛事。";
  if (/good friday/.test(text)) return "耶稣受难日纪念基督教传统中耶稣受难的日子，许多地方会以静默礼拜和复活节前的休假来标记。";
  if (/easter/.test(text)) return "复活节源自基督教传统，纪念复活与新生，许多地方也有彩蛋、家庭聚会和春日休假的习俗。";
  if (/independence day/.test(text)) return `${country.zhName}的独立纪念日，通常纪念国家取得主权或脱离殖民统治的历史时刻，常伴随旗帜、仪式和公共庆祝。`;
  if (/national day/.test(text)) return `${country.zhName}的国家纪念日，通常用来纪念国家成立、宪法传统或重要历史节点，常有官方仪式和公共庆典。`;
  if (/republic day/.test(text)) return `${country.zhName}的共和国纪念日，通常纪念共和国体制确立或重要宪政转折，是国家身份的一部分。`;
  if (/constitution day/.test(text)) return `${country.zhName}的宪法纪念日，纪念宪法秩序或现代国家制度的重要节点。`;
  if (/foundation day/.test(text)) return `${country.zhName}的建国或奠基纪念日，通常回望国家、城市或共同体形成的历史。`;
  if (/labou?r day|workers'? day|may day/.test(text)) return "劳动节纪念劳动者权益与劳动生活，许多地方会在这一天休假，也可能举行游行、集会或公共活动。";
  if (/thanksgiving/.test(text)) return "感恩节以感谢、收获和团聚为核心，常见习俗包括家庭餐桌、秋日食物和与亲友共度假日。";
  if (/remembrance|memorial/.test(text)) return "这是带有追思性质的纪念日，常用静默、花束、仪式或公共纪念来记住历史与逝去的人。";
  if (/all saints/.test(text)) return "诸圣节源自基督教传统，用来纪念圣徒，也常与献花、点烛和追思逝者联系在一起。";
  if (/bank holiday/.test(text)) return `${country.zhName}的银行假日通常是公共休息日，人们会利用这一天旅行、聚会或处理家庭与社区活动。`;
  if (/^day of /i.test(title)) {
    const place = title.replace(/^Day of /i, "");
    return `${place}日通常纪念地方身份、自治传统或区域历史，是当地公共生活与社区记忆的一部分。`;
  }
  if (localName) return `${country.zhName}以「${localName}」为名纪念这一天，通常与当地历史、传统或社区公共生活有关。`;
  return `${title}是${country.zhName}日历中的纪念日，通常承载当地历史、公共生活或季节性的休假安排。`;
}

function primaryHolidayTypeLabel(types = []) {
  const labels = holidayTypeLabels(types);
  return labels[0] || "节日";
}

function holidayTypeLabels(types = []) {
  const labels = {
    Public: "公众节日",
    Bank: "银行假日",
    School: "学校假日",
    Authorities: "政府机关假日",
    Optional: "可选假日",
    Observance: "纪念日"
  };
  return Array.isArray(types) ? types.map((value) => labels[value]).filter(Boolean) : [];
}

function captionForHoliday(holiday, country) {
  const phrase = holiday.localName && holiday.localName !== holiday.name ? holiday.localName : country.name;
  return `${holiday.name} · ${phrase}`;
}

function themeForHoliday(holiday, country, score) {
  const motif = selectMotif(holiday, country);
  const text = `${holiday.name} ${holiday.localName}`.toLowerCase();
  const occasionPalette = OCCASION_PALETTES.find(([pattern]) => pattern.test(text))?.[1];
  const [gradient, accent, secondary] = occasionPalette || COUNTRY_PALETTES[country.code] || MOTIF_STYLES[motif] || MOTIF_STYLES.aurora;
  return RANKING_RULES.withRankingMetadata({
    title: holiday.name,
    caption: captionForHoliday(holiday, country),
    description: descriptionForHoliday(holiday, country),
    motif,
    gradient,
    accent,
    secondary,
    priority: priorityForHoliday(holiday, country, score),
    tags: inferTags(holiday, motif),
    source: {
      provider: "Nager.Date",
      countryCode: country.code,
      countryName: country.name,
      localName: holiday.localName,
      typeLabels: holidayTypeLabels(holiday.types)
    },
    score: Math.round(score * 100) / 100
  });
}

function themeForOpenHoliday(holiday, country, score) {
  const name = localizedText(holiday.name, "EN");
  const normalizedHoliday = {
    name,
    localName: name,
    types: [holiday.type],
    global: Boolean(holiday.nationwide)
  };
  const motif = selectMotif(normalizedHoliday, country);
  const text = `${name} ${country.name}`.toLowerCase();
  const occasionPalette = OCCASION_PALETTES.find(([pattern]) => pattern.test(text))?.[1];
  const [gradient, accent, secondary] = occasionPalette || COUNTRY_PALETTES[country.code] || MOTIF_STYLES[motif] || MOTIF_STYLES.aurora;
  const scopeLabel = holiday.nationwide ? "全国性" : "地方性";

  return RANKING_RULES.withRankingMetadata({
    title: name,
    caption: `${name} · ${country.name}`,
    description: descriptionForHoliday(normalizedHoliday, country),
    motif,
    gradient,
    accent,
    secondary,
    priority: priorityForHoliday(normalizedHoliday, country, score),
    tags: inferTags(normalizedHoliday, motif),
    source: {
      provider: "OpenHolidays",
      countryCode: country.code,
      countryName: country.name,
      localName: name,
      typeLabels: [...holidayTypeLabels([holiday.type]), scopeLabel],
      nationwide: Boolean(holiday.nationwide),
      subdivisions: Array.isArray(holiday.subdivisions) ? holiday.subdivisions.map((subdivision) => subdivision.shortName || subdivision.code).filter(Boolean).slice(0, 8) : []
    },
    score: Math.round(score * 100) / 100
  });
}

function scoreHoliday(holiday, country) {
  const base = country.affinity * 10;
  const visual = visualScore(holiday) * 8;
  const typeBoost = Array.isArray(holiday.types) && holiday.types.includes("Public") ? 80 : 0;
  const globalBoost = holiday.global ? 40 : 0;
  const localBoost = country.code === "CN" ? 60 : 0;
  return base + visual + typeBoost + globalBoost + localBoost;
}

function scoreOpenHoliday(holiday, country) {
  const name = localizedText(holiday.name, "EN");
  const normalizedHoliday = {
    name,
    localName: name,
    types: [holiday.type],
    global: Boolean(holiday.nationwide)
  };
  const typeBoost = holiday.type === "Public" ? 70 : holiday.type === "Optional" ? 18 : 30;
  const nationwideBoost = holiday.nationwide ? 35 : 8;
  return country.affinity * 10 + visualScore(normalizedHoliday) * 8 + typeBoost + nationwideBoost;
}

function themeForCulturalObservance(observance, date) {
  return RANKING_RULES.withRankingMetadata({
    title: observance.title,
    caption: `${observance.title} · ${observance.localName}`,
    description: observance.description,
    motif: observance.motif,
    gradient: observance.gradient,
    accent: observance.accent,
    secondary: observance.secondary,
    priority: observance.priority,
    tags: observance.tags,
    source: {
      provider: "Curated Cultural Observances",
      countryCode: "INTL",
      countryName: "International",
      zhName: "国际",
      localName: observance.localName,
      typeLabels: observance.tags.includes("culture") ? ["文化日"] : ["国际日"]
    },
    score: observance.priority * 8 + date.getMonth() * 3
  });
}

function addCulturalObservances(builder, startDate, endDate) {
  for (const year of yearsInRange(startDate, endDate)) {
    for (const observance of CULTURAL_OBSERVANCES) {
      const date = dateFromKey(`${year}-${observance.monthDay}`);
      if (!date || !inRange(date, startDate, endDate)) continue;
      builder.addTheme(dateKey(date), themeForCulturalObservance(observance, date));
    }
  }
}

async function buildHolidayCache(options) {
  const startDate = options.date ? dateFromKey(options.date) : shanghaiToday();
  if (!startDate) throw new Error(`Invalid --date value: ${options.date}`);
  const endDate = addDays(startDate, options.days);
  const years = yearsInRange(startDate, endDate);
  const builder = createHolidayCacheBuilder({
    startDate,
    endDate,
    maxCandidatesPerDay: MAX_CANDIDATES_PER_DAY,
    dateKey,
    addDays
  });
  const errors = [];
  const countries = await countryProfile();
  let openHolidaysCountries = [];
  const sourceStats = {
    nagerRequests: 0,
    nagerSuccessfulRequests: 0,
    nagerFailedRequests: 0,
    nagerErrorSamples: [],
    openHolidaysRequests: 0,
    openHolidaysSuccessfulRequests: 0,
    openHolidaysFailedRequests: 0,
    openHolidaysErrorSamples: []
  };
  const holidayRequests = countries.flatMap((country) => years.map((year) => ({ country, year })));
  sourceStats.nagerRequests = holidayRequests.length;

  const holidayResults = await mapWithConcurrency(
    holidayRequests,
    NAGER_FETCH_CONCURRENCY,
    async ({ country, year }) => {
      try {
        const holidays = await fetchPublicHolidays(year, country);
        return { country, year, holidays };
      } catch (error) {
        return { country, year, error };
      }
    }
  );

  for (const result of holidayResults) {
    if (result.error) {
      const message = `${result.country.code} ${result.year}: ${result.error.message}`;
      errors.push(message);
      sourceStats.nagerFailedRequests += 1;
      if (sourceStats.nagerErrorSamples.length < ERROR_SAMPLE_LIMIT) sourceStats.nagerErrorSamples.push(message);
      continue;
    }
    sourceStats.nagerSuccessfulRequests += 1;

    for (const holiday of result.holidays) {
      const date = dateFromKey(holiday.date);
      if (!date || !inRange(date, startDate, endDate)) continue;
      const score = scoreHoliday(holiday, result.country);
      builder.addTheme(holiday.date, themeForHoliday(holiday, result.country, score));
    }
  }

  try {
    openHolidaysCountries = await openHolidaysCountryProfile();
    sourceStats.openHolidaysRequests = openHolidaysCountries.length;
    const openHolidayResults = await mapWithConcurrency(
      openHolidaysCountries,
      OPEN_HOLIDAYS_FETCH_CONCURRENCY,
      async (country) => {
        try {
          const holidays = await fetchOpenPublicHolidays(country, startDate, endDate);
          return { country, holidays };
        } catch (error) {
          return { country, error };
        }
      }
    );

    for (const result of openHolidayResults) {
      if (result.error) {
        const message = `OpenHolidays ${result.country.code}: ${result.error.message}`;
        errors.push(message);
        sourceStats.openHolidaysFailedRequests += 1;
        if (sourceStats.openHolidaysErrorSamples.length < ERROR_SAMPLE_LIMIT) sourceStats.openHolidaysErrorSamples.push(message);
        continue;
      }
      sourceStats.openHolidaysSuccessfulRequests += 1;

      for (const holiday of result.holidays) {
        const name = localizedText(holiday.name, "EN");
        if (!name) continue;
        const score = scoreOpenHoliday(holiday, result.country);
        for (const date of datesForHolidayRange(holiday.startDate, holiday.endDate, startDate, endDate)) {
          const key = dateKey(date);
          builder.addTheme(key, themeForOpenHoliday(holiday, result.country, score));
        }
      }
    }
  } catch (error) {
    const message = `OpenHolidays country list: ${error.message}`;
    errors.push(message);
    sourceStats.openHolidaysFailedRequests += 1;
    if (sourceStats.openHolidaysErrorSamples.length < ERROR_SAMPLE_LIMIT) sourceStats.openHolidaysErrorSamples.push(message);
  }

  if (options.strictProviders) {
    const failedSources = [];
    if (sourceStats.nagerSuccessfulRequests === 0) failedSources.push("Nager.Date");
    if (sourceStats.openHolidaysSuccessfulRequests === 0) failedSources.push("OpenHolidays");
    if (failedSources.length) {
      throw new Error(`Strict provider refresh failed: no successful responses from ${failedSources.join(", ")}`);
    }
  }

  addCulturalObservances(builder, startDate, endDate);
  const { days: rankedDays, coverage } = builder.finalize();

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: `${API_ROOT}/PublicHolidays/{year}/{countryCode}`,
    sources: [
      {
        name: "Nager.Date Public Holidays",
        url: `${API_ROOT}/PublicHolidays/{year}/{countryCode}`,
        countries: countries.length,
        countryListUrl: `${API_ROOT}/AvailableCountries`,
        fetchConcurrency: NAGER_FETCH_CONCURRENCY
      },
      {
        name: "OpenHolidays Public Holidays",
        url: `${OPEN_HOLIDAYS_API_ROOT}/PublicHolidays`,
        countryListUrl: `${OPEN_HOLIDAYS_API_ROOT}/Countries`,
        countries: openHolidaysCountries.length,
        fetchConcurrency: OPEN_HOLIDAYS_FETCH_CONCURRENCY
      },
      {
        name: "Curated Cultural Observances",
        count: CULTURAL_OBSERVANCES.length
      }
    ],
    window: {
      start: dateKey(startDate),
      end: dateKey(endDate),
      days: options.days
    },
    profile: {
      countries
    },
    coverage,
    sourceStats,
    days: rankedDays,
    errors
  };
}

const options = parseArgs(process.argv.slice(2));
const baseDate = options.date ? dateFromKey(options.date) : shanghaiToday();
if (!baseDate) throw new Error(`Invalid --date value: ${options.date}`);
const existingCache = options.ifNeeded ? readExistingHolidayCache(options.output) : null;

if (options.ifNeeded && cacheCoversRenderWindow(existingCache, baseDate, options.minDays)) {
  console.log("Holiday cache is fresh enough:");
  console.log(`   window: ${existingCache.window.start} -> ${existingCache.window.end}`);
  console.log(`   required through: ${dateKey(addDays(baseDate, options.minDays))}`);
  console.log(`   fallback days: ${existingCache.coverage?.fallbackDays ?? "unknown"}`);
} else {
  const cache = await buildHolidayCache(options);
  fs.mkdirSync(path.dirname(options.output), { recursive: true });
  fs.writeFileSync(options.output, `window.YearCalendarHolidayCache = ${JSON.stringify(cache, null, 2)};\n`);

  console.log("Holiday cache refreshed:");
  console.log(`   output: ${options.output}`);
  console.log(`   window: ${cache.window.start} -> ${cache.window.end}`);
  console.log(`   candidate days: ${cache.coverage.candidateDays}/${cache.coverage.totalDays}`);
  console.log(`   fallback days: ${cache.coverage.fallbackDays}`);
  console.log(`   source errors: ${cache.errors.length}`);
  for (const error of cache.errors.slice(0, 12)) {
    console.log(`   ! ${error}`);
  }
}
