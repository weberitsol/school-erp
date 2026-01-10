'use client';

import { useState, useEffect } from 'react';
import { FileText, Download } from 'lucide-react';
import { messBillService, MessBill } from '@/services/mess/mess-bill.service';

export default function StudentBillingPage() {
  const [bills, setBills] = useState<MessBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBill, setSelectedBill] = useState<MessBill | null>(null);

  const fetchBills = async () => {
    try {
      setLoading(true);
      // In a real app, we would get the current student ID from auth context
      // For now, we'll show a message
      const response = await messBillService.getBills();
      setBills(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleDownloadBill = (bill: MessBill) => {
    // In a real implementation, this would generate a PDF
    alert(`Downloading bill ${bill.id}...`);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Mess Bills</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading bills...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bills List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-xl font-bold">Billing History</h2>
              </div>
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Month</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr
                      key={bill.id}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedBill(bill)}
                    >
                      <td className="px-4 py-3">
                        {messBillService.getMonthName(bill.billingMonth)} {bill.billingYear}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        {messBillService.formatCurrency(bill.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded text-sm ${messBillService.getStatusColor(bill.status)}`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadBill(bill);
                          }}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Download size={16} />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bill Details */}
          {selectedBill && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-6">Bill Details</h2>

              <div className="space-y-4">
                <div>
                  <div className="text-gray-600 text-sm">Month</div>
                  <div className="text-lg font-semibold">
                    {messBillService.getMonthName(selectedBill.billingMonth)}{' '}
                    {selectedBill.billingYear}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-gray-600 text-sm mb-2">Cost Breakdown</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Meal Plan Cost</span>
                      <span>
                        {messBillService.formatCurrency(selectedBill.baseMealPlanCost)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Additional Charges</span>
                      <span>
                        {messBillService.formatCurrency(selectedBill.additionalCharges)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount</span>
                      <span className="text-green-600">
                        -{messBillService.formatCurrency(selectedBill.discount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Amount</span>
                    <span>{messBillService.formatCurrency(selectedBill.totalAmount)}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-gray-600 text-sm mb-2">Payment Status</div>
                  <div>
                    <span className={`px-4 py-2 rounded ${messBillService.getStatusColor(selectedBill.status)}`}>
                      {selectedBill.status}
                    </span>
                  </div>
                  {selectedBill.paidAmount && (
                    <div className="mt-4 text-sm">
                      <div className="flex justify-between">
                        <span>Paid Amount</span>
                        <span>
                          {messBillService.formatCurrency(selectedBill.paidAmount)}
                        </span>
                      </div>
                      {selectedBill.status !== 'PAID' && (
                        <div className="flex justify-between text-red-600">
                          <span>Outstanding</span>
                          <span>
                            {messBillService.formatCurrency(
                              selectedBill.totalAmount - selectedBill.paidAmount
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDownloadBill(selectedBill)}
                  className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Download Bill
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
