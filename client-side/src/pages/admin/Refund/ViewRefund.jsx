import { Link, useLocation } from "react-router-dom";
import { formattedDate } from "../../../components/tools/clientTools";

const ViewRefund = () => {
  const location = useLocation();
  const product = location.state?.product;
  console.log(product);

  return (
    <div className="space-y-6 p-6">
      <Link
        to="/admin/refund"
        className="flex w-fit items-center gap-2 text-gray-600 hover:text-black"
      >
        <i className="fas fa-arrow-left"></i>
        Back
      </Link>

      {/* Title */}
      <h1 className="text-2xl font-semibold">Refund Requests</h1>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Order Reference</th>
              <th className="p-3 text-left">Student</th>
              <th className="p-3 text-left">Student ID</th>
              <th className="p-3 text-left">Course</th>
              <th className="p-3 text-left">Total Refund</th>
              <th className="p-3 text-left">Admin Manage</th>
              <th className="p-3 text-left">Refund Date</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {product.refunds.map((refund) => (
              <tr key={refund._id} className="border-t hover:bg-gray-50">
                <td className="p-3">{refund.order_reference}</td>
                <td className="p-3">{refund.order_details.student_name}</td>
                <td className="p-3">{refund.order_details.id_number}</td>
                <td className="p-3">{refund.order_details.course}</td>
                <td className="p-3">{refund.refund_price}</td>
                <td className="p-3">{refund.order_details.admin_name}</td>

                <td className="p-3">{formattedDate(refund.refund_date)}</td>
                <td className="p-3">
                  <span
                    className={`rounded bg-green-100 px-2 py-1 text-xs text-green-700`}
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
