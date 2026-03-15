import { useNavigate, Link } from "react-router-dom";


const RefundDashboard = () => {
  const navigate = useNavigate();

  const merchRefunds = [
    {
      id: 1,
      name: "School Hoodie",
      refunds: 12,
      image: "https://via.placeholder.com/150",
    },
    {
      id: 2,
      name: "University Shirt",
      refunds: 8,
      image: "https://via.placeholder.com/150",
    },
    {
      id: 3,
      name: "School Cap",
      refunds: 5,
      image: "https://via.placeholder.com/150",
    },
    {
      id: 4,
      name: "Lanyard",
      refunds: 3,
      image: "https://via.placeholder.com/150",
    },
    {
      id: 5,
      name: "Notebook",
      refunds: 7,
      image: "https://via.placeholder.com/150",
    },
    {
      id: 6,
      name: "Backpack",
      refunds: 9,
      image: "https://via.placeholder.com/150",
    },
  ];

  const totalRefunds = merchRefunds.reduce((sum, item) => sum + item.refunds, 0);

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
          <h2 className="text-2xl font-bold">{merchRefunds.length}</h2>
        </div>
      </div>

      {/* Merchandise Grid */}
      <div className="grid grid-cols-5 gap-4">
        {merchRefunds.map((item) => (
          <div
            key={item.id}
            className="bg-white shadow rounded-xl p-4 flex flex-col items-center text-center"
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-20 h-20 object-cover mb-3 rounded"
            />

            <h3 className="text-sm font-medium">{item.name}</h3>

            <p className="text-gray-500 text-sm mt-1">
              Refunds: {item.refunds}
            </p>
                <Link to={`/admin/refund/view/${item.id}`}>
            <button
             
              className="mt-3 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              View
                    </button>
                    </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RefundDashboard;