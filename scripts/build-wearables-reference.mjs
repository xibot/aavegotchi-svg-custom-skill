import fs from 'node:fs';
import path from 'node:path';

const sourcePath = process.argv[2] || '/tmp/aavegotchi-contracts/data/itemTypes/itemTypes.ts';
const outputPath = process.argv[3] || path.resolve('references/wearables.tsv');

const text = fs.readFileSync(sourcePath, 'utf8');
const marker = 'export const itemTypes';
const start = text.indexOf(marker);
if (start === -1) {
  throw new Error(`Could not find itemTypes array in ${sourcePath}`);
}
const arrStart = text.indexOf('[', start);
const arrEnd = text.lastIndexOf('];');
if (arrStart === -1 || arrEnd === -1) {
  throw new Error(`Could not isolate itemTypes array in ${sourcePath}`);
}
const arrText = text.slice(arrStart, arrEnd + 1);
const itemTypes = Function(`return (${arrText})`)();
const lines = ['id\tslot\tmax_quantity\trarity_score_modifier\ttrait_modifiers\tname'];

function calculateRarityScoreModifier(maxQuantity) {
  if (maxQuantity >= 1000) return 1;
  if (maxQuantity >= 500) return 2;
  if (maxQuantity >= 250) return 5;
  if (maxQuantity >= 100) return 10;
  if (maxQuantity >= 10) return 20;
  if (maxQuantity >= 1) return 50;
  return 0;
}

for (const [id, item] of itemTypes.entries()) {
  const slot = item.slotPositions || 'none';
  const name = String(item.name || '').replace(/\t/g, ' ').trim();
  const maxQuantity = Number(item.maxQuantity || 0);
  const rarityScoreModifier = Number(item.rarityScoreModifier || calculateRarityScoreModifier(maxQuantity));
  const traitModifiers = Array.isArray(item.traitModifiers)
    ? item.traitModifiers.map((value) => Number(value || 0)).join(',')
    : '0,0,0,0,0,0';
  lines.push(`${id}\t${slot}\t${maxQuantity}\t${rarityScoreModifier}\t${traitModifiers}\t${name}`);
}
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${lines.join('\n')}\n`);
console.log(`Wrote ${outputPath}`);
