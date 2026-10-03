// Shared fallback copy for holidays without structured or legacy content.
//
// This file intentionally exposes a global namespace so it can be loaded both
// by browser script tags and by Node ESM maintenance scripts. The cache builder
// bakes a fallback description into data/holiday-cache.js and the renderer can
// regenerate one, so the copy lives here once instead of drifting apart.
//
// Rules for the copy: one sentence, at most 45 full-width characters, no
// untranslated holiday title pasted into the sentence, no filler phrases.

globalThis.YearCalendarHolidayIntroRules = (() => {
  // Provider labels reach this module from several callers, so never let a
  // non-Chinese label end up inside a Chinese sentence.
  const TYPE_LABELS = {
    Public: "公众节日",
    Bank: "银行假日",
    School: "学校假日",
    Authorities: "政府机关假日",
    Optional: "可选假日",
    Observance: "纪念日"
  };

  const REGION_NAMES_ZH = typeof Intl !== "undefined" && Intl.DisplayNames
    ? new Intl.DisplayNames(["zh-Hans"], { type: "region" })
    : null;

  function chineseTypeLabel(value) {
    if (TYPE_LABELS[value]) return TYPE_LABELS[value];
    return /[\u4e00-\u9fff]/.test(value) ? value : "节日";
  }

  // Provider country names are English for everything outside the curated
  // profile, so resolve the ISO code before falling back to the given name.
  function chineseCountryName(code, name) {
    if (/[\u4e00-\u9fff]/.test(name)) return name;
    try {
      const localized = code ? REGION_NAMES_ZH?.of(String(code).toUpperCase()) : "";
      if (localized && localized !== code) return localized;
    } catch {
      // Some provider country codes are not valid ISO regions.
    }
    return name || "当地";
  }

  function holidayIntroduction({ title = "", localName = "", countryCode = "", countryName = "", typeLabel = "节日", nationwide = true } = {}) {
    const text = `${title} ${localName}`.toLowerCase();
    const country = chineseCountryName(countryCode, countryName);
    const label = chineseTypeLabel(typeLabel);

    if (/king'?s birthday|queen'?s birthday|\b(king|queen)\b.{0,20}\bbirthday\b/.test(text)) {
      if (/australia|australian/.test(text) || country === "澳大利亚") {
        return "澳大利亚庆祝英国君主生日的假日，多安排在六月形成长周末。";
      }
      return "英联邦传统中的君主生日假日，象征君主制与国家礼仪，也常形成长周末。";
    }
    if (/orthodox christmas|christmas eve \(orthodox\)|orthodox christmas eve/.test(text)) {
      return "东正教圣诞节按儒略历在1月7日前后，以教堂礼仪和家庭团聚迎接圣诞。";
    }
    if (/lunar new year|chinese new year|spring festival/.test(text)) {
      return "农历新年是东亚文化圈最重要的节庆，团圆饭、红包和春联延续辞旧迎新。";
    }
    if (/new year/.test(text)) return "新年假日标志公历年份开始，人们以倒数、烟火和聚会迎接新的日历周期。";
    if (/epiphany|three kings/.test(text)) return "主显节在圣诞节期尾声，纪念东方三博士来朝，常见游行、祝福和家庭聚会。";
    if (/christmas/.test(text)) return "圣诞节源自基督教传统，也是许多地方的冬日团聚节日，常见灯饰、松枝与家庭餐桌。";
    if (/boxing day/.test(text)) return "节礼日延续英联邦传统，在圣诞节次日，人们继续休假、探亲或观看体育赛事。";
    if (/good friday/.test(text)) return "耶稣受难日纪念基督教传统中耶稣受难，许多地方以静默礼拜和复活节前休假标记。";
    if (/easter/.test(text)) return "复活节源自基督教传统，纪念复活与新生，常见彩蛋、家庭聚会和春日休假。";
    if (/sacred heart/.test(text)) return "圣心节源自天主教传统，纪念耶稣圣心，常见弥撒、游行和地方守护庆典。";
    if (/corpus christi/.test(text)) return "基督圣体圣血节源自天主教传统，以圣体游行、花毯和城镇仪式表达信仰共同体。";
    if (/assumption/.test(text)) return "圣母升天节源自天主教传统，与礼拜、游行和夏日休假相连。";
    if (/all saints/.test(text)) return "诸圣节源自基督教传统，用于纪念圣徒，也与献花、点烛和追思逝者相连。";
    if (/all souls/.test(text)) return "诸灵节延续基督教追思传统，人们前往墓地、点烛或以家庭仪式纪念逝者。";
    if (/\bmidsummer\b|\bst\.? john\b|\bjohn'?s day\b/.test(text)) return "仲夏节常见于欧洲传统，篝火、夏夜聚会和地方仪式是重要习俗。";
    if (/\bwhit (monday|sunday|tuesday)\b|\bpentecost\b/.test(text)) return "圣灵降临节后的星期一，纪念圣灵降临，常形成春末长周末。";
    if (/carnival|karneval|mardi gras/.test(text)) return "狂欢节多在大斋期前后，人们以游行、面具和音乐打破日常秩序。";
    if (/eid al-|eid ul-|ramadan|islamic new year|ashura|mawlid/.test(text)) {
      return "伊斯兰节日按希吉来历推算，以礼拜、家庭团聚、施舍和共享餐食为传统。";
    }
    if (/\bdiwali\b|\bholi\b|\bganesh chaturthi\b|\bnavratri\b|\bdurga puja\b/.test(text)) {
      return "印度教节庆以灯饰、色彩、音乐和家庭礼拜为核心，常延续数日。";
    }
    if (/municipal holiday|city day|town day|communal holiday|community holiday/.test(text)) {
      return `${country}的地方假日，纪念城市守护圣人、建城传统或本地共同体历史。`;
    }
    if (/national heroes|heroes'? day/.test(text)) return `${country}的国家英雄纪念日，致敬建国或独立进程中的关键人物。`;
    if (/victory day|liberation day|freedom day|emancipation day/.test(text)) {
      return `${country}的解放纪念日，回望独立、废奴或战争结束等历史转折。`;
    }
    if (/armed forces day|army day|military day/.test(text)) return `${country}的建军或军人纪念日，以阅兵、仪式和公共纪念致敬军队。`;
    if (/martyrs'? day/.test(text)) return `${country}的烈士纪念日，缅怀在政治变革或冲突中失去生命的人们。`;
    if (/juneteenth/.test(text)) return "纪念美国废除奴隶制的日子，以游行、音乐和社区活动延续自由记忆。";
    if (/independence day/.test(text)) return `${country}的独立纪念日，纪念取得主权或脱离殖民统治，常伴随旗帜与庆典。`;
    if (/national day|canada day|australia day|waitangi day|bastille day/.test(text)) {
      return `${country}的国家纪念日，纪念国家成立、宪法传统或重要历史节点。`;
    }
    if (/republic day/.test(text)) return `${country}的共和国纪念日，纪念共和国体制确立或重要宪政转折。`;
    if (/constitution day/.test(text)) return `${country}的宪法纪念日，纪念宪法秩序或现代国家制度的重要节点。`;
    if (/foundation day/.test(text)) return `${country}的建国或奠基纪念日，回望国家、城市或共同体的形成历史。`;
    if (/\bunity\b|\bstatehood\b|restoration of the republic/.test(text)) {
      return `${country}的国家纪念日，回望统一、建州或共和体制恢复的节点。`;
    }
    if (/labou?r day|workers'? day|may day/.test(text)) return "劳动节纪念劳动者权益与劳动生活，许多地方在这一天休假或举行公共活动。";
    if (/teachers'? day/.test(text)) return `${country}的教师节，学校与社区借此肯定教育工作和知识传承。`;
    if (/children'?s day/.test(text)) return `${country}的儿童节，以活动和福利倡议关注儿童成长与权利。`;
    if (/women'?s day/.test(text)) return "国际妇女节关注女性权利与社会参与，常见表彰、集会与公共倡议。";
    if (/thanksgiving/.test(text)) return "感恩节以感谢、收获和团聚为核心，常见家庭餐桌、秋日食物与亲友相聚。";
    if (/remembrance|memorial/.test(text)) return "带有追思性质的纪念日，以静默、花束和公共仪式记住历史与逝去的人。";
    if (/bank holiday/.test(text)) return `${country}的银行假日是公共休息日，人们借此旅行、聚会或处理家庭事务。`;
    if (/^(st\.?|saint|sankt|san|santa|santo)\s/i.test(title)) {
      return `${country}的圣人纪念日，多与地方守护传统有关，常见礼拜、游行和社区聚会。`;
    }
    if (/^day of /i.test(title)) return `${country}的地方纪念日，回望城市、地区或共同体的历史与自治传统。`;
    if (localName && localName.length <= 18) {
      return `${country}的地方节日，当地语言称「${localName}」，名称保留了社区记忆。`;
    }
    if (nationwide === false) return `${country}的地方性${label}，多与城市、地区的守护传统或地方历史有关。`;
    if (/公众节日|银行假日|公共假日/.test(label)) {
      return `${country}的${label}，当地公共日历上的休息日，常见家庭团聚与社区活动。`;
    }
    return `${country}日历上标记地方记忆、宗教传统或公共生活的一天。`;
  }

  return { holidayIntroduction };
})();
