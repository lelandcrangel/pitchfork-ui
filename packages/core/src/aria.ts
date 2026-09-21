export const composeDescribedBy = (...ids: Array<string | false | null | undefined>) =>
  ids.filter(Boolean).join(' ') || undefined;
