/**
 * Tests for Toast components and hook
 */

import React from 'react'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { ToastContainer, useToast, type Toast } from '@/app/components/Toast'

function TestToaster() {
  const { ToastContainer: Container, success, error, info, warning, dismissToast } = useToast()
  return (
    <div>
      <button onClick={() => success('Saved!')}>success</button>
      <button onClick={() => error('Failed!', 1000)}>error</button>
      <button onClick={() => info('Heads up')}>info</button>
      <button onClick={() => warning('Be careful')}>warning</button>
      <Container />
      {/* expose dismiss to tests via data attribute by creating a toast and dismissing it */}
      <button onClick={() => dismissToast('non-existent')} data-testid="dismiss" />
    </div>
  )
}

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('ToastContainer renders nothing when empty', () => {
    const onDismiss = jest.fn()
    const { container } = render(<ToastContainer toasts={[]} onDismiss={onDismiss} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders toasts and auto-dismisses after duration', () => {
    const toasts: Toast[] = [{ id: 't1', variant: 'success', message: 'All good', duration: 1000 }]
    const onDismiss = jest.fn()
    render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />)

    expect(screen.getByRole('alert')).toHaveTextContent('All good')

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    // allow fade-out timeout (300ms) to trigger onDismiss
    act(() => {
      jest.advanceTimersByTime(300)
    })

    expect(onDismiss).toHaveBeenCalledWith('t1')
  })

  it('useToast hook adds and dismisses toasts', () => {
    render(<TestToaster />)

    fireEvent.click(screen.getByText('success'))
    expect(screen.getAllByRole('alert')[0]).toHaveTextContent('Saved!')

    fireEvent.click(screen.getByText('error'))
    expect(screen.getAllByRole('alert')[1]).toHaveTextContent('Failed!')

    // error duration defaults to 5000; fast-forward beyond both error(5000) and fade-out(300)
    act(() => {
      jest.advanceTimersByTime(5300)
    })

    // first toast (success) with default 4000 + 300 also gone by now
    expect(screen.queryByText('Failed!')).toBeNull()
    expect(screen.queryByText('Saved!')).toBeNull()
  })
})
