const { TranslationServiceClient } = require('@google-cloud/translate');
const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');

// Get languages from docusaurus.config.js
const docusaurusConfig = require('../docusaurus.config.js');
const DEFAULT_LOCALE = docusaurusConfig.i18n.defaultLocale;
const LANGUAGES = docusaurusConfig.i18n.locales.filter(locale => locale !== DEFAULT_LOCALE);

// Initialize the translation client
const translationClient = new TranslationServiceClient();

async function translateContent(text, targetLanguage) {
  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const location = 'global';

    const request = {
      parent: `projects/${projectId}/locations/${location}`,
      contents: [text],
      mimeType: 'text/markdown', // Specify markdown format
      sourceLanguageCode: 'en',
      targetLanguageCode: targetLanguage,
    };

    const [response] = await translationClient.translateText(request);
    return response.translations[0].translatedText;
  } catch (error) {
    console.error(`Error translating to ${targetLanguage}:`, error);
    throw error;
  }
}

async function processFile(filePath, targetLanguage) {
  try {
    // Read the source file
    const content = await fs.readFile(filePath, 'utf8');
    
    // Parse frontmatter and content
    const { data: frontmatter, content: markdownContent } = matter(content);
    
    // Translate the markdown content
    const translatedContent = await translateContent(markdownContent, targetLanguage);
    
    // Translate title in frontmatter if it exists
    if (frontmatter.title) {
      frontmatter.title = await translateContent(frontmatter.title, targetLanguage);
    }
    
    // Reconstruct the document
    const translatedDoc = matter.stringify(translatedContent, frontmatter);
    
    // Determine the target path in i18n directory
    const relativePath = path.relative('versioned_docs', filePath);
    const targetPath = path.join('i18n', targetLanguage, 'docusaurus-plugin-content-docs', relativePath);
    
    // Ensure the target directory exists
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    
    // Write the translated file
    await fs.writeFile(targetPath, translatedDoc);
    
    console.log(`Translated ${filePath} to ${targetLanguage}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function walkDir(dir) {
  const files = await fs.readdir(dir);
  const mdFiles = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);

    if (stat.isDirectory()) {
      mdFiles.push(...await walkDir(filePath));
    } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
      mdFiles.push(filePath);
    }
  }

  return mdFiles;
}

async function main() {
  try {
    // Get all markdown files from versioned_docs
    const files = await walkDir('versioned_docs');
    
    // Process each file for each target language
    for (const file of files) {
      for (const lang of LANGUAGES) {
        await processFile(file, lang);
      }
    }
    
    console.log('Translation completed successfully!');
  } catch (error) {
    console.error('Error during translation:', error);
    process.exit(1);
  }
}

// Check if Google Cloud credentials are set
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Please set GOOGLE_APPLICATION_CREDENTIALS environment variable');
  process.exit(1);
}

main(); 
