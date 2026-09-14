export const SURAH_NAMES: Record<number, string> = {
  1: "الفاتحة",
  2: "البقرة",
  3: "آل عمران",
  4: "النساء",
  5: "المائدة",
  6: "الأنعام",
  7: "الأعراف",
  8: "الأنفال",
  9: "التوبة",
  10: "يونس",
  11: "هود",
  12: "يوسف",
  13: "الرعد",
  14: "إبراهيم",
  15: "الحجر",
  16: "النحل",
  17: "الإسراء",
  18: "الكهف",
  19: "مريم",
  20: "طه",
  21: "الأنبياء",
  22: "الحج",
  23: "المؤمنون",
  24: "النور",
  25: "الفرقان",
  26: "الشعراء",
  27: "النمل",
  28: "القصص",
  29: "العنكبوت",
  30: "الروم",
  31: "لقمان",
  32: "السجدة",
  33: "الأحزاب",
  34: "سبأ",
  35: "فاطر",
  36: "يس",
  37: "الصافات",
  38: "ص",
  39: "الزمر",
  40: "غافر",
  41: "فصلت",
  42: "الشورى",
  43: "الزخرف",
  44: "الدخان",
  45: "الجاثية",
  46: "الأحقاف",
  47: "محمد",
  48: "الفتح",
  49: "الحجرات",
  50: "ق",
  51: "الذاريات",
  52: "الطور",
  53: "النجم",
  54: "القمر",
  55: "الرحمن",
  56: "الواقعة",
  57: "الحديد",
  58: "المجادلة",
  59: "الحشر",
  60: "الممتحنة",
  61: "الصف",
  62: "الجمعة",
  63: "المنافقون",
  64: "التغابن",
  65: "الطلاق",
  66: "التحريم",
  67: "الملك",
  68: "القلم",
  69: "الحاقة",
  70: "المعارج",
  71: "نوح",
  72: "الجن",
  73: "المزمل",
  74: "المدثر",
  75: "القيامة",
  76: "الإنسان",
  77: "المرسلات",
  78: "النبأ",
  79: "النازعات",
  80: "عبس",
  81: "التكوير",
  82: "الانفطار",
  83: "المطففين",
  84: "الانشقاق",
  85: "البروج",
  86: "الطارق",
  87: "الأعلى",
  88: "الغاشية",
  89: "الفجر",
  90: "البلد",
  91: "الشمس",
  92: "الليل",
  93: "الضحى",
  94: "الشرح",
  95: "التين",
  96: "العلق",
  97: "القدر",
  98: "البينة",
  99: "الزلزلة",
  100: "العاديات",
  101: "القارعة",
  102: "التكاثر",
  103: "العصر",
  104: "الهمزة",
  105: "الفيل",
  106: "قريش",
  107: "الماعون",
  108: "الكوثر",
  109: "الكافرون",
  110: "النصر",
  111: "المسد",
  112: "الإخلاص",
  113: "الفلق",
  114: "الناس",
};

export const POINTS = {
  FAJR: 15,
  ADKAR_SABAH: 8,
  ADKAR_MASA2: 8,
  MEMORIZATION: 25,
  SMALL_ADKAR: 2,
} as const;

export const MOROCCO_REGIONS = {
  "tanger-tetouan-al-hoceima": {
    name: "طنجة-تطوان-الحسيمة",
    apiName: "Tangier",
    lat: 35.7595,
    lng: -5.834,
  },
  oriental: {
    name: "الشرق",
    apiName: "Oujda",
    lat: 34.6814,
    lng: -1.9086,
  },
  "fes-meknes": {
    name: "فاس-مكناس",
    apiName: "Fes",
    lat: 34.0181,
    lng: -5.0078,
  },
  "rabat-sale-kenitra": {
    name: "الرباط-سلا-القنيطرة",
    apiName: "Rabat",
    lat: 34.0209,
    lng: -6.8416,
  },
  "beni-mellal-khenifra": {
    name: "بني ملال-خنيفرة",
    apiName: "Beni Mellal",
    lat: 32.3373,
    lng: -6.3498,
  },
  "casablanca-settat": {
    name: "الدار البيضاء-سطات",
    apiName: "Casablanca",
    lat: 33.5731,
    lng: -7.5898,
  },
  "marrakech-safi": {
    name: "مراكش-آسفي",
    apiName: "Marrakech",
    lat: 31.6295,
    lng: -7.9811,
  },
  "draa-tafilalet": {
    name: "درعة-تافيلالت",
    apiName: "Errachidia",
    lat: 31.9314,
    lng: -4.4244,
  },
  "souss-massa": {
    name: "سوس-ماسة",
    apiName: "Agadir",
    lat: 30.4278,
    lng: -9.5981,
  },
  "guelmim-oued-noun": {
    name: "كلميم-واد نون",
    apiName: "Guelmim",
    lat: 28.9884,
    lng: -10.0574,
  },
  "laayoune-sakia-el-hamra": {
    name: "العيون-الساقية الحمراء",
    apiName: "Laayoune",
    lat: 27.1253,
    lng: -13.1625,
  },
  "dakhla-oued-ed-dahab": {
    name: "الداخلة-وادي الذهب",
    apiName: "Dakhla",
    lat: 23.6848,
    lng: -15.958,
  },
} as const;

export type MoroccoRegionKey = keyof typeof MOROCCO_REGIONS;

export const DEFAULT_REGION: MoroccoRegionKey = "casablanca-settat";

const LEGACY_CITY_TO_REGION: Record<string, MoroccoRegionKey> = {
  casablanca: "casablanca-settat",
  rabat: "rabat-sale-kenitra",
  marrakech: "marrakech-safi",
  fes: "fes-meknes",
  tangier: "tanger-tetouan-al-hoceima",
};

export function resolveRegionKey(value?: string | null): MoroccoRegionKey {
  if (value && value in MOROCCO_REGIONS) {
    return value as MoroccoRegionKey;
  }
  if (value && value in LEGACY_CITY_TO_REGION) {
    return LEGACY_CITY_TO_REGION[value];
  }
  return DEFAULT_REGION;
}

/** @deprecated use MOROCCO_REGIONS */
export const MOROCCO_CITIES = MOROCCO_REGIONS;
export type MoroccoCityKey = MoroccoRegionKey;
export const DEFAULT_CITY = DEFAULT_REGION;

export type UserRole = "OWNER" | "ADMIN" | "MEMBER";
export type UserStatus = "PENDING" | "ACTIVE" | "PAUSED" | "REMOVED";
