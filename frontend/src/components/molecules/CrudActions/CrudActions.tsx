import { useState } from "react";

import styles from "./CrudActions.module.css";

import {
  deleteItem,
} from "../../../services/crudService";

import DeleteConfirmationModal from "../DeleteConfirmationModal/DeleteConfirmationModal";

type Props = {
  id: number;
  endpoint: string;
  refreshData: () => void;
  onEdit: () => void;
};

const CrudActions = ({
  id,
  endpoint,
  refreshData,
  onEdit,
}: Props) => {
  const [
    showDeleteModal,
    setShowDeleteModal,
  ] = useState(false);

  const handleDelete =
    async () => {
      const deleted =
        await deleteItem(
          endpoint,
          id
        );

      if (deleted) {
        refreshData();
      }

      setShowDeleteModal(false);
    };

  return (
    <>
      <div
        className={
          styles.actions
        }
      >
        <button
          className={
            styles.editBtn
          }
          onClick={onEdit}
        >
          Edit
        </button>

        <button
          className={
            styles.deleteBtn
          }
          onClick={() =>
            setShowDeleteModal(true)
          }
        >
          Delete
        </button>
      </div>

      <DeleteConfirmationModal
        isOpen={
          showDeleteModal
        }
        title="Delete Record"
        message="Are you sure you want to delete this record? This action cannot be undone."
        onConfirm={
          handleDelete
        }
        onClose={() =>
          setShowDeleteModal(false)
        }
      />
    </>
  );
};

export default CrudActions;