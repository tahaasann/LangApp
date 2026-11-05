export type LearnerLevel = "beginner" | "intermediate" | "advanced";
export type Granularity = "fine" | "medium" | "coarse";

export type AlignCase = {
  id: string;
  learning: { name: string; code: string };
  native: { name: string; code: string };
  level: LearnerLevel;
  granularity: Granularity;
  /** Metni cümlelere bölüp cümle başına istek gönderir. */
  chunked: boolean;
  sourceText: string;
  targetText: string;
};

export type GenerateCase = {
  id: string;
  learning: { name: string; code: string };
  native: { name: string; code: string };
  level: LearnerLevel;
  topic: string;
};

const en = { name: "English", code: "en" };
const tr = { name: "Türkçe", code: "tr" };
const de = { name: "Deutsch", code: "de" };
const es = { name: "Español", code: "es" };
const ja = { name: "日本語", code: "ja" };

const paragraph = {
  sourceText:
    "Good evening, I would like to check in for my reservation under the name John Smith. I booked a double room for three nights. Here is my passport and my credit card. Could you tell me what time breakfast is served? I also need a quiet room because I have an early meeting tomorrow. Thank you very much for your help.",
  targetText:
    "İyi akşamlar, John Smith adına yaptığım rezervasyon için giriş yapmak istiyorum. Üç gecelik çift kişilik bir oda ayırttım. İşte pasaportum ve kredi kartım. Kahvaltının saat kaçta verildiğini söyleyebilir misiniz? Yarın erken bir toplantım olduğu için sessiz bir odaya da ihtiyacım var. Yardımınız için çok teşekkür ederim.",
};

const long = {
  sourceText:
    "Urban gardens have become an important part of many modern cities. They give residents a place to grow fresh food, even when they live in small apartments without any outdoor space. Researchers have found that people who spend regular time in these gardens often report lower levels of stress. Although the initial cost of building a garden can be high, the long-term benefits usually outweigh the expense. Neighbors who had never spoken to each other begin to share tools, seeds, and advice. In some districts, local governments now offer empty land to community groups at very low rents. Schools have also joined the movement, teaching children where their food comes from and how to care for plants. As cities continue to grow, these small green spaces may play an even greater role in keeping communities healthy and connected.",
  targetText:
    "Kent bahçeleri birçok modern şehrin önemli bir parçası hâline geldi. Hiç açık alanı olmayan küçük dairelerde yaşasalar bile sakinlere taze gıda yetiştirebilecekleri bir yer sağlıyorlar. Araştırmacılar, bu bahçelerde düzenli olarak vakit geçiren insanların genellikle daha düşük stres seviyeleri bildirdiğini buldu. Bir bahçe kurmanın başlangıç maliyeti yüksek olsa da uzun vadeli faydaları genellikle bu masrafı aşıyor. Birbirleriyle hiç konuşmamış komşular alet, tohum ve tavsiye paylaşmaya başlıyor. Bazı bölgelerde yerel yönetimler artık boş arazileri topluluk gruplarına çok düşük kiralarla sunuyor. Okullar da bu harekete katılarak çocuklara yiyeceklerinin nereden geldiğini ve bitkilere nasıl bakılacağını öğretiyor. Şehirler büyümeye devam ettikçe, bu küçük yeşil alanlar toplulukları sağlıklı ve birbirine bağlı tutmada daha da büyük bir rol oynayabilir.",
};

export const ALIGN_CASES: AlignCase[] = [
  {
    id: "en-tr-short",
    learning: en,
    native: tr,
    level: "beginner",
    granularity: "fine",
    chunked: false,
    sourceText: "I would like to order a large coffee with milk for here, please.",
    targetText: "Burada içmek için sütlü büyük bir kahve sipariş etmek istiyorum, lütfen.",
  },
  {
    id: "en-tr-repeat",
    learning: en,
    native: tr,
    level: "beginner",
    granularity: "fine",
    chunked: false,
    sourceText: "Today is the happiest day of my life because today is so beautiful.",
    targetText: "Bugün hayatımın en mutlu günü çünkü bugün çok güzel.",
  },
  {
    id: "en-tr-paragraph-whole",
    learning: en,
    native: tr,
    level: "intermediate",
    granularity: "medium",
    chunked: false,
    ...paragraph,
  },
  {
    id: "en-tr-paragraph-chunked",
    learning: en,
    native: tr,
    level: "intermediate",
    granularity: "medium",
    chunked: true,
    ...paragraph,
  },
  {
    id: "en-tr-long-whole",
    learning: en,
    native: tr,
    level: "advanced",
    granularity: "medium",
    chunked: false,
    ...long,
  },
  {
    id: "en-tr-long-chunked",
    learning: en,
    native: tr,
    level: "advanced",
    granularity: "medium",
    chunked: true,
    ...long,
  },
  {
    id: "de-es-short",
    learning: de,
    native: es,
    level: "intermediate",
    granularity: "medium",
    chunked: false,
    sourceText: "Ich rufe dich morgen früh an, wenn ich am Bahnhof angekommen bin.",
    targetText: "Te llamaré mañana por la mañana cuando haya llegado a la estación.",
  },
  {
    id: "ja-en-short",
    learning: ja,
    native: en,
    level: "beginner",
    granularity: "fine",
    chunked: false,
    sourceText: "昨日、友達と新しいレストランで美味しい晩ご飯を食べました。",
    targetText: "Yesterday, I ate a delicious dinner at a new restaurant with my friend.",
  },
];

export const GENERATE_CASES: GenerateCase[] = [
  { id: "generate-airport", learning: en, native: tr, level: "beginner", topic: "havaalanında" },
  { id: "generate-coffee", learning: de, native: es, level: "intermediate", topic: "pedir un café" },
];
