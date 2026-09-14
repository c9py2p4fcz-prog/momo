export interface ParsedReceiptData {
  storeName: string;
  totalAmount: number;
  currency: string;
  date: string;
  suggestedCategoryId?: string;
  rawText: string;
}

// Known merchants in Bulgaria and their category mapping
const KNOWN_MERCHANTS: Record<string, { name: string; categoryId: string }> = {
  // Supermarkets
  billa: { name: 'Billa', categoryId: 'cat_supermarket' },
  билла: { name: 'Billa', categoryId: 'cat_supermarket' },
  lidl: { name: 'Lidl', categoryId: 'cat_supermarket' },
  лидл: { name: 'Lidl', categoryId: 'cat_supermarket' },
  kaufland: { name: 'Kaufland', categoryId: 'cat_supermarket' },
  кауфланд: { name: 'Kaufland', categoryId: 'cat_supermarket' },
  fantastico: { name: 'Фантастико', categoryId: 'cat_supermarket' },
  фантастико: { name: 'Фантастико', categoryId: 'cat_supermarket' },
  't market': { name: 'T Market', categoryId: 'cat_supermarket' },
  tmarket: { name: 'T Market', categoryId: 'cat_supermarket' },
  'т маркет': { name: 'T Market', categoryId: 'cat_supermarket' },
  metro: { name: 'Metro Cash & Carry', categoryId: 'cat_supermarket' },
  метро: { name: 'Metro Cash & Carry', categoryId: 'cat_supermarket' },
  дар: { name: 'Супермаркет Дар', categoryId: 'cat_supermarket' },
  cba: { name: 'ЦБА', categoryId: 'cat_supermarket' },
  цба: { name: 'ЦБА', categoryId: 'cat_supermarket' },

  // Fuel / Gas stations
  shell: { name: 'Shell', categoryId: 'cat_transport' },
  шел: { name: 'Shell', categoryId: 'cat_transport' },
  шелл: { name: 'Shell', categoryId: 'cat_transport' },
  omv: { name: 'OMV', categoryId: 'cat_transport' },
  омв: { name: 'OMV', categoryId: 'cat_transport' },
  lukoil: { name: 'Лукойл', categoryId: 'cat_transport' },
  лукойл: { name: 'Лукойл', categoryId: 'cat_transport' },
  eko: { name: 'EKO', categoryId: 'cat_transport' },
  еко: { name: 'EKO', categoryId: 'cat_transport' },
  rompetrol: { name: 'Ромпетрол', categoryId: 'cat_transport' },
  ромпетрол: { name: 'Ромпетрол', categoryId: 'cat_transport' },
  gazprom: { name: 'Газпром', categoryId: 'cat_transport' },
  газпром: { name: 'Газпром', categoryId: 'cat_transport' },
  petrol: { name: 'Петрол', categoryId: 'cat_transport' },
  петрол: { name: 'Петрол', categoryId: 'cat_transport' },

  // Pharmacy / Drogerie
  dm: { name: 'dm drogerie markt', categoryId: 'cat_health' },
  дм: { name: 'dm drogerie markt', categoryId: 'cat_health' },
  lilly: { name: 'Lilly Drogerie', categoryId: 'cat_health' },
  лили: { name: 'Lilly Drogerie', categoryId: 'cat_health' },
  subra: { name: 'Аптека Субра', categoryId: 'cat_health' },
  субра: { name: 'Аптека Субра', categoryId: 'cat_health' },
  sopharmacy: { name: 'SOpharmacy', categoryId: 'cat_health' },
  софармаси: { name: 'SOpharmacy', categoryId: 'cat_health' },
  ремедиум: { name: 'Аптека Ремедиум', categoryId: 'cat_health' },
  remedium: { name: 'Аптека Ремедиум', categoryId: 'cat_health' },
  марешки: { name: 'Аптека Марешки', categoryId: 'cat_health' },

  // Clothes & Shopping
  zara: { name: 'Zara', categoryId: 'cat_shopping' },
  зара: { name: 'Zara', categoryId: 'cat_shopping' },
  'h&m': { name: 'H&M', categoryId: 'cat_shopping' },
  hm: { name: 'H&M', categoryId: 'cat_shopping' },
  pepco: { name: 'Pepco', categoryId: 'cat_shopping' },
  пепко: { name: 'Pepco', categoryId: 'cat_shopping' },
  jumbo: { name: 'Jumbo', categoryId: 'cat_shopping' },
  джъмбо: { name: 'Jumbo', categoryId: 'cat_shopping' },
  decathlon: { name: 'Decathlon', categoryId: 'cat_shopping' },
  декатлон: { name: 'Decathlon', categoryId: 'cat_shopping' },

  // Electronics & Home
  technopolis: { name: 'Технополис', categoryId: 'cat_services' },
  технополис: { name: 'Технополис', categoryId: 'cat_services' },
  technomarket: { name: 'Техномаркет', categoryId: 'cat_services' },
  техномаркет: { name: 'Техномаркет', categoryId: 'cat_services' },
  zora: { name: 'Зора', categoryId: 'cat_services' },
  зора: { name: 'Зора', categoryId: 'cat_services' },
  ikea: { name: 'IKEA', categoryId: 'cat_rent' },
  икеа: { name: 'IKEA', categoryId: 'cat_rent' },
  praktiker: { name: 'Практикер', categoryId: 'cat_rent' },
  практикер: { name: 'Практикер', categoryId: 'cat_rent' },
  bauhaus: { name: 'Баухаус', categoryId: 'cat_rent' },
  баухаус: { name: 'Баухаус', categoryId: 'cat_rent' },

  // Food & Coffee
  happy: { name: 'Happy Bar & Grill', categoryId: 'cat_food' },
  хепи: { name: 'Happy Bar & Grill', categoryId: 'cat_food' },
  starbucks: { name: 'Starbucks', categoryId: 'cat_food' },
  старбъкс: { name: 'Starbucks', categoryId: 'cat_food' },
  costa: { name: 'Costa Coffee', categoryId: 'cat_food' },
  mcdonalds: { name: "McDonald's", categoryId: 'cat_food' },
  kfc: { name: 'KFC', categoryId: 'cat_food' },
  subway: { name: 'Subway', categoryId: 'cat_food' },
  hesburger: { name: 'Hesburger', categoryId: 'cat_food' },
  доминос: { name: "Domino's Pizza", categoryId: 'cat_food' },
  dominos: { name: "Domino's Pizza", categoryId: 'cat_food' },
};

/**
 * Intelligent text parser for Bulgarian and European fiscal receipts
 */
export function parseReceiptText(text: string): ParsedReceiptData {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let detectedStore = '';
  let detectedAmount = 0;
  let detectedCurrency = 'BGN';
  let detectedDate = new Date().toISOString().split('T')[0];
  let suggestedCategory = 'cat_supermarket';

  const lowerText = text.toLowerCase();

  // 1. Merchant Detection: Known merchants
  for (const [key, info] of Object.entries(KNOWN_MERCHANTS)) {
    if (lowerText.includes(key)) {
      detectedStore = info.name;
      suggestedCategory = info.categoryId;
      break;
    }
  }

  // Fallback Merchant Detection from the header lines
  if (!detectedStore && lines.length > 0) {
    for (const rawLine of lines.slice(0, 6)) {
      const line = rawLine.trim();
      // Skip generic lines like "ФИСКАЛЕН БОН", "СЛУЖЕБЕН БОН", "ЕИК", "ДДС"
      if (/фискален|бон|еик|ддс|магазин|обект|булстат|касов|клиент/i.test(line)) {
        continue;
      }
      // Remove company suffixes (ЕООД, ООД, ЕАД, АД, КД, etc.)
      const cleaned = line
        .replace(/["'«»()]/g, '')
        .replace(/\b(еоод|оод|еад|ад|кд|дззд|енд ко|и ко|ltd|gmbh|eood|ood)\b/gi, '')
        .trim();

      if (cleaned.length >= 3 && !/^\d+$/.test(cleaned)) {
        detectedStore = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        break;
      }
    }

    if (!detectedStore) {
      detectedStore = 'Касова бележка';
    }

    if (
      lowerText.includes('ресторант') ||
      lowerText.includes('пицария') ||
      lowerText.includes('механа') ||
      lowerText.includes('кафе') ||
      lowerText.includes('пекарна') ||
      lowerText.includes('дюнер') ||
      lowerText.includes('бургер') ||
      lowerText.includes('закусвалня')
    ) {
      suggestedCategory = 'cat_food';
    } else if (lowerText.includes('аптека') || lowerText.includes('дрогерия')) {
      suggestedCategory = 'cat_health';
    } else if (lowerText.includes('бензиностанция') || lowerText.includes('петрол') || lowerText.includes('гориво')) {
      suggestedCategory = 'cat_transport';
    }
  }

  // 2. Currency Detection
  if (lowerText.includes('eur') || lowerText.includes('€') || lowerText.includes('евро')) {
    detectedCurrency = 'EUR';
  } else if (lowerText.includes('usd') || lowerText.includes('$')) {
    detectedCurrency = 'USD';
  } else {
    detectedCurrency = 'BGN';
  }

  // 3. Date Detection (DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD)
  const dateRegex = /(\b\d{2}[./-]\d{2}[./-]\d{4}\b)|(\b\d{4}[./-]\d{2}[./-]\d{2}\b)/;
  const dateMatch = text.match(dateRegex);
  if (dateMatch) {
    const rawDate = dateMatch[0].replace(/\//g, '.').replace(/-/g, '.');
    const parts = rawDate.split('.');
    if (parts[0].length === 4) {
      // YYYY.MM.DD
      detectedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    } else {
      // DD.MM.YYYY
      detectedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }

  // 4. Exact Amount Detection:
  // Step 4A: Check lines explicitly indicating the total sum (handles e.g. "ОБЩА СУМА: ЕВРО: 2.14" or "СУМА BGN 14.50")
  const explicitTotalRegex = /(?:обща\s*сума|сума\s*общо|общо|сума\s*за\s*плащане|крайна\s*сума|тотал|total|всичко|дължимо|платено|карта|в\s*брой)[\s:=]*(?:евро|eur|bgn|лв|лева|€|\$)?[\s:=]*([*#]?[0-9]+[.,][0-9]{2})/i;
  
  for (const line of lines) {
    const m = line.match(explicitTotalRegex);
    if (m && m[1]) {
      const cleanNumStr = m[1].replace(/[*#]/g, '').replace(',', '.');
      const val = parseFloat(cleanNumStr);
      if (!isNaN(val) && val > 0 && val < 50000) {
        detectedAmount = val;
        break;
      }
    }
  }

  // Step 4B: If no explicit label was found on the same line, look for line before or after "ОБЩО / СУМА"
  if (detectedAmount === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/обща\s*сума|общо|сума|тотал|total|всичко|платено/i.test(line)) {
        // Look in this line and next 2 lines for a decimal number
        const chunk = [line, lines[i + 1] || '', lines[i + 2] || ''].join(' ');
        const numMatches = chunk.match(/\b\d+[,.]\d{2}\b/g);
        if (numMatches && numMatches.length > 0) {
          const vals = numMatches.map((n) => parseFloat(n.replace(',', '.'))).filter((v) => v > 0);
          if (vals.length > 0) {
            detectedAmount = vals[0];
            break;
          }
        }
      }
    }
  }

  // Step 4C: General fallback - find highest standalone decimal number under 10000
  if (detectedAmount === 0) {
    const allPrices = text.match(/\b\d+[,.]\d{2}\b/g);
    if (allPrices && allPrices.length > 0) {
      const numericPrices = allPrices
        .map((p) => parseFloat(p.replace(',', '.')))
        .filter((p) => p > 0 && p < 10000);
      if (numericPrices.length > 0) {
        detectedAmount = Math.max(...numericPrices);
      }
    }
  }

  return {
    storeName: detectedStore,
    totalAmount: detectedAmount,
    currency: detectedCurrency,
    date: detectedDate,
    suggestedCategoryId: suggestedCategory,
    rawText: text,
  };
}

/**
 * Recognizes text from a base64 encoded photo using OCR
 */
export async function recognizeReceiptFromBase64(base64Data: string): Promise<ParsedReceiptData> {
  const cleanBase64 = base64Data.startsWith('data:')
    ? base64Data
    : `data:image/jpeg;base64,${base64Data}`;

  const API_KEYS = ['K88383823488957', 'helloworld', 'K81838848888957'];

  for (const apiKey of API_KEYS) {
    // 1. Try Engine 2 (multilingual Cyrillic + Latin neural OCR)
    try {
      const formData = new FormData();
      formData.append('base64Image', cleanBase64);
      formData.append('OCREngine', '2');
      formData.append('isTable', 'true');
      formData.append('apikey', apiKey);

      const res = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      console.log('OCR Engine 2 Response:', data.OCRExitCode, data.ErrorMessage);

      if (!data.IsErroredOnProcessing && data.ParsedResults && data.ParsedResults.length > 0) {
        const parsedText = data.ParsedResults[0].ParsedText || '';
        if (parsedText.trim().length > 0) {
          console.log('OCR recognized text sample:', parsedText.slice(0, 100));
          return parseReceiptText(parsedText);
        }
      }
    } catch (err) {
      console.warn(`OCR Engine 2 failed with key ${apiKey}:`, err);
    }

    // 2. Try Engine 1 with Cyrillic dictionary
    try {
      const formData = new FormData();
      formData.append('base64Image', cleanBase64);
      formData.append('OCREngine', '1');
      formData.append('language', 'rus');
      formData.append('apikey', apiKey);

      const res = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.IsErroredOnProcessing && data.ParsedResults && data.ParsedResults.length > 0) {
        const parsedText = data.ParsedResults[0].ParsedText || '';
        if (parsedText.trim().length > 0) {
          return parseReceiptText(parsedText);
        }
      }
    } catch (err) {
      console.warn(`OCR Engine 1 failed with key ${apiKey}:`, err);
    }
  }

  // If OCR couldn't extract text (e.g. offline or unreadable photo), return defaults for user confirmation
  return {
    storeName: 'Касова бележка',
    totalAmount: 0,
    currency: 'BGN',
    date: new Date().toISOString().split('T')[0],
    suggestedCategoryId: 'cat_supermarket',
    rawText: 'Не беше разпознат текст. Можете да въведете данните ръчно.',
  };
}

/**
 * Pre-configured Bulgarian sample receipts for instant testing
 */
export const SAMPLE_RECEIPTS: Array<{ title: string; text: string }> = [
  {
    title: 'Супермаркет Billa',
    text: `BILLA БЪЛГАРИЯ ЕООД
Магазин 108 - София
ЕИК: 130007884
ФИСКАЛЕН БОН
ХЛЯБ БЯЛ 650Г               1.69 Б
КРАВЕ СИРЕНЕ 400Г           6.49 Б
ПРЯСНО МЛЯКО 1Л 3.2%        2.89 Б
БАНАНИ 1.250 КГ             3.74 Б
ОБЩА СУМА:                 14.81 BGN
ДДС 20%:                    2.47 BGN
В БРОЙ:                    20.00 BGN
РЕСТО:                      5.19 BGN
ДАТА: 14.09.2026   18:42:10`,
  },
  {
    title: 'Бензиностанция Shell',
    text: `SHELL БЪЛГАРИЯ ЕАД
София, бул. Цариградско шосе
ФИСКАЛЕН БОН
V-POWER DIESEL 32.50 Л      94.25 Б
КАФЕ ЕСПРЕСО                2.80 Б
МИНЕРАЛНА ВОДА 0.5Л         1.50 Б
ВСИЧКО ДЪЛЖИМО:            98.55 BGN
ПЛАТЕНО С КАРТА:           98.55 BGN
ДАТА: 12.09.2026 08:15:33`,
  },
  {
    title: 'Дрогерия dm',
    text: `dm drogerie markt България
Обект 45 - Мол Сердика
ФИСКАЛЕН БОН
БАЛСАМ ЗА КОСА              5.49 Б
ДУШ ГЕЛ ALVERDE             3.29 Б
ПАСТА ЗА ЗЪБИ               4.89 Б
ОБЩО:                      13.67 BGN
ПЛАТЕНО С КАРТА:           13.67 BGN
ДАТА: 10.09.2026 14:20:00`,
  },
  {
    title: 'Супермаркет Lidl',
    text: `\"ЛИДЛ БЪЛГАРИЯ ЕООД ЕНД КО\" КД
Магазин 042 - София
ЕИК 131071587
ФИСКАЛЕН БОН
ПИКАНТНИ КРИЛЦА 500Г        5.99 Б
КАШКАВАЛ ОТ КРАВЕ МЛЯКО     7.49 Б
ДОМАТИ РОЗОВИ 1.100 КГ      4.20 Б
МАСЛО КРАВЕ 82%             4.89 Б
---------------------------------
ОБЩА СУМА:                 22.57 BGN
БАНКОВА КАРТА:             22.57 BGN
14.09.2026 19:30:15`,
  },
];
