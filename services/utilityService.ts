import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export interface ParsedUtilityInvoice {
  providerName: string;
  providerKey: string;
  clientNumber?: string;
  invoiceNumber?: string;
  totalAmount: number;
  currency: string;
  dueDate: string;
  dueDay: number;
  categoryId: string;
  rawText: string;
}

interface KnownProvider {
  name: string;
  key: string;
  categoryId: string;
  defaultDueDay: number;
  keywords: string[];
}

const KNOWN_UTILITY_PROVIDERS: KnownProvider[] = [
  {
    name: 'Електрохолд (Ток)',
    key: 'electrohold',
    categoryId: 'cat_bills',
    defaultDueDay: 25,
    keywords: ['електрохолд', 'чез', 'електроразпределение', 'електроенергия'],
  },
  {
    name: 'EVN България (Ток)',
    key: 'evn',
    categoryId: 'cat_bills',
    defaultDueDay: 25,
    keywords: ['evn', 'евн'],
  },
  {
    name: 'Енерго-Про (Ток)',
    key: 'energo_pro',
    categoryId: 'cat_bills',
    defaultDueDay: 25,
    keywords: ['енерго-про', 'energo-pro', 'енерго про'],
  },
  {
    name: 'Софийска вода',
    key: 'sofiyska_voda',
    categoryId: 'cat_bills',
    defaultDueDay: 22,
    keywords: ['софийска вода', 'вик софия', 'водоснабдяване'],
  },
  {
    name: 'ВиК (Вода)',
    key: 'vik',
    categoryId: 'cat_bills',
    defaultDueDay: 22,
    keywords: ['вик', 'водоснабдяване и канализация'],
  },
  {
    name: 'Топлофикация София',
    key: 'toplofikacia',
    categoryId: 'cat_bills',
    defaultDueDay: 30,
    keywords: ['топлофикация', 'топлинна енергия'],
  },
  {
    name: 'А1 (Интернет & ТВ & Мобилен)',
    key: 'a1',
    categoryId: 'cat_services',
    defaultDueDay: 15,
    keywords: ['а1 българия', 'а1', 'a1'],
  },
  {
    name: 'Vivacom (Интернет & ТВ)',
    key: 'vivacom',
    categoryId: 'cat_services',
    defaultDueDay: 18,
    keywords: ['vivacom', 'виваком', 'бтк'],
  },
  {
    name: 'Yettel (Мобилен план)',
    key: 'yettel',
    categoryId: 'cat_services',
    defaultDueDay: 20,
    keywords: ['yettel', 'йеттел', 'теленор'],
  },
  {
    name: 'Овергаз (Газ)',
    key: 'overgas',
    categoryId: 'cat_bills',
    defaultDueDay: 25,
    keywords: ['овергаз', 'ситигаз', 'природен газ'],
  },
];

/**
 * Parses raw text from a utility bill / invoice
 */
export function parseUtilityInvoiceText(text: string): ParsedUtilityInvoice {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const lowerText = text.toLowerCase();

  let detectedProvider = 'Комунална сметка';
  let providerKey = 'other';
  let categoryId = 'cat_bills';
  let dueDay = 20;

  // 1. Match Provider
  for (const prov of KNOWN_UTILITY_PROVIDERS) {
    const isMatch = prov.keywords.some((kw) => lowerText.includes(kw));
    if (isMatch) {
      detectedProvider = prov.name;
      providerKey = prov.key;
      categoryId = prov.categoryId;
      dueDay = prov.defaultDueDay;
      break;
    }
  }

  // 2. Client Number / ИТН / Абонатен номер
  let clientNumber: string | undefined;
  const clientRegex = /(?:клиентски\s*номер|клиентски\s*№|итн|абонатен\s*номер|абонатен\s*№|договор\s*№|абонат)[\s:=]*([0-9]{5,15})/i;
  const clientMatch = text.match(clientRegex);
  if (clientMatch && clientMatch[1]) {
    clientNumber = clientMatch[1];
  }

  // 3. Invoice Number
  let invoiceNumber: string | undefined;
  const invRegex = /(?:фактура\s*№|фактура\s*номер|invoice\s*no)[\s:=]*([0-9]{8,12})/i;
  const invMatch = text.match(invRegex);
  if (invMatch && invMatch[1]) {
    invoiceNumber = invMatch[1];
  }

  // 4. Due Date (Срок за плащане / Падеж)
  let dueDate = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
  const dueRegex = /(?:срок\s*за\s*плащане|плати\s*до|падеж|падежна\s*дата|дата\s*на\s*плащане)[\s:=]*(\b\d{2}[./-]\d{2}[./-]\d{4}\b)/i;
  const dueMatch = text.match(dueRegex);
  if (dueMatch && dueMatch[1]) {
    const rawDate = dueMatch[1].replace(/\//g, '.').replace(/-/g, '.');
    const parts = rawDate.split('.');
    if (parts[0].length === 2 && parts[2]?.length === 4) {
      // DD.MM.YYYY -> YYYY-MM-DD
      dueDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      const dayNum = parseInt(parts[0], 10);
      if (dayNum >= 1 && dayNum <= 31) {
        dueDay = dayNum;
      }
    }
  }

  // 5. Total Due Amount (Дължима сума)
  let totalAmount = 0;
  let currency = 'BGN';

  if (lowerText.includes('eur') || lowerText.includes('€') || lowerText.includes('евро')) {
    currency = 'EUR';
  }

  const explicitAmountRegexes = [
    /(?:обща\s*сума\s*за\s*плащане|сума\s*за\s*плащане|дължима\s*сума|общо\s*дължимо|всичко\s*за\s*плащане|общо\s*за\s*плащане|сума\s*по\s*фактурата)[\s:=]*(?:bgn|лв|лева|eur|евро|€)?[\s:=]*([*#]?[0-9]+[.,][0-9]{2})/i,
    /(?:за\s*плащане|общо|сума)[\s:=]*(?:bgn|лв|лева|eur|евро|€)?[\s:=]*([*#]?[0-9]+[.,][0-9]{2})/i,
  ];

  for (const regex of explicitAmountRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const val = parseFloat(match[1].replace(/[*#]/g, '').replace(',', '.'));
      if (!isNaN(val) && val > 0 && val < 10000) {
        totalAmount = val;
        break;
      }
    }
  }

  // Fallback: pick the highest decimal price that looks like a total bill
  if (totalAmount === 0) {
    const priceMatches = text.match(/\b\d+[,.]\d{2}\b/g);
    if (priceMatches && priceMatches.length > 0) {
      const nums = priceMatches
        .map((p) => parseFloat(p.replace(',', '.')))
        .filter((n) => n > 5 && n < 5000);
      if (nums.length > 0) {
        totalAmount = Math.max(...nums);
      }
    }
  }

  return {
    providerName: detectedProvider,
    providerKey,
    clientNumber,
    invoiceNumber,
    totalAmount,
    currency,
    dueDate,
    dueDay,
    categoryId,
    rawText: text,
  };
}

/**
 * Recognizes text from a utility bill file (PDF or Image) using OCR
 */
export async function processUtilityBillFile(
  fileUri: string,
  isPdf = false
): Promise<ParsedUtilityInvoice> {
  const API_KEYS = ['K88383823488957', 'helloworld', 'K81838848888957'];

  let base64Data = '';

  if (isPdf) {
    base64Data = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } else {
    // Compress and resize image screenshot/photo to ~200KB for fast OCR
    const manip = await manipulateAsync(
      fileUri,
      [{ resize: { width: 1400 } }],
      { compress: 0.8, format: SaveFormat.JPEG, base64: true }
    );
    base64Data = manip.base64 || '';
  }

  const cleanBase64 = isPdf
    ? `data:application/pdf;base64,${base64Data}`
    : `data:image/jpeg;base64,${base64Data}`;

  for (const apiKey of API_KEYS) {
    try {
      const formData = new FormData();
      formData.append('base64Image', cleanBase64);
      if (isPdf) {
        formData.append('filetype', 'PDF');
      }
      formData.append('OCREngine', '2');
      formData.append('isTable', 'true');
      formData.append('apikey', apiKey);

      const res = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.IsErroredOnProcessing && data.ParsedResults && data.ParsedResults.length > 0) {
        const parsedText = data.ParsedResults.map((r: any) => r.ParsedText).join('\n');
        if (parsedText.trim().length > 0) {
          return parseUtilityInvoiceText(parsedText);
        }
      }
    } catch (err) {
      console.warn(`Utility OCR attempt failed with key ${apiKey}:`, err);
    }
  }

  // If OCR failed, return default template for manual confirmation
  return {
    providerName: 'Електрохолд (Ток)',
    providerKey: 'electrohold',
    totalAmount: 0,
    currency: 'BGN',
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    dueDay: 25,
    categoryId: 'cat_bills',
    rawText: 'Не беше разчетен текст от фактурата. Моля въведете данните ръчно.',
  };
}

/**
 * Pre-configured Bulgarian sample invoices for instant testing
 */
export const SAMPLE_UTILITY_INVOICES = [
  {
    title: 'Електрохолд (Ток)',
    icon: 'flash',
    color: '#FF9500',
    text: `ЕЛЕКТРОХОЛД ПРОДАЖБИ ЕАД
ЕИК: 130007884
ФАКТУРА № 0194829104 / 05.09.2026
КЛИЕНТСКИ НОМЕР: 1002948291
ИТН: 3948291
ОТЧЕТЕН ПЕРИОД: 01.08.2026 - 31.08.2026
АКТИВНА ЕНЕРГИЯ ДНЕВНА: 240 KWH
АКТИВНА ЕНЕРГИЯ НОЩНА:  110 KWH
СРОК ЗА ПЛАЩАНЕ: 25.09.2026
ОБЩА СУМА ЗА ПЛАЩАНЕ: 84.30 BGN`,
  },
  {
    title: 'Софийска вода',
    icon: 'water',
    color: '#007AFF',
    text: `СОФИЙСКА ВОДА АД
ФАКТУРА № 3001948215
АБОНАТЕН НОМЕР: 8492015
АДРЕС: ГР. СОФИЯ
ДОСТАВЯНЕ НА ВОДА: 12 М3
ОТВЕЖДАНЕ НА ВОДА: 12 М3
ПРЕЧИСТВАНЕ: 12 М3
СРОК ЗА ПЛАЩАНЕ: 22.09.2026
ДЪЛЖИМА СУМА: 41.50 BGN`,
  },
  {
    title: 'А1 (Интернет & ТВ)',
    icon: 'tv',
    color: '#FF3B30',
    text: `А1 БЪЛГАРИЯ ЕАД
МЕСЕЧНА СМЕТКА / ФАКТУРА № 1184920194
КЛИЕНТСКИ НОМЕР: 4820195
ОПТИЧЕН ИНТЕРНЕТ 300 MBPS: 24.99 BGN
ИНТЕРАКТИВНА ТВ 160 КАНАЛА: 12.00 BGN
ПЛАТИ ДО: 15.09.2026
СУМА ЗА ПЛАЩАНЕ: 36.99 BGN`,
  },
  {
    title: 'Топлофикация София',
    icon: 'flame',
    color: '#AF52DE',
    text: `ТОПЛОФИКАЦИЯ СОФИЯ ЕАД
ФАКТУРА № 5501928491
АБОНАТЕН НОМЕР: 1049281
ТОПЛИННА ЕНЕРГИЯ ЗА ОТОПЛЕНИЕ И БГВ
МЕСЕЦ: АВГУСТ 2026
СРОК ЗА ПЛАЩАНЕ: 30.09.2026
ОБЩО ДЪЛЖИМО: 52.80 BGN`,
  },
];
