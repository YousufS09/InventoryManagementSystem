import styles from "./DeleteConfirmationModal.module.css";

type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
};

const DeleteConfirmationModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onClose,
}: Props) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>{title}</h2>

        <p>{message}</p>

        <div className={styles.actions}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className={styles.deleteBtn}
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;