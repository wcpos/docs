/* global describe, expect, it */
const fs = require('node:fs');
const path = require('node:path');
const { BlockType, parseIntoBlocks } = require('../parse-mdx-blocks');

const projectRoot = path.join(__dirname, '..', '..');

function readBlocks(relativePath) {
  return parseIntoBlocks(
    fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
  );
}

function sectionBlocks(blocks, heading) {
  const start = blocks.findIndex(
    (block) => block.type === BlockType.HEADING && block.content === heading
  );
  const end = blocks.findIndex(
    (block, index) =>
      index > start &&
      block.type === BlockType.HEADING &&
      block.content.startsWith('## ')
  );

  expect(start).toBeGreaterThanOrEqual(0);
  return blocks.slice(start + 1, end === -1 ? undefined : end);
}

function paragraphStarting(blocks, prefix) {
  return blocks.find(
    (block) =>
      block.type === BlockType.PARAGRAPH && block.content.startsWith(prefix)
  )?.content;
}

describe('multi-role access guidance', () => {
  const accessBlocks = sectionBlocks(
    readBlocks('versioned_docs/version-1.x/settings/wp-admin/access.mdx'),
    '## A user with more than one role {#more-than-one-role}'
  );

  it('identifies WCPOS as the plugin whose behavior changed', () => {
    expect(paragraphStarting(accessBlocks, 'What you see depends')).toBe(
      'What you see depends on the WCPOS version. Current WCPOS versions refuse the POS sign-in and name what is missing:'
    );
  });

  it('presents the verbatim message as an account-specific example', () => {
    const example = paragraphStarting(accessBlocks, 'For example');
    const quote = paragraphStarting(accessBlocks, '> This account');

    expect(example).toBe(
      'For example, an Administrator-plus-Customer account with the denies above sees:'
    );
    expect(quote).toBe(
      '> This account cannot use the POS. Missing capabilities: publish_shop_orders, read_private_products, read_private_shop_orders, list_users. It has the roles Customer, Administrator. A capability denied on one role can override a grant from another, and role-editor plugins such as Members apply that deny first. Remove the extra role or clear the deny in the role editor.'
    );
  });

  it('only asks users with an existing POS session to sign out', () => {
    const accessRecovery = paragraphStarting(
      accessBlocks,
      '**For the site administrator:**'
    );
    const authRecovery = paragraphStarting(
      readBlocks('versioned_docs/version-1.x/error-codes/AUTH201.mdx'),
      '**Back at the till:**'
    );

    expect(accessRecovery).toMatch(
      /a user with an existing POS session signs out and back in; a user who was refused at sign-in simply signs in again\.$/
    );
    expect(authRecovery).toBe(
      '**Back at the till:** once the role is corrected, sign out and back in if a POS session is still open; otherwise, sign in again. Then retry the refused action.'
    );
  });
});
