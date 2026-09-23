function parseJsonUnits(text) {
  const units = [];
  for (const [key, value] of Object.entries(JSON.parse(text))) {
    const valueType = typeof value === 'string' ? 'string' : 'message';
    const source = valueType === 'string' ? value : value?.message;
    if (typeof source !== 'string' || source.length === 0) continue;
    const unit = { index: units.length, key, source, valueType };
    if (valueType === 'message' && value.description !== undefined) unit.description = value.description;
    units.push(unit);
  }
  return units;
}

function applyJsonTranslations(sourceText, translations) {
  const object = JSON.parse(sourceText);
  for (const unit of parseJsonUnits(sourceText)) {
    if (!translations.has(unit.index)) continue;
    if (unit.valueType === 'string') object[unit.key] = translations.get(unit.index);
    else object[unit.key].message = translations.get(unit.index);
  }
  return JSON.stringify(object, null, 2) + '\n';
}

module.exports = { parseJsonUnits, applyJsonTranslations };
