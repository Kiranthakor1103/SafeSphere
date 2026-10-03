import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { CustomButton } from './CustomButton';
import { Loader } from './Loader';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  itemName?: string;
  message?: string;
  loading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Item',
  itemName,
  message = 'Are you sure you want to delete this record? This action cannot be undone and will permanently remove it from the database.',
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => !loading && onClose()}>
      <div className="modal delete-confirm-modal" style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
        {loading && (
          <Loader
            variant="overlay"
            size="md"
            text="Deleting record..."
            subtext="Please wait while we update the database"
          />
        )}
        <div className="delete-modal-header">

          <div className="delete-warning-icon">
            <AlertTriangle size={24} color="#dc2626" />
          </div>
          <button className="btn-ghost btn btn-sm modal-close-btn" onClick={onClose} disabled={loading}>
            <X size={16} />
          </button>
        </div>

        <div className="delete-modal-body">
          <h3 className="delete-modal-title">{title}</h3>
          {itemName && (
            <div className="delete-item-pill">
              <Trash2 size={13} style={{ marginRight: 6 }} />
              <strong>{itemName}</strong>
            </div>
          )}
          <p className="delete-modal-message">{message}</p>
        </div>

        <div className="delete-modal-footer">
          <CustomButton variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </CustomButton>
          <CustomButton
            variant="danger"
            icon={<Trash2 size={14} />}
            loading={loading}
            onClick={onConfirm}
          >
            Delete Permanently
          </CustomButton>
        </div>
      </div>
    </div>
  );
};
