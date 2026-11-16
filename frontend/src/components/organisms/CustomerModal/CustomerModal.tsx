import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

import styles from "./CustomerModal.module.css";
import { apiRequest, getErrorMessage } from "../../../services/api";
import { customerFormSchema, type CustomerFormValues } from "../../../validation/schemas";

export type Customer = {
  id: number;
  customer_name: string;
  dob: string;
  email: string;
  phone: string;
  location: string;
};

type CustomerModalProps = {
  customer?: Customer | null;
  onClose: () => void;
  onSaved: () => void;
};

const CustomerModal = ({ customer, onClose, onSaved }: CustomerModalProps) => {
  const isEditMode = Boolean(customer);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      customerName: customer?.customer_name ?? "",
      dob: customer?.dob?.split("T")[0] ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
      location: customer?.location ?? "",
    },
  });

  const onSubmit = async (values: CustomerFormValues) => {
    try {
      await apiRequest(isEditMode ? `/api/customers/${customer!.id}` : "/api/customers", {
        method: isEditMode ? "PUT" : "POST",
        body: values,
      });

      toast.success(isEditMode ? "Customer updated successfully" : "Customer added successfully");
      onSaved();
      onClose();
    } catch (error) {
      toast.error(
        getErrorMessage(error, isEditMode ? "Failed to update customer" : "Failed to add customer")
      );
    }
  };

  const field = (
    name: keyof CustomerFormValues,
    label: string,
    type: string,
    placeholder?: string
  ) => (
    <div className={styles.formGroup}>
      <label htmlFor={`customer-${name}`}>{label}</label>
      <input
        id={`customer-${name}`}
        type={type}
        placeholder={placeholder}
        aria-invalid={Boolean(errors[name])}
        {...register(name)}
      />
      {errors[name] && <p className={styles.error}>{errors[name]?.message}</p>}
    </div>
  );

  return (
    <div className={styles.overlay}>
      <form className={styles.modal} onSubmit={handleSubmit(onSubmit)} noValidate>
        <h2>{isEditMode ? "Edit Customer" : "Add Customer"}</h2>

        {field("customerName", "Customer Name", "text", "Enter customer name")}
        {field("dob", "Date of Birth", "date")}
        {field("email", "Email", "email", "Enter email")}
        {field("phone", "Phone Number", "tel", "Enter phone number")}
        {field("location", "Location", "text", "Enter location")}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>

          <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditMode ? "Update Customer" : "Save Customer"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerModal;
