import { toast } from "react-toastify";
import { apiFetch } from "./api";

export const deleteItem = async (
  endpoint: string,
  id: number
) => {
  try {
    const response =
      await apiFetch(
        `/api/${endpoint}/${id}`,
        {
          method: "DELETE",
        }
      );

    if (!response.ok) {
      throw new Error(
        "Delete failed"
      );
    }

    toast.success(
      "Record deleted successfully" 
    );

    return true;
  } catch (error) {
    console.error(error);

    toast.error(
      "Delete failed"
    );

    return false;
  }
};
