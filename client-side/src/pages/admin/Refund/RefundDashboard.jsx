import { useNavigate, Link } from "react-router-dom";
import { getAllRefunds } from "../../../api/refund.api";
import { useEffect, useState } from "react";

import laroco from "../../../assets/Development Team 2025/21.png";
import cat from "../../../assets/images/cat.gif";

const RefundDashboard = () => {
  const [refundData, setRefundData] = useState([]);

  const handleFetchRefundData = async () => {
    try {
      const result = await getAllRefunds();
     
      if (result) {
        setRefundData(result.data);
      } else {
        setRefundData([]);
      }
    } catch (error) {}
  };
  const formatMoney = (value) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  useEffect(() => {
    handleFetchRefundData();
  }, []);

  const totalRefunds = refundData.reduce((total, product) => {
    const productTotal = product.refunds.reduce(
      (sum, refund) => sum + refund.refund_price,
      0
    );

    return total + productTotal;
  }, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Statistics */}
      <div className="grid max-w-md grid-cols-2 gap-4">
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Total Refunds</p>
          <h2 className="text-2xl font-bold">₱ {formatMoney(totalRefunds)}</h2>
        </div>

        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Merchandise with Refunds</p>
          <h2 className="text-2xl font-bold">{refundData.length}</h2>
        </div>
      </div>

      {/* Merchandise Grid */}
      <div className="grid grid-cols-5 gap-4">
        {refundData ? (
          refundData.map((item) => (
            <div
              key={item.product_id}
              className="flex flex-col items-center rounded-xl bg-white p-4 text-center shadow"
            >
              <img
                src={item.imageUrl[0] ?? cat}
                alt={item.name}
                className="mb-3 h-20 w-20 rounded object-cover"
              />

              <h3 className="text-sm font-medium">{item.product_name}</h3>

              <p className="mt-1 text-sm text-gray-500">
                Refunds: {item.total_refunds}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Total ₱: {formatMoney(item.total_refund_amount)}
              </p>
              <Link to="/admin/refund/view" state={{ product: item }}>
                <button className="mt-3 rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600">
                  View
                </button>
              </Link>
            </div>
          ))
        ) : (
          <div> No data</div>
        )}
      </div>
    </div>
  );
};

export default RefundDashboard;
