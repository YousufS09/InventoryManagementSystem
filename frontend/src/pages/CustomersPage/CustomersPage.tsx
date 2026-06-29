import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CustomersPage.module.css";
import CustomerModal from "../../components/organisms/CustomerModal/CustomerModal";
import CrudActions from "../../components/molecules/CrudActions/CrudActions";
import MainLayout from "../../layouts/MainLayout";
import { apiFetch } from "../../services/api";

type Customer = {
  id: number;
  customer_name: string;
  dob: string;
  email: string;
  phone: string;
  location: string;
};

const CustomersPage = () => {
  const [showModal, setShowModal] =
    useState(false);
  const navigate = useNavigate();

  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState<Customer | null>(
    null
  );

  const fetchCustomers =
    async () => {
      try {
        const response =
          await apiFetch(
            "/api/customers"
          );

        const data =
          await response.json();

        setCustomers(data);
      } catch (error) {
        console.error(error);
      }
    };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
  <MainLayout>
    <div className={styles.container}>
      {/* Header */}

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Customers
          </h1>

          <p className={styles.subtitle}>
            Manage customer information
          </p>
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
          <div className={styles.voiceHintTitle}>
            Voice control available
          </div>

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

      {/* Table */}

      <div
        className={styles.tableContainer}
      >
        {customers.length === 0 ? (
          <p
            className={
              styles.emptyMessage
            }
          >
            No customers found yet.
          </p>
        ) : (
          <table
            className={
              styles.customersTable
            }
          >
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
              {customers.map(
                (customer) => (
                  <tr
                    key={
                      customer.id
                    }
                  >
                    <td>
                      {
                        customer.id
                      }
                    </td>

                    <td>
                      {
                        customer.customer_name
                      }
                    </td>

                    <td>
                      {
                        customer.dob
                      }
                    </td>

                    <td>
                      {
                        customer.email
                      }
                    </td>

                    <td>
                      {
                        customer.phone
                      }
                    </td>

                    <td>
                      {
                        customer.location
                      }
                    </td>

                    <td>
                      <CrudActions
                        id={
                          customer.id
                        }
                        endpoint="customers"
                        refreshData={
                          fetchCustomers
                        }
                        onEdit={() => {
                          setSelectedCustomer(
                            customer
                          );

                          setShowModal(
                            true
                          );
                        }}
                      />
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}

      {showModal && (
        <CustomerModal
          customer={
            selectedCustomer
          }
          onClose={() => {
            setShowModal(false);

            setSelectedCustomer(
              null
            );

            fetchCustomers();
          }}
        />
      )}
    </div>
  </MainLayout>
);
};

export default CustomersPage;
