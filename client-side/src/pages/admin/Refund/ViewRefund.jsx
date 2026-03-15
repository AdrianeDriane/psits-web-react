import { Link, useLocation } from "react-router-dom";
import { formattedDate } from "../../../components/tools/clientTools";

const ViewRefund = () => {
    const location = useLocation();
    const product = location.state?.product;
    console.log(product);
  

  return (
    <div className="p-6 space-y-6">

    
      <Link
        to="/admin/refund"
        className="flex items-center gap-2 text-gray-600 hover:text-black w-fit"
      >
        <i className="fas fa-arrow-left"></i>
        Back
      </Link>

      {/* Title */}
      <h1 className="text-2xl font-semibold">Refund Requests</h1>

      {/* Table */}
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <table className="w-full text-sm">

          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3">Student</th>
              <th className="text-left p-3">Student ID</th>
                          <th className="text-left p-3">Course</th>
                           <th className="text-left p-3">Total Refund</th>
              <th className="text-left p-3">Admin Manage</th>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {product.refunds.map((refund) => (
              <tr key={refund._id} className="border-t hover:bg-gray-50">
                <td className="p-3">{refund.order_details.student_name}</td>
                    <td className="p-3">{refund.order_details.id_number}</td>
                    <td className="p-3">{refund.order_details.course}</td>
                      <td className="p-3">{refund.refund_price}</td>
                <td className="p-3">{refund.order_details.admin_name}</td>
             
                <td className="p-3">{formattedDate(refund.refund_date)}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 text-xs rounded 
                        bg-green-100 text-green-700`
                       
                    }
                  >
                    Refunded
                  </span>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
};

export default ViewRefund;