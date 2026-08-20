// server/services/dictionaryService.js
// Handles English dictionary lookup + Bengali translation + caching in MongoDB Atlas

import DictionaryCache from '../models/DictionaryCache.js';

// Curated high-accuracy Bengali definitions for common English vocabulary
const CURATED_BENGALI_DICT = {
  benevolent: {
    bengaliMeanings: ['দয়ালু', 'পরোপকারী', 'সদয়', 'কল্যাণকামী'],
    primaryBengali: 'দয়ালু, পরোপকারী, সদয়',
    bengaliExample: 'তিনি তাঁর দয়ালু স্বভাবের জন্য পরিচিত ছিলেন।',
    partOfSpeech: 'Adjective',
    definition: 'Well meaning and kindly; serving a charitable purpose.'
  },
  abate: {
    bengaliMeanings: ['হ্রাস পাওয়া', 'কমে যাওয়া', 'উপশম হওয়া'],
    primaryBengali: 'হ্রাস পাওয়া, কমে যাওয়া',
    bengaliExample: 'সকালের মধ্যে ঝড় কমে গিয়েছিল।',
    partOfSpeech: 'Verb',
    definition: 'Become less intense or widespread.'
  },
  candid: {
    bengaliMeanings: ['অকপট', 'স্পষ্টবাদী', 'সরল'],
    primaryBengali: 'অকপট, স্পষ্টবাদী',
    bengaliExample: 'তাঁর স্পষ্ট মতামত সবাইকে মুগ্ধ করেছিল।',
    partOfSpeech: 'Adjective',
    definition: 'Truthful and straightforward; frank.'
  },
  resilient: {
    bengaliMeanings: ['স্থিতিস্থাপক', 'সংগ্রামী', 'সহনশীল', 'বিপর্যয় কাটিয়ে উঠতে সক্ষম'],
    primaryBengali: 'বিপর্যয় কাটিয়ে উঠতে সক্ষম, সহনশীল',
    bengaliExample: 'কঠিন পরিস্থিতির মধ্যেও তিনি অবিচল ও সহনশীল ছিলেন।',
    partOfSpeech: 'Adjective',
    definition: 'Able to withstand or recover quickly from difficult conditions.'
  },
  meticulous: {
    bengaliMeanings: ['অতি সতর্ক', 'খুঁতখুঁতে', 'সূক্ষ্মদর্শী'],
    primaryBengali: 'অতি সতর্ক, পুঙ্খানুপুঙ্খ',
    bengaliExample: 'তিনি তাঁর কাজে অত্যন্ত সতর্ক ও যত্নশীল ছিলেন।',
    partOfSpeech: 'Adjective',
    definition: 'Showing great attention to detail; very careful and precise.'
  },
  ubiquitous: {
    bengaliMeanings: ['সর্বব্যাপী', 'সর্বত্র বিদ্যমান'],
    primaryBengali: 'সর্বব্যাপী, সর্বত্র বিদ্যমান',
    bengaliExample: 'স্মার্টফোন এখন মানুষের জীবনে সর্বব্যাপী হয়ে উঠেছে।',
    partOfSpeech: 'Adjective',
    definition: 'Present, appearing, or found everywhere.'
  },
  pragmatic: {
    bengaliMeanings: ['বাস্তবধর্মী', 'বাস্তববাদী', 'কার্যকর'],
    primaryBengali: 'বাস্তবধর্মী, বাস্তববাদী',
    bengaliExample: 'তিনি সমস্যাটির একটি বাস্তবধর্মী সমাধান প্রস্তাব করেছিলেন।',
    partOfSpeech: 'Adjective',
    definition: 'Dealing with things sensibly and realistically in a way based on practical rather than theoretical considerations.'
  },
  ephemeral: {
    bengaliMeanings: ['ক্ষণস্থায়ী', 'অল্পকালস্থায়ী'],
    primaryBengali: 'ক্ষণস্থায়ী, ক্ষণিকের',
    bengaliExample: 'খ্যাতি প্রায়ই ক্ষণস্থায়ী হয়।',
    partOfSpeech: 'Adjective',
    definition: 'Lasting for a very short time.'
  },
  eloquent: {
    bengaliMeanings: ['বাকপটু', 'সাবলীল বক্তা', 'ভাবপূর্ণ'],
    primaryBengali: 'বাকপটু, প্রাঞ্জল',
    bengaliExample: 'তিনি এক অত্যন্ত প্রাঞ্জল ও হৃদয়গ্রাহী বক্তৃতা দিয়েছিলেন।',
    partOfSpeech: 'Adjective',
    definition: 'Fluent or persuasive in speaking or writing.'
  },
  lucid: {
    bengaliMeanings: ['স্বচ্ছ', 'সহজবোধ্য', 'স্পষ্ট'],
    primaryBengali: 'সহজবোধ্য, স্পষ্ট',
    bengaliExample: 'শিক্ষক মহাশয় বিষয়টি অত্যন্ত সহজবোধ্যভাবে বুঝিয়ে দিলেন।',
    partOfSpeech: 'Adjective',
    definition: 'Expressed clearly; easy to understand.'
  }
};

/**
 * Translates English text to Bengali using free translation APIs with fallbacks
 */
export async function translateToBengali(text) {
  if (!text || typeof text !== 'string') return '';
  const clean = text.trim();
  if (!clean) return '';

  const normalized = clean.toLowerCase();
  if (CURATED_BENGALI_DICT[normalized]) {
    return CURATED_BENGALI_DICT[normalized].primaryBengali;
  }

  // 1. Try Google Translate public single translation endpoint
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=bn&dt=t&dt=bd&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      // data[0] contains translated sentences
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((item) => item[0]).filter(Boolean).join(' ');
        if (translated && translated.trim() !== clean) {
          return translated.trim();
        }
      }
    }
  } catch (err) {
    // fallback
  }

  // 2. Try MyMemory Translation API fallback
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=en|bn`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText && !data.responseData.translatedText.startsWith('MYMEMORY WARNING')) {
        return data.responseData.translatedText.trim();
      }
    }
  } catch (err) {
    // fallback
  }

  return '';
}

/**
 * Looks up English word in Free Dictionary API and generates rich Bengali meanings
 */
export async function lookupEnglishWord(rawWord) {
  if (!rawWord || typeof rawWord !== 'string') {
    throw new Error('Word is required');
  }

  const normalizedWord = rawWord.trim().toLowerCase();
  if (!normalizedWord) {
    throw new Error('Invalid word');
  }

  // 1. Check MongoDB Cache first
  try {
    const cached = await DictionaryCache.findOne({ normalizedWord });
    if (cached) {
      return cached;
    }
  } catch (err) {
    console.warn('[Dictionary] Cache read error:', err.message);
  }

  // 2. Fetch from Free Dictionary API
  const dictUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalizedWord)}`;
  let dictData = null;
  try {
    const response = await fetch(dictUrl, { signal: AbortSignal.timeout(6000) });
    if (response.status === 404) {
      // Check if we have curated data anyway
      if (CURATED_BENGALI_DICT[normalizedWord]) {
        const cur = CURATED_BENGALI_DICT[normalizedWord];
        const result = {
          word: rawWord.trim(),
          normalizedWord,
          phonetic: '',
          audio: '',
          bengaliMeanings: cur.bengaliMeanings,
          primaryBengali: cur.primaryBengali,
          meanings: [{
            partOfSpeech: cur.partOfSpeech,
            bengaliMeaning: cur.primaryBengali,
            definitions: [{
              definition: cur.definition,
              bengaliDefinition: '',
              example: cur.bengaliExample,
              bengaliExample: cur.bengaliExample,
              synonyms: [],
              antonyms: []
            }],
            synonyms: [],
            antonyms: []
          }],
          synonyms: [],
          antonyms: [],
          source: 'curated'
        };
        try { await DictionaryCache.create(result); } catch (_) {}
        return result;
      }
      return null; // Not found
    }
    if (!response.ok) {
      throw new Error(`Dictionary provider returned ${response.status}`);
    }
    dictData = await response.json();
  } catch (err) {
    // If external dictionary fails, check curated
    if (CURATED_BENGALI_DICT[normalizedWord]) {
      const cur = CURATED_BENGALI_DICT[normalizedWord];
      return {
        word: rawWord.trim(),
        normalizedWord,
        phonetic: '',
        audio: '',
        bengaliMeanings: cur.bengaliMeanings,
        primaryBengali: cur.primaryBengali,
        meanings: [{
          partOfSpeech: cur.partOfSpeech,
          bengaliMeaning: cur.primaryBengali,
          definitions: [{
            definition: cur.definition,
            bengaliDefinition: '',
            example: cur.bengaliExample,
            bengaliExample: cur.bengaliExample,
            synonyms: [],
            antonyms: []
          }]
        }],
        synonyms: [],
        antonyms: [],
        source: 'curated'
      };
    }
    throw err;
  }

  if (!Array.isArray(dictData) || dictData.length === 0) {
    return null;
  }

  const entry = dictData[0];

  // Extract phonetic & audio
  let phonetic = entry.phonetic || '';
  let audio = '';
  if (Array.isArray(entry.phonetics)) {
    for (const p of entry.phonetics) {
      if (!phonetic && p.text) phonetic = p.text;
      if (!audio && p.audio) audio = p.audio;
      if (phonetic && audio) break;
    }
  }

  // Get primary Bengali translation for the word itself
  let primaryBengali = '';
  let bengaliMeanings = [];
  if (CURATED_BENGALI_DICT[normalizedWord]) {
    primaryBengali = CURATED_BENGALI_DICT[normalizedWord].primaryBengali;
    bengaliMeanings = CURATED_BENGALI_DICT[normalizedWord].bengaliMeanings;
  } else {
    primaryBengali = await translateToBengali(normalizedWord);
    if (primaryBengali) {
      bengaliMeanings = primaryBengali.split(/[,;|]+/).map((s) => s.trim()).filter(Boolean);
    }
  }

  // Process meanings by part of speech
  const rawMeanings = Array.isArray(entry.meanings) ? entry.meanings : [];
  const processedMeanings = [];
  const allSynonyms = new Set();
  const allAntonyms = new Set();

  for (const m of rawMeanings) {
    const partOfSpeech = m.partOfSpeech || 'General';
    const defs = Array.isArray(m.definitions) ? m.definitions : [];

    // Collect synonyms & antonyms
    if (Array.isArray(m.synonyms)) m.synonyms.forEach((s) => allSynonyms.add(s));
    if (Array.isArray(m.antonyms)) m.antonyms.forEach((a) => allAntonyms.add(a));

    const processedDefs = [];
    for (const d of defs.slice(0, 4)) { // top 4 definitions per part of speech
      if (Array.isArray(d.synonyms)) d.synonyms.forEach((s) => allSynonyms.add(s));
      if (Array.isArray(d.antonyms)) d.antonyms.forEach((a) => allAntonyms.add(a));

      let bengaliDef = '';
      let bengaliEx = '';

      // For first definition, provide translated Bengali if possible
      if (processedDefs.length === 0 && d.definition) {
        bengaliDef = await translateToBengali(d.definition);
      }
      if (d.example) {
        bengaliEx = await translateToBengali(d.example);
      }

      processedDefs.push({
        definition: d.definition || '',
        bengaliDefinition: bengaliDef,
        example: d.example || '',
        bengaliExample: bengaliEx,
        synonyms: d.synonyms || [],
        antonyms: d.antonyms || []
      });
    }

    // Part of speech specific Bengali meaning
    let posBengali = '';
    if (processedDefs.length > 0 && processedDefs[0].bengaliDefinition) {
      posBengali = processedDefs[0].bengaliDefinition;
    } else {
      posBengali = primaryBengali;
    }

    processedMeanings.push({
      partOfSpeech,
      bengaliMeaning: posBengali,
      definitions: processedDefs,
      synonyms: m.synonyms || [],
      antonyms: m.antonyms || []
    });
  }

  const resultData = {
    word: entry.word || rawWord.trim(),
    normalizedWord,
    phonetic,
    audio,
    bengaliMeanings,
    primaryBengali,
    meanings: processedMeanings,
    synonyms: Array.from(allSynonyms).slice(0, 15),
    antonyms: Array.from(allAntonyms).slice(0, 10),
    source: 'free-dictionary-api'
  };

  // Save to MongoDB Cache asynchronously
  try {
    await DictionaryCache.findOneAndUpdate(
      { normalizedWord },
      resultData,
      { upsert: true, new: true }
    );
  } catch (cacheErr) {
    console.warn('[Dictionary] Cache write error:', cacheErr.message);
  }

  return resultData;
}
