#!/usr/bin/env node

/**
 * Translate just the sidebar/category JSON files
 * These contain labels like "Getting Started", "Settings", "Payment" etc.
 */

const OpenAI = require('openai').default;
const fs = require('fs').promises;
const path = require('path');

const openai = new OpenAI();

const LOCALES = ['es', 'fr', 'de', 'ja', 'pt-BR', 'ko', 'it', 'ar', 'hi-IN', 'zh-CN'];
const LOCALE_NAMES = {
  es: 'Spanish',
  fr: 'French', 
  de: 'German',
  ja: 'Japanese',
  'pt-BR': 'Brazilian Portuguese',
  ko: 'Korean',
  it: 'Italian',
  ar: 'Arabic',
  'hi-IN': 'Hindi',
  'zh-CN': 'Simplified Chinese',
};

// JSON files to translate
const JSON_FILES = [
  'i18n/en/docusaurus-plugin-content-docs/version-1.x.json',
  'i18n/en/docusaurus-plugin-content-docs/version-0.4.x.json',
];

async function translateJsonFile(content, locale) {
  const localeName = LOCALE_NAMES[locale] || locale;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 4096,
    messages: [
      {
        role: 'system',
        content: `You are a professional translator for technical documentation.
Translate the "message" values in this Docusaurus i18n JSON file to ${localeName}.
Rules:
- ONLY translate "message" values
- Keep "description" values in English
- Keep all JSON keys exactly as-is
- Keep version numbers like "1.x", "0.4.x" unchanged
- For technical terms (POS, API, WordPress), keep them in English
- Output ONLY valid JSON, no explanation`
      },
      { role: 'user', content: content }
    ],
  });

  let text = response.choices[0].message.content;
  
  // Strip code fence wrappers if present
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  
  // Validate JSON
  JSON.parse(text);
  return text;
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY required');
    process.exit(1);
  }

  console.log('Translating sidebar JSON files to all locales...\n');

  for (const sourceFile of JSON_FILES) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Source: ${sourceFile}`);
    
    const content = await fs.readFile(sourceFile, 'utf8');
    const relativePath = sourceFile.replace('i18n/en/', '');
    
    for (const locale of LOCALES) {
      const targetPath = path.join('i18n', locale, relativePath);
      console.log(`  → ${locale} (${LOCALE_NAMES[locale]})...`);
      
      try {
        const translated = await translateJsonFile(content, locale);
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.writeFile(targetPath, translated);
        console.log(`    ✓ ${targetPath}`);
      } catch (error) {
        console.error(`    ❌ Error: ${error.message}`);
      }
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 300));
    }
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);
