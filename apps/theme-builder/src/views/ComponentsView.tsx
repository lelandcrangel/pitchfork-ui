import './ComponentsView.css';

export function ComponentsView() {
  return (
    <div className="components-view">
      <div className="components-view__empty">
        <p className="components-view__title">Component Variables</p>
        <p className="components-view__sub">
          Select a component to view and edit its <code>--pf-*</code> CSS variables.
        </p>
        <p className="components-view__coming">Coming soon</p>
      </div>
    </div>
  );
}
