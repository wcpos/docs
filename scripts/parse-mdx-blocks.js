#!/usr/bin/env node

/**
 * MDX Block Parser
 * 
 * Parses MDX documents into semantic blocks for incremental translation.
 * Each block has a type, content, and hash for comparison.
 */

const crypto = require('crypto');

/**
 * Block types
 */
const BlockType = {
  FRONTMATTER: 'frontmatter',
  IMPORT: 'import',
  HEADING: 'heading',
  PARAGRAPH: 'paragraph',
  LIST: 'list',
  TABLE: 'table',
  CODE_BLOCK: 'code_block',
  ADMONITION: 'admonition',
  JSX: 'jsx',
  EMPTY: 'empty',
  HTML_COMMENT: 'html_comment',
  JSX_COMMENT: 'jsx_comment',
};

/**
 * Generate a hash for block content
 */
function hashContent(content) {
  return crypto.createHash('md5').update(content).digest('hex').substring(0, 12);
}

/**
 * Parse MDX content into semantic blocks
 * 
 * @param {string} content - MDX file content
 * @returns {Array<{type: string, content: string, hash: string, startLine: number, endLine: number}>}
 */
function parseIntoBlocks(content) {
  const lines = content.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const startLine = i;

    // Frontmatter (must be at start of file)
    if (i === 0 && line === '---') {
      let endIdx = i + 1;
      while (endIdx < lines.length && lines[endIdx] !== '---') {
        endIdx++;
      }
      const blockContent = lines.slice(i, endIdx + 1).join('\n');
      blocks.push({
        type: BlockType.FRONTMATTER,
        content: blockContent,
        hash: hashContent(blockContent),
        startLine,
        endLine: endIdx,
      });
      i = endIdx + 1;
      continue;
    }

    // Import statements
    if (line.startsWith('import ')) {
      blocks.push({
        type: BlockType.IMPORT,
        content: line,
        hash: hashContent(line),
        startLine,
        endLine: i,
      });
      i++;
      continue;
    }

    // Code blocks (``` ... ```)
    if (line.startsWith('```')) {
      let endIdx = i + 1;
      while (endIdx < lines.length && !lines[endIdx].startsWith('```')) {
        endIdx++;
      }
      const blockContent = lines.slice(i, endIdx + 1).join('\n');
      blocks.push({
        type: BlockType.CODE_BLOCK,
        content: blockContent,
        hash: hashContent(blockContent),
        startLine,
        endLine: endIdx,
        // Code blocks should never be translated
        noTranslate: true,
      });
      i = endIdx + 1;
      continue;
    }

    // Admonitions (:::type ... :::)
    if (line.startsWith(':::')) {
      let endIdx = i + 1;
      let depth = 1;
      while (endIdx < lines.length && depth > 0) {
        if (lines[endIdx].startsWith(':::') && !lines[endIdx].match(/^:::\w/)) {
          depth--;
        } else if (lines[endIdx].match(/^:::\w/)) {
          depth++;
        }
        if (depth > 0) endIdx++;
      }
      const blockContent = lines.slice(i, endIdx + 1).join('\n');
      blocks.push({
        type: BlockType.ADMONITION,
        content: blockContent,
        hash: hashContent(blockContent),
        startLine,
        endLine: endIdx,
      });
      i = endIdx + 1;
      continue;
    }

    // HTML comments (<!-- ... -->)
    if (line.includes('<!--')) {
      let blockContent = line;
      let endIdx = i;
      if (!line.includes('-->')) {
        endIdx++;
        while (endIdx < lines.length && !lines[endIdx].includes('-->')) {
          endIdx++;
        }
        blockContent = lines.slice(i, endIdx + 1).join('\n');
      }
      blocks.push({
        type: BlockType.HTML_COMMENT,
        content: blockContent,
        hash: hashContent(blockContent),
        startLine,
        endLine: endIdx,
        noTranslate: true,
      });
      i = endIdx + 1;
      continue;
    }

    // JSX comments ({/* ... */})
    if (line.includes('{/*')) {
      let blockContent = line;
      let endIdx = i;
      if (!line.includes('*/}')) {
        endIdx++;
        while (endIdx < lines.length && !lines[endIdx].includes('*/}')) {
          endIdx++;
        }
        blockContent = lines.slice(i, endIdx + 1).join('\n');
      }
      blocks.push({
        type: BlockType.JSX_COMMENT,
        content: blockContent,
        hash: hashContent(blockContent),
        startLine,
        endLine: endIdx,
        noTranslate: true,
      });
      i = endIdx + 1;
      continue;
    }

    // JSX components (multi-line)
    if (line.match(/^<[A-Z]/) || line.match(/^\s*<[A-Z]/)) {
      // Check if it's a self-closing tag on one line
      if (line.includes('/>') || (line.includes('>') && line.includes('</'))) {
        blocks.push({
          type: BlockType.JSX,
          content: line,
          hash: hashContent(line),
          startLine,
          endLine: i,
        });
        i++;
        continue;
      }
      
      // Multi-line JSX - find closing tag
      const tagMatch = line.match(/<([A-Z][a-zA-Z]*)/);
      if (tagMatch) {
        const tagName = tagMatch[1];
        let endIdx = i + 1;
        let depth = 1;
        while (endIdx < lines.length && depth > 0) {
          const currentLine = lines[endIdx];
          // Count opening tags (not self-closing)
          const opens = (currentLine.match(new RegExp(`<${tagName}(?![a-zA-Z])`, 'g')) || []).length;
          const selfCloses = (currentLine.match(new RegExp(`<${tagName}[^>]*/>`,'g')) || []).length;
          const closes = (currentLine.match(new RegExp(`</${tagName}>`, 'g')) || []).length;
          depth += opens - selfCloses - closes;
          if (depth > 0) endIdx++;
        }
        const blockContent = lines.slice(i, endIdx + 1).join('\n');
        blocks.push({
          type: BlockType.JSX,
          content: blockContent,
          hash: hashContent(blockContent),
          startLine,
          endLine: endIdx,
        });
        i = endIdx + 1;
        continue;
      }
    }

    // Headings
    if (line.match(/^#{1,6}\s/)) {
      blocks.push({
        type: BlockType.HEADING,
        content: line,
        hash: hashContent(line),
        startLine,
        endLine: i,
      });
      i++;
      continue;
    }

    // Tables (consecutive lines with |)
    if (line.includes('|') && line.trim().startsWith('|')) {
      let endIdx = i;
      while (endIdx + 1 < lines.length && 
             lines[endIdx + 1].includes('|') && 
             lines[endIdx + 1].trim().startsWith('|')) {
        endIdx++;
      }
      const blockContent = lines.slice(i, endIdx + 1).join('\n');
      blocks.push({
        type: BlockType.TABLE,
        content: blockContent,
        hash: hashContent(blockContent),
        startLine,
        endLine: endIdx,
      });
      i = endIdx + 1;
      continue;
    }

    // Lists (consecutive list items, can be nested)
    if (line.match(/^(\s*)[-*+]\s/) || line.match(/^(\s*)\d+\.\s/)) {
      let endIdx = i;
      while (endIdx + 1 < lines.length) {
        const nextLine = lines[endIdx + 1];
        // Continue if it's a list item, indented content, or empty line within list
        const isListItem = nextLine.match(/^(\s*)[-*+]\s/) || nextLine.match(/^(\s*)\d+\.\s/);
        const isIndented = nextLine.match(/^\s{2,}\S/);
        const isEmpty = nextLine.trim() === '';
        const nextIsListItem = endIdx + 2 < lines.length && 
          (lines[endIdx + 2].match(/^(\s*)[-*+]\s/) || lines[endIdx + 2].match(/^(\s*)\d+\.\s/));
        
        if (isListItem || isIndented || (isEmpty && nextIsListItem)) {
          endIdx++;
        } else {
          break;
        }
      }
      const blockContent = lines.slice(i, endIdx + 1).join('\n');
      blocks.push({
        type: BlockType.LIST,
        content: blockContent,
        hash: hashContent(blockContent),
        startLine,
        endLine: endIdx,
      });
      i = endIdx + 1;
      continue;
    }

    // Empty lines
    if (line.trim() === '') {
      blocks.push({
        type: BlockType.EMPTY,
        content: line,
        hash: hashContent(line),
        startLine,
        endLine: i,
        noTranslate: true,
      });
      i++;
      continue;
    }

    // Paragraphs (consecutive non-empty, non-special lines)
    let endIdx = i;
    while (endIdx + 1 < lines.length) {
      const nextLine = lines[endIdx + 1];
      // Stop at empty line, heading, list, table, code block, admonition, JSX, import
      if (nextLine.trim() === '' ||
          nextLine.match(/^#{1,6}\s/) ||
          nextLine.match(/^[-*+]\s/) ||
          nextLine.match(/^\d+\.\s/) ||
          nextLine.startsWith('|') ||
          nextLine.startsWith('```') ||
          nextLine.startsWith(':::') ||
          nextLine.startsWith('import ') ||
          nextLine.match(/^<[A-Z]/) ||
          nextLine.includes('<!--') ||
          nextLine.includes('{/*')) {
        break;
      }
      endIdx++;
    }
    const blockContent = lines.slice(i, endIdx + 1).join('\n');
    blocks.push({
      type: BlockType.PARAGRAPH,
      content: blockContent,
      hash: hashContent(blockContent),
      startLine,
      endLine: endIdx,
    });
    i = endIdx + 1;
  }

  return blocks;
}

/**
 * Find blocks that have changed between source and existing translation
 * 
 * @param {Array} sourceBlocks - Blocks from current English source
 * @param {Array} existingBlocks - Blocks from existing translation
 * @returns {Array<{sourceBlock: object, existingBlock: object|null, index: number}>}
 */
function findChangedBlocks(sourceBlocks, existingBlocks) {
  const changes = [];
  
  // Create a map of existing blocks by position for comparison
  // We compare by position since block order should match
  for (let i = 0; i < sourceBlocks.length; i++) {
    const sourceBlock = sourceBlocks[i];
    const existingBlock = existingBlocks[i];
    
    // Skip blocks that shouldn't be translated
    if (sourceBlock.noTranslate) {
      continue;
    }
    
    // If no existing block at this position, it's new
    if (!existingBlock) {
      changes.push({
        sourceBlock,
        existingBlock: null,
        index: i,
        reason: 'new',
      });
      continue;
    }
    
    // If types differ, the structure changed significantly
    if (sourceBlock.type !== existingBlock.type) {
      changes.push({
        sourceBlock,
        existingBlock,
        index: i,
        reason: 'type_changed',
      });
      continue;
    }
    
    // For translatable blocks, compare the English source hash
    // The existing block will have different content (translated), 
    // so we need to track what English source it came from
    // For now, we use a simple heuristic: if the source content changed
    // (different hash), the translation needs updating
    if (sourceBlock.hash !== existingBlock.sourceHash) {
      // If existingBlock doesn't have sourceHash, it's from old system
      // In that case, we can't know if it changed, so we skip it
      // unless the block type is one where we can do fuzzy comparison
      if (!existingBlock.sourceHash) {
        // For imports and code blocks, compare directly
        if (sourceBlock.type === BlockType.IMPORT || 
            sourceBlock.type === BlockType.CODE_BLOCK) {
          if (sourceBlock.content !== existingBlock.content) {
            changes.push({
              sourceBlock,
              existingBlock,
              index: i,
              reason: 'content_changed',
            });
          }
        }
        // For other blocks, we can't tell if the English source changed
        // so we skip them (preserve existing translation)
        continue;
      }
      
      changes.push({
        sourceBlock,
        existingBlock,
        index: i,
        reason: 'source_changed',
      });
    }
  }
  
  // Check for blocks that were removed (existing has more blocks)
  if (existingBlocks.length > sourceBlocks.length) {
    for (let i = sourceBlocks.length; i < existingBlocks.length; i++) {
      changes.push({
        sourceBlock: null,
        existingBlock: existingBlocks[i],
        index: i,
        reason: 'removed',
      });
    }
  }
  
  return changes;
}

/**
 * Reconstruct document from blocks
 * 
 * @param {Array} blocks - Array of blocks
 * @returns {string} - Reconstructed document
 */
function blocksToContent(blocks) {
  return blocks.map(b => b.content).join('\n');
}

/**
 * Merge translated blocks back into document
 * 
 * @param {Array} existingBlocks - Existing translated blocks
 * @param {Array} newTranslations - Newly translated blocks with their indices
 * @param {Array} sourceBlocks - Original source blocks (for structure reference)
 * @returns {Array} - Merged blocks
 */
function mergeTranslations(existingBlocks, newTranslations, sourceBlocks) {
  // Start with source blocks as the template (for structure)
  const result = sourceBlocks.map((block, i) => {
    // Check if this block was newly translated
    const newTranslation = newTranslations.find(t => t.index === i);
    if (newTranslation) {
      return {
        ...newTranslation.translatedBlock,
        sourceHash: block.hash, // Track which English source this came from
      };
    }
    
    // Check if we have an existing translation for this position
    const existingBlock = existingBlocks[i];
    if (existingBlock && existingBlock.type === block.type) {
      // Keep existing translation
      return existingBlock;
    }
    
    // For noTranslate blocks, use source directly
    if (block.noTranslate) {
      return block;
    }
    
    // Fallback: use source (will need translation)
    return block;
  });
  
  return result;
}

module.exports = {
  BlockType,
  parseIntoBlocks,
  findChangedBlocks,
  blocksToContent,
  mergeTranslations,
  hashContent,
};

// CLI for testing
if (require.main === module) {
  const fs = require('fs');
  const path = require('path');
  
  const testFile = process.argv[2];
  if (!testFile) {
    console.log('Usage: node parse-mdx-blocks.js <file.mdx>');
    process.exit(1);
  }
  
  const content = fs.readFileSync(testFile, 'utf8');
  const blocks = parseIntoBlocks(content);
  
  console.log(`Parsed ${blocks.length} blocks:\n`);
  for (const block of blocks) {
    const preview = block.content.split('\n')[0].substring(0, 60);
    console.log(`[${block.type}] L${block.startLine + 1}-${block.endLine + 1} (${block.hash})`);
    console.log(`  ${preview}${preview.length >= 60 ? '...' : ''}`);
    if (block.noTranslate) console.log('  (no translate)');
    console.log();
  }
}
