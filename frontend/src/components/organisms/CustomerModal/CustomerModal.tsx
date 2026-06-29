import { useState } from "react";
import { toast } from "react-toastify";

import styles from "./CustomerModal.module.css";
import { apiFetch } from "../../../services/api";

type Customer = {
  id: number;
  customer_name: string;
  dob: string;
  email: string;
  phone: string;
  location: string;
};

type CustomerModalProps = {
  onClose: () => void;
  customer?: Customer | null;
};

const CustomerModal = ({
  onClose,
  customer,
}: CustomerModalProps) => {
  const [customerName, setCustomerName] =
    useState(
      customer?.customer_name || ""
    );

  const [dob, setDob] =
    useState(
      customer?.dob?.split("T")[0] || ""
    );

  const [email, setEmail] =
    useState(customer?.email || "");

  const [phone, setPhone] =
    useState(customer?.phone || "");

  const [location, setLocation] =
    useState(customer?.location || "");

  const handleSave = async () => {
    try {
      const isEditMode =
        !!customer;

      const url = isEditMode
        ? `/api/customers/${customer?.id}`
        : "/api/customers";

      const method =
        isEditMode
          ? "PUT"
          : "POST";

      const response =
        await apiFetch(url, {
          method,
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            customerName,
            dob,
            email,
            phone,
            location,
          }),
        });

      if (!response.ok) {
        throw new Error(
          isEditMode
            ? "Failed to update customer"
            : "Failed to create customer"
        );
      }

      toast.success(
        isEditMode
          ? "Customer updated successfully"
          : "Customer added successfully"
      );

      onClose();
    } catch (error) {
      console.error(error);

      toast.error(
        customer
          ? "Failed to update customer"
          : "Failed to add customer"
      );
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>
          {customer
            ? "Edit Customer"
            : "Add Customer"}
        </h2>

        <div className={styles.formGroup}>
          <label>Customer Name</label>

          <input
            type="text"
            placeholder="Enter customer name"
            value={customerName}
            onChange={(e) =>
              setCustomerName(
                e.target.value
              )
            }
          />
        </div>

        <div className={styles.formGroup}>
          <label>Date of Birth</label>

          <input
            type="date"
            value={dob}
            onChange={(e) =>
              setDob(e.target.value)
            }
          />
        </div>

        <div className={styles.formGroup}>
          <label>Email</label>

          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
          />
        </div>

        <div className={styles.formGroup}>
          <label>Phone Number</label>

          <input
            type="text"
            placeholder="Enter phone number"
            value={phone}
            onChange={(e) =>
              setPhone(
                e.target.value
              )
            }
          />
        </div>

        <div className={styles.formGroup}>
          <label>Location</label>

          <input
            type="text"
            placeholder="Enter location"
            value={location}
            onChange={(e) =>
              setLocation(
                e.target.value
              )
            }
          />
        </div>

        <div className={styles.actions}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className={styles.saveBtn}
            onClick={handleSave}
          >
            {customer
              ? "Update Customer"
              : "Save Customer"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;
