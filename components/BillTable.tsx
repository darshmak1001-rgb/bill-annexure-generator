import React, { useState, useEffect } from 'react';
import { Bill } from '../types';

interface BillTableProps {
  bills: Bill[];
  onUpdateBill: (id: string, updatedData: Omit<Bill, 'id'>) => void;
  onDeleteBill: (id: string) => void;
  onAddBill: (newBill: Omit<Bill, 'id'>) => void;
}

const BillTable: React.FC<BillTableProps> = ({ bills, onUpdateBill, onDeleteBill, onAddBill }) => {
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Omit<Bill, 'id'>>({
    billerName: '',
    billNumber: '',
    billDate: '',
    billAmount: 0,
  });
  const [newBillData, setNewBillData] = useState<Omit<Bill, 'id'>>({
    billerName: '',
    billNumber: '',
    billDate: '',
    billAmount: 0,
  });

  useEffect(() => {
    if (editingRowId && !bills.some(b => b.id === editingRowId)) {
      setEditingRowId(null);
    }
  }, [bills, editingRowId]);

  const handleEditClick = (bill: Bill) => {
    setEditingRowId(bill.id);
    const { id, ...dataToEdit } = bill;
    setEditedData(dataToEdit);
  };

  const handleCancelClick = () => {
    setEditingRowId(null);
  };

  const handleSaveClick = () => {
    if (editingRowId) {
      onUpdateBill(editingRowId, editedData);
      setEditingRowId(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: name === 'billAmount' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleNewBillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewBillData(prev => ({
      ...prev,
      [name]: name === 'billAmount' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleAddBillClick = () => {
    if (newBillData.billerName && newBillData.billDate && newBillData.billAmount) {
      onAddBill(newBillData);
      setNewBillData({
        billerName: '',
        billNumber: '',
        billDate: '',
        billAmount: 0,
      });
    } else {
      alert('Please provide at least a Biller Name, Bill Date, and Bill Amount.');
    }
  };

  const totalAmount = bills.reduce((sum, bill) => sum + (bill.billAmount || 0), 0);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const inputClasses = "w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm";

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
              Sr. No.
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Biller Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Bill Number
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Bill Date
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Bill Amount
            </th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {bills.map((bill, index) =>
            editingRowId === bill.id ? (
              // EDITING ROW
              <tr key={bill.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{index + 1}</td>
                <td className="px-6 py-2"><input type="text" name="billerName" value={editedData.billerName} onChange={handleInputChange} className={inputClasses} aria-label="Biller Name" /></td>
                <td className="px-6 py-2"><input type="text" name="billNumber" value={editedData.billNumber} onChange={handleInputChange} className={inputClasses} aria-label="Bill Number" /></td>
                <td className="px-6 py-2"><input type="text" name="billDate" value={editedData.billDate} onChange={handleInputChange} className={inputClasses} aria-label="Bill Date" placeholder="DD-MM-YYYY" /></td>
                <td className="px-6 py-2"><input type="number" name="billAmount" value={editedData.billAmount} onChange={handleInputChange} className={inputClasses} aria-label="Bill Amount" /></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <button onClick={handleSaveClick} className="text-green-600 hover:text-green-900" title="Save">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={handleCancelClick} className="text-red-600 hover:text-red-900" title="Cancel">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.697a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              // DISPLAY ROW
              <tr key={bill.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">{bill.billerName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">{bill.billNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">{bill.billDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700 text-right font-mono">{formatAmount(bill.billAmount)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <button onClick={() => handleEditClick(bill)} className="text-indigo-600 hover:text-indigo-900" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={() => onDeleteBill(bill.id)} className="text-red-600 hover:text-red-900" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            )
          )}
          {/* New Bill Entry Row */}
          <tr className="bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{bills.length + 1}</td>
            <td className="px-6 py-2"><input type="text" name="billerName" value={newBillData.billerName} onChange={handleNewBillInputChange} className={inputClasses} placeholder="Biller Name" /></td>
            <td className="px-6 py-2"><input type="text" name="billNumber" value={newBillData.billNumber} onChange={handleNewBillInputChange} className={inputClasses} placeholder="Bill Number" /></td>
            <td className="px-6 py-2"><input type="text" name="billDate" value={newBillData.billDate} onChange={handleNewBillInputChange} className={inputClasses} placeholder="DD-MM-YYYY" /></td>
            <td className="px-6 py-2"><input type="number" name="billAmount" value={newBillData.billAmount || ''} onChange={handleNewBillInputChange} className={inputClasses} placeholder="0.00" /></td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
              <button onClick={handleAddBillClick} className="text-brand-primary hover:text-blue-700" title="Add Bill">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
              </button>
            </td>
          </tr>
        </tbody>
        <tfoot className="bg-gray-100">
          <tr className="border-t-2 border-gray-300">
            <td colSpan={4} className="px-6 py-3 text-right text-sm font-bold text-gray-800 uppercase">
              Total
            </td>
            <td className="px-6 py-4 text-right text-sm font-bold text-gray-900 font-mono">
              {formatAmount(totalAmount)}
            </td>
            <td className="px-6 py-3"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default BillTable;