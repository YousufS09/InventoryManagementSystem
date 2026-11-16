import { toast } from "react-toastify";
import { apiRequest, getErrorMessage } from "./api";

export const deleteItem = async (endpoint: string, id: number) => {
  try {
    await apiRequest(`/api/${endpoint}/${id}`, { method: "DELETE" });
    toast.success("Record deleted successfully");
    return true;
  } catch (error) {
    toast.error(getErrorMessage(error, "Delete failed"));
    return false;
  }
};
