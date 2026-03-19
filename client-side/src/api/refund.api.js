import "../App.css";
import backendConnection from "./backendApi";
import axios from "axios";
import { showToast } from "../utils/alertHelper";
const token = sessionStorage.getItem("Token");


export const refund = async (order_id) => {
  try {
    const response = await axios.post(
      `${backendConnection()}/api/orders/refund`,
        {order_id},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

      if (response.status === 200) {
          showToast("success", response.data.message);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    if (error.response && error.response.data) {
      showToast("error", error.response.data.message || "An error occurred");
    } else {
      showToast("error", "An error occurred");
    }
    console.error("Error:", error);
  }
};

export const getAllRefunds = async () => {
  try {
    const response = await axios.get(`${backendConnection()}/api/orders/get-refund`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status === 200) {
      return response.data;
    } 
  } catch (error) {
    if (error.response && error.response.data) {
      return false;
    } else {
      console.log("error", "An error occurred");
      return false;
    }
  }
};