export function getTransactionSelectionState(ids: readonly string[], selected: ReadonlySet<string>) {
  const count = ids.filter(id => selected.has(id)).length;
  return { allSelected: ids.length > 0 && count === ids.length, partiallySelected: count > 0 && count < ids.length };
}

export function toggleTransactionSelection(selected: ReadonlySet<string>, id: string) {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id); else next.add(id);
  return next;
}

export function toggleAllTransactionSelection(ids: readonly string[], selected: ReadonlySet<string>) {
  return getTransactionSelectionState(ids, selected).allSelected ? new Set<string>() : new Set(ids);
}
