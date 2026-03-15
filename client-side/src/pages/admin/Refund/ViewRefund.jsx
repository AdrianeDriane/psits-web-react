import { Link } from "react-router-dom";

const ViewRefund = () => {
  const refundRequests = [
    {
      id: 1,
      student: "John Doe",
      studentId: "2023-001",
      item: "School Hoodie",
      reason: "Wrong size",
      date: "2026-03-10",
      status: "Pending",
    },
    {
      id: 2,
      student: "Maria Santos",
      studentId: "2023-015",
      item: "School Hoodie",
      reason: "Defective item",
      date: "2026-03-11",
      status: "Approved",
    },
    {
      id: 3,
      student: "Carlos Reyes",
      studentId: "2023-022",
      item: "School Hoodie",
      reason: "Ordered by mistake",
      date: "2026-03-12",
      status: "Pending",
    },
  ];

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
              <th className="text-left p-3">Item</th>
              <th className="text-left p-3">Reason</th>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {refundRequests.map((refund) => (
              <tr key={refund.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{refund.student}</td>
                <td className="p-3">{refund.studentId}</td>
                <td className="p-3">{refund.item}</td>
                <td className="p-3">{refund.reason}</td>
                <td className="p-3">{refund.date}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      refund.status === "Approved"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {refund.status}
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