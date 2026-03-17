import { useNavigate, Link } from "react-router-dom";
import { getAllRefunds } from "../../../api/refund.api";
import { useEffect, useState } from "react";

import laroco from "../../../assets/Development Team 2025/21.png";

const RefundDashboard = () => {
    const [refundData, setRefundData] = useState([]);

    const handleFetchRefundData = async () => {
        try {
            const result = await getAllRefunds();
           
            if(result){
            setRefundData(result.data);
            }
            else{
                setRefundData([]);
            }
        } catch (error) {
           
        }
    }

    useEffect(() => {
        handleFetchRefundData();
    },[])



  const totalRefunds = refundData.reduce((total, product) => {
  const productTotal = product.refunds.reduce(
    (sum, refund) => sum + refund.refund_price,
    0
  );

  return total + productTotal;
  }, 0);
    
  


  return (
    <div className="p-6 space-y-6">

    

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="bg-white shadow rounded-xl p-4">
          <p className="text-gray-500 text-sm">Total Refunds</p>
          <h2 className="text-2xl font-bold">{totalRefunds}</h2>
        </div>

        <div className="bg-white shadow rounded-xl p-4">
          <p className="text-gray-500 text-sm">Merchandise with Refunds</p>
          <h2 className="text-2xl font-bold">{refundData.length}</h2>
        </div>
      </div>

      {/* Merchandise Grid */}
      <div className="grid grid-cols-5 gap-4">
        {refundData ? refundData.map((item) => (
          <div
            key={item.product_id}
            className="bg-white shadow rounded-xl p-4 flex flex-col items-center text-center"
          >
            <img
              src={laroco}
              alt={item.name}
              className="w-20 h-20 object-cover mb-3 rounded"
            />

            <h3 className="text-sm font-medium">{item.product_name}</h3>

            <p className="text-gray-500 text-sm mt-1">
                    Refunds: {item.total_refunds}
                    
                </p>
                <p className="text-gray-500 text-sm mt-1">
                    Total ₱: {item.total_refund_amount}
                    
            </p>
                     <Link
  to="/admin/refund/view"
  state={{ product: item }}
>
  <button className="mt-3 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
    View
  </button>
</Link>
          </div>
        )): (<div> No data</div>)}
      </div>
    </div>
  );
};

export default RefundDashboard;
