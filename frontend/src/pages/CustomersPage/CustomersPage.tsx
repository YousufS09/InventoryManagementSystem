import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CustomersPage.module.css";
import CustomerModal, { type Customer } from "../../components/organisms/CustomerModal/CustomerModal";
import CrudActions from "../../components/molecules/CrudActions/CrudActions";
import MainLayout from "../../layouts/MainLayout";
import { apiRequest, getErrorMessage } from "../../services/api";

const CustomersPage = () => {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Bumping this number re-runs the fetch effect (after a create, update or delete).
  const [reloadKey, setReloadKey] = useState(0);
  const fetchCustomers = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;

    apiRequest<Customer[]>("/api/customers")
      .then((data) => {
        if (cancelled) return;
        setCustomers(data);
        setLoadError(null);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(getErrorMessage(error, "Failed to load customers."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const renderBody = () => {
    if (loading) {
      return <p className={styles.emptyMessage}>Loading customers...</p>;
    }
    if (loadError) {
      return <p className={styles.emptyMessage}>{loadError}</p>;
    }
    if (customers.length === 0) {
      return <p className={styles.emptyMessage}>No customers found yet.</p>;
    }

    return (
      <table className={styles.customersTable}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>DOB</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Location</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.id}</td>
              <td>{customer.customer_name}</td>
              <td>{customer.dob}</td>
              <td>{customer.email}</td>
              <td>{customer.phone}</td>
              <td>{customer.location}</td>
              <td>
                <CrudActions
                  id={customer.id}
                  endpoint="customers"
                  refreshData={fetchCustomers}
                  deleteMessage={`Delete "${customer.customer_name}"? All products linked to this customer will also be deleted. This cannot be undone.`}
                  onEdit={() => {
                    setSelectedCustomer(customer);
                    setShowModal(true);
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Customers</h1>
            <p className={styles.subtitle}>Manage customer information</p>
          </div>

          <button
            className={styles.addButton}
            onClick={() => {
              setSelectedCustomer(null);
              setShowModal(true);
            }}
          >
            + Add Customer
          </button>
        </div>

        <div className={styles.voiceHint}>
          <div>
            <div className={styles.voiceHintTitle}>Voice control available</div>
            <p className={styles.voiceHintText}>
              Speak commands like "Create customer Raj born on 2005-03-09" or "Update customer Raj location to Chennai" in the AI Assistant.
            </p>
          </div>

          <button
            type="button"
            className={styles.voiceHintButton}
            onClick={() => navigate("/assistant")}
          >
            Open Voice Assistant
          </button>
        </div>

        <div className={styles.tableContainer}>{renderBody()}</div>

        {showModal && (
          <CustomerModal
            customer={selectedCustomer}
            onSaved={fetchCustomers}
            onClose={() => {
              setShowModal(false);
              setSelectedCustomer(null);
            }}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default CustomersPage;
