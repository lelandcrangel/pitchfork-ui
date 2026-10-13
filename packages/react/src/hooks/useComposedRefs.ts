/** @deprecated `@pitchfork-ui/react` is deprecated. Plain React ref merging. There is no framework-free half to move to, and no element replaces it. */
export function useComposedRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    refs.forEach((ref) => {
      if (!ref) {
        return;
      }

      if (typeof ref === 'function') {
        ref(node);
        return;
      }

      ref.current = node;
    });
  };
}
