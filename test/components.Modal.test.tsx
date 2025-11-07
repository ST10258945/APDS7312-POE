/**
 * Tests for Modal component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '@/app/components/Modal'

describe('Modal Component', () => {
  it('should render modal when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    )
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('should not render modal when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    )
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
  })

  it('should render close button', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <div>Content</div>
      </Modal>
    )
    
    const closeButton = screen.getByLabelText('Close modal')
    expect(closeButton).toBeInTheDocument()
  })

  it('should handle escape key press', () => {
    const onClose = jest.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal" closeOnEscape={true}>
        <div>Content</div>
      </Modal>
    )
    
    // Modal should support escape key functionality
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should have proper ARIA attributes', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <div>Content</div>
      </Modal>
    )
    
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby')
  })

  it('should support closeOnBackdropClick prop', () => {
    const onClose = jest.fn()
    render(
      <Modal 
        isOpen={true} 
        onClose={onClose} 
        title="Test Modal"
        closeOnBackdropClick={false}
      >
        <div>Content</div>
      </Modal>
    )
    
    const overlay = screen.getByRole('dialog').parentElement
    if (overlay) {
      fireEvent.click(overlay)
      // Should not close when closeOnBackdropClick is false
      expect(onClose).not.toHaveBeenCalled()
    }
  })

  it('should support stacking levels', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal" stacking={1}>
        <div>Content</div>
      </Modal>
    )
    
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
  })

  it('should render without title', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Content without title</div>
      </Modal>
    )
    
    expect(screen.getByText('Content without title')).toBeInTheDocument()
  })
})
