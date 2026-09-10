export type CaseReferenceType = 'network' | 'cost' | 'change';

const PREFIX_BY_TYPE: Record<CaseReferenceType, string> = {
  network: 'INC',
  cost: 'CST',
  change: 'CHG',
};

function stableNumber(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return String((hash >>> 0) % 100000000).padStart(8, '0');
}

export function getCaseReference(
  sourceId: string,
  type: CaseReferenceType
): string {
  return `${PREFIX_BY_TYPE[type]}${stableNumber(sourceId)}`;
}

export function getEvidenceReference(sourceId: string): string {
  return `EVD${stableNumber(sourceId)}`;
}
