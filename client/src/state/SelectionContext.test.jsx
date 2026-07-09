import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SelectionProvider, useSelection } from './SelectionContext.jsx';

function Harness() {
  const { selectedIds, toggleSelect, clearSelection, viewMode, setViewMode } = useSelection();
  return (
    <div>
      <p data-testid="selected">{[...selectedIds].join(',')}</p>
      <p data-testid="viewMode">{viewMode}</p>
      <button onClick={() => toggleSelect(1)}>toggle-1</button>
      <button onClick={() => toggleSelect(2)}>toggle-2</button>
      <button onClick={clearSelection}>clear</button>
      <button onClick={() => setViewMode('thumbnail')}>go-thumbnail</button>
    </div>
  );
}

function renderHarness() {
  render(
    <SelectionProvider>
      <Harness />
    </SelectionProvider>
  );
}

describe('SelectionContext', () => {
  it('starts with no selection and card view', () => {
    renderHarness();
    expect(screen.getByTestId('selected').textContent).toBe('');
    expect(screen.getByTestId('viewMode').textContent).toBe('card');
  });

  it('toggleSelect adds then removes the same id', () => {
    renderHarness();
    fireEvent.click(screen.getByText('toggle-1'));
    expect(screen.getByTestId('selected').textContent).toBe('1');

    fireEvent.click(screen.getByText('toggle-1'));
    expect(screen.getByTestId('selected').textContent).toBe('');
  });

  it('supports multiple simultaneous selections', () => {
    renderHarness();
    fireEvent.click(screen.getByText('toggle-1'));
    fireEvent.click(screen.getByText('toggle-2'));
    expect(screen.getByTestId('selected').textContent.split(',').sort()).toEqual(['1', '2']);
  });

  it('clearSelection empties the set without touching viewMode', () => {
    renderHarness();
    fireEvent.click(screen.getByText('toggle-1'));
    fireEvent.click(screen.getByText('go-thumbnail'));
    fireEvent.click(screen.getByText('clear'));

    expect(screen.getByTestId('selected').textContent).toBe('');
    expect(screen.getByTestId('viewMode').textContent).toBe('thumbnail');
  });

  it('throws a clear error when useSelection is used outside the provider', () => {
    // React logs the thrown render error to console.error; this is expected
    // here, so silence it to keep test output focused on real failures.
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Lonely() {
      useSelection();
      return null;
    }
    expect(() => render(<Lonely />)).toThrow('useSelection must be used within SelectionProvider');
    consoleSpy.mockRestore();
  });
});
