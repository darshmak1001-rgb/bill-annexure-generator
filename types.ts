export interface Bill {
  id: string; // Add a unique ID for React keys and state management
  billerName: string;
  billNumber: string;
  billDate: string;
  billAmount: number;
}

export interface PatientDetails {
    name: string;
    admissionDate: string;
    dischargeDate: string;
    aadharNumber: string;
    panNumber: string;
    dateOfBirth: string;
    gender: string;
}

export interface PolicyHolderDetails {
    name: string;
    address: string;
    panNumber: string;
    aadharNumber: string;
    phoneNumber: string;
    email: string;
    bankAccountNumber: string;
    bankName: string;
    chequeNumber: string;
    policyNumber: string;
}