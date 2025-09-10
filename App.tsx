import React, { useState, useCallback } from 'react';
import * as pdfjs from 'pdfjs-dist';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { extractBillDetailsFromPdf, checkForAnomalies } from './services/geminiService';
import { Bill, PatientDetails, PolicyHolderDetails } from './types';
import FileUpload from './components/FileUpload';
import BillTable from './components/BillTable';
import ProgressBar from './components/ProgressBar';
import EditableField from './components/EditableField';
import Spinner from './components/Spinner';

// Set up the PDF.js worker.
const pdfjsVersion = '5.4.149';
pdfjs.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

const initialPatientDetails: PatientDetails = { name: '', admissionDate: '', dischargeDate: '', aadharNumber: '', panNumber: '', dateOfBirth: '', gender: '' };
const initialPolicyHolderDetails: PolicyHolderDetails = { name: '', address: '', panNumber: '', aadharNumber: '', phoneNumber: '', email: '', bankAccountNumber: '', bankName: '', chequeNumber: '', policyNumber: '' };


const App: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [patientDetails, setPatientDetails] = useState<PatientDetails>(initialPatientDetails);
  const [policyHolderDetails, setPolicyHolderDetails] = useState<PolicyHolderDetails>(initialPolicyHolderDetails);
  
  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCheckingAlerts, setIsCheckingAlerts] = useState<boolean>(false);

  // Error and messaging states
  const [error, setError] = useState<string | null>(null);
  const [alertResult, setAlertResult] = useState<string | null>(null);
  const [alertError, setAlertError] = useState<string | null>(null);

  // File and progress states
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');

  const getPdfImages = async (file: File, onProgress: (p: number) => void): Promise<string[]> => {
      const fileBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument(fileBuffer).promise;
      const numPages = pdf.numPages;
      const imagePromises: Promise<string>[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport, canvas: canvas }).promise;
        
        imagePromises.push(Promise.resolve(canvas.toDataURL('image/jpeg').split(',')[1]));
        onProgress(Math.round(((i / numPages) * 100)));
      }
      return Promise.all(imagePromises);
  };


  const processPdf = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setBills([]);
    setPatientDetails(initialPatientDetails);
    setPolicyHolderDetails(initialPolicyHolderDetails);
    setFileName(file.name);
    setUploadedFile(file);
    setProgress(0);
    
    try {
      setLoadingMessage('Processing PDF pages...');
      const base64Images = await getPdfImages(file, (p) => setProgress(p * 0.75)); // 75% of progress for image conversion
      
      setLoadingMessage('Extracting information with AI...');
      setProgress(80);

      const extractedData = await extractBillDetailsFromPdf(base64Images);
      
      setProgress(100);
      setLoadingMessage('Analysis complete!');

      if (extractedData.bills.length === 0) {
        setError("No bills could be extracted from the provided PDF. Please try a different file.");
        setUploadedFile(null);
      } else {
        const billsWithIds = extractedData.bills.map((bill, index) => ({
          ...bill,
          id: `bill-${Date.now()}-${index}`
        }));
        setBills(billsWithIds);
        setPatientDetails(extractedData.patientDetails);
        setPolicyHolderDetails(extractedData.policyHolderDetails);
      }

    } catch (err) {
      console.error("Error processing PDF or calling Gemini API:", err);
      setError('An error occurred while processing the PDF. Please ensure it is a valid, unencrypted file and try again.');
      setUploadedFile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAlertCheck = async () => {
    if (!uploadedFile) {
      setAlertError("No file is available to check.");
      return;
    }
    setIsCheckingAlerts(true);
    setAlertResult(null);
    setAlertError(null);

    try {
      const base64Images = await getPdfImages(uploadedFile, () => {}); // No progress needed for alert check
      const result = await checkForAnomalies(base64Images);
      setAlertResult(result);
    } catch (error) {
      console.error("Error during anomaly check:", error);
      setAlertError("An error occurred while checking the document for anomalies.");
    } finally {
      setIsCheckingAlerts(false);
    }
  };

  const closeAlertModal = () => {
    setAlertResult(null);
    setAlertError(null);
  };

  const handleDeleteBill = useCallback((billId: string) => {
    setBills(prevBills => prevBills.filter(bill => bill.id !== billId));
  }, []);

  const handleUpdateBill = useCallback((billId: string, updatedData: Omit<Bill, 'id'>) => {
    setBills(prevBills =>
      prevBills.map(bill =>
        bill.id === billId ? { id: billId, ...updatedData } : bill
      )
    );
  }, []);
  
  const handleAddBill = useCallback((newBillData: Omit<Bill, 'id'>) => {
    const newBill: Bill = {
      id: `bill-${Date.now()}-${Math.random()}`,
      ...newBillData,
    };
    setBills(prevBills => [...prevBills, newBill]);
  }, []);

  const handleGeneratePdf = useCallback(() => {
    const doc = new jsPDF();
    
    const totalAmount = bills.reduce((sum, bill) => sum + (bill.billAmount || 0), 0);
    const formatAmount = (amount: number) => new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);

    doc.setFontSize(18);
    doc.text("Annexure-I", 105, 15, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("Patient Name:", 14, 25);
    doc.text("Policy No:", 14, 32);

    doc.setFont('helvetica', 'normal');
    doc.text(patientDetails.name, 45, 25);
    doc.text(policyHolderDetails.policyNumber, 45, 32);
    
    autoTable(doc, {
        startY: 40,
        head: [['Sr. No.', 'Biller Name', 'Bill Number', 'Bill Date', 'Bill Amount']],
        body: bills.map((bill, index) => [
            index + 1,
            bill.billerName,
            bill.billNumber,
            bill.billDate,
            { content: formatAmount(bill.billAmount), styles: { halign: 'right' } }
        ]),
        foot: [
            [{ content: 'Total', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } }, 
             { content: formatAmount(totalAmount), styles: { halign: 'right', fontStyle: 'bold' } }]
        ],
        headStyles: { fillColor: '#007BFF' },
        footStyles: { fillColor: [241, 243, 245], textColor: [0, 0, 0] },
        didDrawPage: (data: any) => {
            const pageCount = (doc.internal as any).getNumberOfPages();
            doc.setFontSize(10);
            doc.text(`Page ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
    });
    
    const pdfDataUri = doc.output('datauristring');
    const newWindow = window.open();

    if (newWindow) {
      newWindow.document.title = "Annexure-I";
      newWindow.document.body.style.margin = '0';
      newWindow.document.body.style.height = '100vh';
      const iframe = newWindow.document.createElement('iframe');
      iframe.src = pdfDataUri;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      newWindow.document.body.appendChild(iframe);
    } else {
      alert("Could not open new window. Please disable your pop-up blocker.");
    }
  }, [bills, patientDetails, policyHolderDetails]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-brand-dark">PDF Bill Annexure Generator</h1>
          <p className="mt-2 text-lg text-brand-secondary">
            Upload bills, automatically extract details, and check for anomalies.
          </p>
        </header>

        <main className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200">
          
          {isLoading && (
            <div className="mb-8 text-center px-4">
              <ProgressBar progress={progress} />
              <p className="mt-4 text-lg text-brand-primary font-semibold">
                {loadingMessage}
              </p>
              <p className="text-sm text-brand-secondary">Processing {fileName}</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
              <p className="font-bold">Processing Failed</p>
              <p>{error}</p>
            </div>
          )}

          {!isLoading && bills.length > 0 && (
            <div className="space-y-8">
               <div>
                  <h3 className="text-xl font-semibold text-brand-dark mb-3 border-b pb-2">Patient Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-4 bg-gray-50 rounded-lg border">
                      <EditableField label="Patient Name" value={patientDetails.name} onSave={(val) => setPatientDetails(p => ({...p, name: val}))} />
                      <EditableField label="Date of Birth" value={patientDetails.dateOfBirth} onSave={(val) => setPatientDetails(p => ({...p, dateOfBirth: val}))} />
                      <EditableField label="Gender" value={patientDetails.gender} onSave={(val) => setPatientDetails(p => ({...p, gender: val}))} />
                      <EditableField label="Aadhar Number" value={patientDetails.aadharNumber} onSave={(val) => setPatientDetails(p => ({...p, aadharNumber: val}))} />
                      <EditableField label="PAN Number" value={patientDetails.panNumber} onSave={(val) => setPatientDetails(p => ({...p, panNumber: val}))} />
                      <EditableField label="Admission Date" value={patientDetails.admissionDate} onSave={(val) => setPatientDetails(p => ({...p, admissionDate: val}))} />
                      <EditableField label="Discharge Date" value={patientDetails.dischargeDate} onSave={(val) => setPatientDetails(p => ({...p, dischargeDate: val}))} />
                  </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-brand-dark mb-3 border-b pb-2">Policy Holder Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-4 bg-gray-50 rounded-lg border">
                    <EditableField label="Policy Holder Name" value={policyHolderDetails.name} onSave={(val) => setPolicyHolderDetails(p => ({...p, name: val}))} />
                    <EditableField label="Policy Number" value={policyHolderDetails.policyNumber} onSave={(val) => setPolicyHolderDetails(p => ({...p, policyNumber: val}))} />
                    <EditableField label="Address" value={policyHolderDetails.address} onSave={(val) => setPolicyHolderDetails(p => ({...p, address: val}))} />
                    <EditableField label="Phone Number" value={policyHolderDetails.phoneNumber} onSave={(val) => setPolicyHolderDetails(p => ({...p, phoneNumber: val}))} />
                    <EditableField label="Email ID" value={policyHolderDetails.email} onSave={(val) => setPolicyHolderDetails(p => ({...p, email: val}))} />
                    <EditableField label="Aadhar Number" value={policyHolderDetails.aadharNumber} onSave={(val) => setPolicyHolderDetails(p => ({...p, aadharNumber: val}))} />
                    <EditableField label="PAN Number" value={policyHolderDetails.panNumber} onSave={(val) => setPolicyHolderDetails(p => ({...p, panNumber: val}))} />
                    <EditableField label="Bank Name" value={policyHolderDetails.bankName} onSave={(val) => setPolicyHolderDetails(p => ({...p, bankName: val}))} />
                    <EditableField label="Bank Account Number" value={policyHolderDetails.bankAccountNumber} onSave={(val) => setPolicyHolderDetails(p => ({...p, bankAccountNumber: val}))} />
                    <EditableField label="Cheque Number" value={policyHolderDetails.chequeNumber} onSave={(val) => setPolicyHolderDetails(p => ({...p, chequeNumber: val}))} />
                </div>
              </div>

               <div>
                  <h2 className="text-2xl font-semibold text-brand-dark mb-4">
                    Annexure-I
                  </h2>
                  <BillTable 
                    bills={bills} 
                    onUpdateBill={handleUpdateBill}
                    onDeleteBill={handleDeleteBill}
                    onAddBill={handleAddBill}
                  />
               </div>
            </div>
          )}

          <div className={`mt-8 ${bills.length > 0 ? 'border-t border-gray-200 pt-6' : ''}`}>
              {!isLoading && bills.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                  <button
                    onClick={handleAlertCheck}
                    disabled={isCheckingAlerts}
                    className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition-colors text-lg flex items-center gap-2"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Alert
                  </button>
                  <button
                    onClick={handleGeneratePdf}
                    className="px-8 py-3 bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-colors text-lg flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Generate PDF
                  </button>
                </div>
              )}
              <FileUpload onFileSelect={processPdf} disabled={isLoading} />
          </div>
        </main>

        <footer className="text-center mt-8 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} PDF Bill Annexure Generator. Powered by AI.</p>
        </footer>
      </div>

      { (isCheckingAlerts || alertResult || alertError) && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-brand-dark">Fraud & Anomaly Check Results</h3>
                <button onClick={closeAlertModal} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className="min-h-[100px]">
              {isCheckingAlerts && <div className="flex flex-col items-center justify-center py-4"><Spinner /><p className="mt-2 text-brand-secondary">Analyzing document...</p></div>}
              {alertError && <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"><p className="font-bold">Error</p><p>{alertError}</p></div>}
              {alertResult && <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border max-h-80 overflow-y-auto">{alertResult}</div>}
            </div>
            <div className="mt-6 text-right">
              <button onClick={closeAlertModal} className="px-6 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;