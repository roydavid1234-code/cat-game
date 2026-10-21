export const RANDOM_COUNTRIES = [
  { name: "🇹🇼 臺灣 · 巷弄日光", flag: "🇹🇼" },
  { name: "🇯🇵 日本 · 東京屋簷", flag: "🇯🇵" },
  { name: "🇬🇧 英國 · 暖爐花園", flag: "🇬🇧" },
  { name: "🇪🇬 埃及 · 金沙古巷", flag: "🇪🇬" },
  { name: "🇫🇷 法國 · 巴黎露台", flag: "🇫🇷" },
  { name: "🇬🇷 希臘 · 藍白階梯", flag: "🇬🇷" },
  { name: "🇺🇸 美國 · 陽光草坪", flag: "🇺🇸" },
  { name: "🇹🇷 土耳其 · 伊斯坦堡海港", flag: "🇹🇷" }
];

export const TOP_BREEDS_SEEDS = [
  { name: "台灣米克斯 (橘貓/虎斑)", rate: 22.4, born: 4140, pass: 980, color: "#e67e22", stripe: "#d35400", type: "原生混種貓", isMix: true },
  { name: "英國短毛貓", rate: 13.8, born: 2552, pass: 520, color: "#7f8c8d", stripe: "#34495e", type: "TICA/CFA認可", isMix: false },
  { name: "美國短毛貓", rate: 11.5, born: 2126, pass: 410, color: "#95a5a6", stripe: "#2c3e50", type: "TICA/CFA認可", isMix: false },
  { name: "布偶貓 (Ragdoll)", rate: 9.6, born: 1775, pass: 310, color: "#ecf0f1", stripe: "#7f8c8d", type: "TICA/CFA認可", isMix: false },
  { name: "三花米克斯", rate: 8.2, born: 1516, pass: 340, color: "#e67e22", stripe: "#2c3e50", type: "原生基因種", isMix: true },
  { name: "暹羅貓 (Siamese)", rate: 6.1, born: 1128, pass: 280, color: "#f5eef8", stripe: "#5b2c6f", type: "TICA/CFA認可", isMix: false },
  { name: "曼赤肯 (短腿貓)", rate: 5.3, born: 980, pass: 190, color: "#f1c40f", stripe: "#d68910", type: "自然突變種", isMix: false },
  { name: "蘇格蘭折耳貓", rate: 4.1, born: 758, pass: 210, color: "#bdc3c7", stripe: "#7f8c8d", type: "TICA認可", isMix: false },
  { name: "緬因貓 (Maine Coon)", rate: 3.7, born: 684, pass: 120, color: "#a04000", stripe: "#6e2c00", type: "TICA/CFA認可", isMix: false },
  { name: "斯芬克斯 (無毛貓)", rate: 2.2, born: 406, pass: 82, color: "#f5b7b1", stripe: "#d98880", type: "TICA/CFA認可", isMix: false }
];

export const EXTENDED_BREED_NAMES = [
  "日本短尾貓", "挪威森林貓", "俄羅斯藍貓", "阿比西尼亞貓", "孟加拉豹貓", "波斯貓",
  "金吉拉", "新加坡貓", "埃及神貓 (Mau)", "土耳其梵貓", "土耳其安哥拉貓", "伯曼貓",
  "夏特爾貓", "西伯利亞森林貓", "東方短毛貓", "緬甸貓", "孟買貓", "德文捲毛貓",
  "康沃爾捲毛貓", "內華達貓 (Nebelung)", "呵叻貓 (Korat)", "索馬利貓", "峇里貓",
  "歐西貓 (Ocicat)", "塞爾凱克捲毛貓", "美國捲耳貓", "東奇尼貓", "雪鞋貓", "曼島貓 (Manx)",
  "威爾斯貓 (Cymric)", "玩具虎貓 (Toyger)", "皮克西鮑勃貓", "哈瓦那棕貓", "白金貓 (Khao Manee)",
  "狼蛛貓 (Lykoi)", "拉邦貓 (LaPerm)", "彼得禿貓", "千島短尾貓", "索科克貓 (Sokoke)",
  "澳洲霧貓", "蒂凡尼貓", "塞倫蓋蒂貓", "約克巧克力貓", "愛琴海貓 (Aegean)", "賽普勒斯貓",
  "德國捲毛貓", "烏克蘭粉耳貓", "重點色短毛貓", "高地折耳貓", "米努特貓 (Minuet)", "獵豹貓 (Cheetoh)",
  "阿拉伯沙漠貓", "中國狸花貓 (Dragon Li)", "湄南貓 (Chao Phraya)", "巴西短毛貓", "歐洲短毛貓",
  "頓斯柯伊無毛貓", "卡累利阿短尾貓", "安納托利亞貓", "喜馬拉雅貓"
];

export const PALETTE_POOL = [
  { c: '#E67E22', s: '#D35400' }, { c: '#7F8C8D', s: '#2C3E50' },
  { c: '#95A5A6', s: '#34495E' }, { c: '#F39C12', s: '#B9770E' },
  { c: '#34495E', s: '#1A252F' }, { c: '#D35400', s: '#900C3F' },
  { c: '#BDC3C7', s: '#7F8C8D' }, { c: '#F5B7B1', s: '#C0392B' }
];

export const ALL_BREEDS_DATABASE = [...TOP_BREEDS_SEEDS];
EXTENDED_BREED_NAMES.forEach((name, idx) => {
  const pal = PALETTE_POOL[idx % PALETTE_POOL.length];
  ALL_BREEDS_DATABASE.push({
    name: name,
    rate: +(Math.random() * 0.8 + 0.1).toFixed(1),
    born: Math.floor(Math.random() * 150) + 20,
    pass: Math.floor(Math.random() * 30) + 5,
    color: pal.c,
    stripe: pal.s,
    type: idx % 3 === 0 ? "地區原生混種貓" : "TICA/CFA認可",
    isMix: idx % 3 === 0
  });
});

export const RANDOM_NAMES = ["麻糬", "咪咪", "橘子", "奶茶", "奧利奧", "豆豆", "珍珠", "小葵", "布丁", "可可", "年糕", "多多", "泡芙", "大福"];

export const NOSTALGIC_STAR_QUOTES = [
  "謝謝你曾是我一生的全世界，我在貓星球每天都能看見你溫柔的影子。🐾",
  "不要哭喔，我現在在軟綿綿的雲朵上，再也不會生病和肚子餓了。☁️✨",
  "如果有下輩子，我還要當你的貓，在門口等著你回家的腳步聲。💖",
  "雖然我先出發了，但每次微風輕輕吹過你的臉頰，都是我回去蹭蹭你。🌸",
  "謝謝你給了我那麼幸福的一生，能遇見你，是我這輩子最幸運的事。🌟",
  "我在這裡交了很多貓咪朋友，但主人，你依然是我最喜歡最喜歡的人。🥺"
];

export const CAT_QUOTES = [
  "世界很大，但我眼裡的宇宙，剛剛好只裝得下你。",
  "才……才不是因為想你才待在這裡的，只是這裡太陽比較暖而已！",
  "愚蠢的人類，罐罐開慢了一秒，本喵的尊嚴就少了一分！",
  "你可以摸我，但只能摸三下，第四下……看我心情囉～",
  "生活沒什麼大不了的，伸個懶腰，換個姿勢，繼續睡。",
  "肚子餓了就吃，累了就睡，想我就摸摸我。生活其實就這麼簡單。",
  "跌倒了又怎樣？滾兩圈假裝是在打滾，就沒有人知道了。",
  "別工作了！電腦鍵盤的溫度剛剛好，現在它是我的床了。",
  "只要我眼睛閉得夠快，剛才被打翻的花瓶就不是我幹的。",
  "你知道為什麼貓沒有口袋嗎？因為所有的美好，我都用爪子抓得緊緊的。"
];

export const EMOJIS = ["🐱", "🐾", "✨", "💖", "🐟", "💤", "🥺", "🌸", "☀️", "🧶", "🌟"];

export const EXPANDED_EVENTS = [
  {
    title: "客廳茶几上的水杯",
    desc: "水杯剛好擺在桌緣，小貓跳上茶几，伸出爪子輕輕推了一下。",
    c1: "【引導去喝乾淨水盆】靈巧與水份提升",
    c2: "【好奇看著牠會不會推倒】可愛爆棚但活力消耗",
    c3: "【拿出零食引誘牠下來】魅力大增但微扣飽足",
    c4: "【輕聲喝斥打翻危險】智力提升但心情受驚下降",
    r1: { msg: "溫柔換上專用碗，貓咪喝了幾口，靈巧值與水份提升！🐾", agility: +3, water: +12, coins: +5 },
    r2: { msg: "啪啷！水杯落地，貓咪敏捷逃跑，可愛爆表但消耗了體能！⚡", cute: +4, energy: -8, coins: +2 },
    r3: { msg: "看見零食立刻跳進你懷裡撒嬌，魅力大增！✨", charm: +4, hunger: -5, affection: +2, coins: +3 },
    r4: { msg: "貓咪似懂非懂地縮起爪子，學會理解指令，但心情有些委屈！💡", smarts: +4, happiness: -6, coins: +2 }
  },
  {
    title: "窗台外飛來的斑鳩鳥",
    desc: "窗外停留了一隻啼叫的鳥兒，貓咪發出喀喀喀的咬齒聲。",
    c1: "【打開窗簾靜靜觀察】沉穩智慧提升",
    c2: "【猛撲玻璃抓鳥】可愛敏捷提升但撞痛扣抵抗力",
    c3: "【一起學鳥叫跟牠互動】增加親密魅力",
    c4: "【抱牠到高處視野更好】鍛鍊靈巧與體能",
    r1: { msg: "貓咪全神貫注地觀察，學會專注，智力值提升！💡", smarts: +4, coins: +5 },
    r2: { msg: "砰一聲撞在玻璃上！雖然模樣超萌，但鼻頭撞得有點微痛！🐾", cute: +4, health: -3, coins: +2 },
    r3: { msg: "貓咪疑惑又開心地轉頭蹭蹭你，親密與魅力大增！✨", charm: +4, affection: +3, coins: +4 },
    r4: { msg: "在制高點穩穩站立，肌肉與靈巧度得到鍛鍊！⚡", agility: +4, energy: -5, coins: +3 }
  },
  {
    title: "大瓦楞紙箱的誘惑",
    desc: "一個方方正正的空快遞紙箱放在走廊中央，散發著致命的吸引力。",
    c1: "【鋪上軟毛巾做成貓窩】舒適安全感大增",
    c2: "【任由牠瘋狂啃咬紙屑】可愛磨牙但誤食紙屑扣飽足",
    c3: "【在紙箱上挖洞玩捉迷藏】考驗敏捷身手",
    c4: "【在箱頂放置機關】動腦解謎智力提升",
    r1: { msg: "貓咪縮在箱子裡甜甜睡去，對你的依賴與魅力大增！💖", charm: +4, happiness: +10, coins: +5 },
    r2: { msg: "瘋狂啃紙箱鍛鍊牙齒，可愛爆棚！但吞了點紙屑微扣飽足！🐾", cute: +4, hunger: -8, coins: +2 },
    r3: { msg: "小爪子從洞裡靈活探出探入，靈巧值提升！⚡", agility: +4, energy: -5, coins: +4 },
    r4: { msg: "思考該如何破解機關，智力與觀察力提升！💡", smarts: +4, coins: +5 }
  }
];

export const BASE_PLANET_CATS = [];

export function generateBreedThumbnail(color, stripe) {
  const c = document.createElement('canvas');
  c.width = 48; 
  c.height = 48;
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(10, 16, 28, 20);
  ctx.fillRect(12, 8, 24, 18);
  ctx.fillStyle = stripe;
  ctx.fillRect(12, 2, 7, 8);
  ctx.fillRect(29, 2, 7, 8);
  ctx.fillRect(36, 22, 8, 5);
  ctx.fillStyle = '#2C3E50';
  ctx.fillRect(17, 14, 4, 4);
  ctx.fillRect(27, 14, 4, 4);
  return c.toDataURL();
}