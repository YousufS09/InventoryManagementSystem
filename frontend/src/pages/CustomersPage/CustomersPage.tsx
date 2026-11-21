import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CustomersPage.module.css";
import CustomerModal, { type Customer } from "../../components/organisms/CustomerModal/CustomerModal";
import CrudActions from "../../components/molecules/CrudActions/CrudActions";
import {
  Pagination,
  SortableHeader,
  TableToolbar,
} from "../../components/molecules/TableControls/TableControls";
import MainLayout from "../../layouts/MainLayout";
import { usePagedList } from "../../hooks/usePagedList";

const COLUMNS: { key: string; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "customer_name", label: "Name" },
  { key: "dob", label: "DOB" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "location", label: "Location" },
];

const CustomersPage = () => {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const list = usePagedList<Customer>("/api/customers");

  const renderBody = () => {
    if (list.loading) {
      return <p className={styles.emptyMessage}>Loading customers...</p>;
    }
    if (list.error) {
      return <p className={styles.emptyMessage}>{list.error}</p>;
    }
    if (list.items.length === 0) {
      return (
        <p className={styles.emptyMessage}>
          {list.activeSearch ? `No customers match "${list.activeSearch}".` : "No customers found yet."}
        </p>
      );
    }

    return (
      <table className={styles.customersTable}>
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <SortableHeader
                key={column.key}
                column={column.key}
                sort={list.sort}
                order={list.order}
                onSort={list.toggleSort}
              >
                {column.label}
              </SortableHeader>
            ))}
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {list.items.map((customer) => (
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
                  refreshData={list.reload}
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

        <div className={styles.tableContainer}>
          <TableToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            placeholder="Search name, email, phone or location"
            pageSize={list.pageSize}
            onPageSizeChange={list.setPageSize}
          />
          {renderBody()}
          {!list.loading && !list.error && (
            <Pagination
              page={list.page}
              pageSize={list.pageSize}
              total={list.total}
              onPageChange={list.setPage}
            />
          )}
        </div>

        {showModal && (
          <CustomerModal
            customer={selectedCustomer}
            onSaved={list.reload}
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
