import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Bill, PatientDetails, PolicyHolderDetails } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const schema = {
  type: Type.OBJECT,
  properties: {
    patientDetails: {
      type: Type.OBJECT,
      description: "Details pertaining to the patient.",
      properties: {
        name: { type: Type.STRING, description: "The full name of the patient." },
        admissionDate: { type: Type.STRING, description: "The date and time the patient was admitted. Include time if available." },
        dischargeDate: { type: Type.STRING, description: "The date and time the patient was discharged. Include time if available." },
        aadharNumber: { type: Type.STRING, description: "The patient's Aadhar card number, if available." },
        panNumber: { type: Type.STRING, description: "The patient's PAN card number, if available." },
        dateOfBirth: { type: Type.STRING, description: "The patient's date of birth, if available." },
        gender: { type: Type.STRING, description: "The patient's gender, if available." },
      },
      required: ["name", "admissionDate", "dischargeDate"]
    },
    policyHolderDetails: {
      type: Type.OBJECT,
      description: "Details pertaining to the policy holder, who may be different from the patient.",
      properties: {
        name: { type: Type.STRING, description: "The full name of the policy holder." },
        address: { type: Type.STRING, description: "The full mailing address of the policy holder." },
        panNumber: { type: Type.STRING, description: "The policy holder's PAN card number." },
        aadharNumber: { type: Type.STRING, description: "The policy holder's Aadhar card number." },
        phoneNumber: { type: Type.STRING, description: "The policy holder's contact phone number." },
        email: { type: Type.STRING, description: "The policy holder's email address." },
        bankAccountNumber: { type: Type.STRING, description: "The bank account number for payment." },
        bankName: { type: Type.STRING, description: "The name of the bank." },
        chequeNumber: { type: Type.STRING, description: "The cheque number used for payment, if any." },
        policyNumber: { type: Type.STRING, description: "The insurance policy number or member ID." },
      },
      required: ["name", "policyNumber"]
    },
    bills: {
      type: Type.ARRAY,
      description: "An array of bill objects extracted from the document.",
      items: {
        type: Type.OBJECT,
        properties: {
          billerName: { type: Type.STRING, description: "Name of the hospital, clinic, or pharmacy." },
          billNumber: { type: Type.STRING, description: "The unique invoice or bill number." },
          billDate: { type: Type.STRING, description: "The date the bill was issued (Format: DD-MM-YYYY)." },
          billAmount: { type: Type.NUMBER, description: "The final total amount due on the bill." }
        },
        required: ["billerName", "billNumber", "billDate", "billAmount"]
      }
    }
  },
  required: ["patientDetails", "policyHolderDetails", "bills"]
};

// Define the shape of the data returned from the service
export interface ExtractedData {
  bills: Bill[];
  patientDetails: PatientDetails;
  policyHolderDetails: PolicyHolderDetails;
}

export const extractBillDetailsFromPdf = async (base64Images: string[]): Promise<ExtractedData> => {
  const defaultResponse: ExtractedData = { 
    bills: [], 
    patientDetails: { name: '', admissionDate: '', dischargeDate: '', aadharNumber: '', panNumber: '', dateOfBirth: '', gender: '' },
    policyHolderDetails: { name: '', address: '', panNumber: '', aadharNumber: '', phoneNumber: '', email: '', bankAccountNumber: '', bankName: '', chequeNumber: '', policyNumber: '' }
  };
  
  try {
    const imageParts = base64Images.map(img => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: img
      }
    }));

    const textPart = {
      text: `You are an expert at extracting structured data from scanned documents.
      Analyze the provided images, which are pages from a PDF of medical and hospital bills.
      Your task is to populate two main sections: one for the patient and one for the policy holder. Note that these can be different people.

      1.  **Patient Details**: Extract all information related to the patient receiving care.
          - Name, Admission and Discharge Dates, Aadhar Number, PAN Number, Date of Birth, Gender.

      2.  **Policy Holder Details**: Extract all information related to the insurance policy holder.
          - Name, Address, PAN Number, Aadhar Number, Phone Number, Email, Bank Account Number, Bank Name, Cheque Number, and the Policy Number.
          
      3.  **Bills**: For each distinct bill you find, extract the following:
          - Biller Name: The name of the hospital, clinic, or pharmacy.
          - Bill Number: The unique invoice or bill number.
          - Bill Date: The date the bill was issued. Format as DD-MM-YYYY.
          - Bill Amount: The final total amount due on the bill.
      
      IMPORTANT: Ensure the bills in the output array are in the same order as they appear in the document.
      If a piece of information cannot be found, return an empty string for that field.
      Provide the output in the specified JSON format.`
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, ...imageParts] },
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        }
    });

    const jsonString = response.text;
    if (!jsonString) {
        console.warn("Gemini API returned an empty response text.");
        return defaultResponse;
    }
    
    const cleanedJsonString = jsonString.replace(/^```json\n?/, '').replace(/\n?```$/, '');

    const result = JSON.parse(cleanedJsonString);

    if (result && Array.isArray(result.bills) && result.patientDetails && result.policyHolderDetails) {
      const formattedBills = result.bills.map((bill: any) => ({
        ...bill,
        billAmount: Number(bill.billAmount) || 0,
      }));
      return {
          bills: formattedBills,
          patientDetails: { ...defaultResponse.patientDetails, ...result.patientDetails },
          policyHolderDetails: { ...defaultResponse.policyHolderDetails, ...result.policyHolderDetails },
      };
    } else {
      console.warn("Parsed JSON does not match the expected schema.", result);
      return defaultResponse;
    }
  } catch (error) {
    console.error("Error calling Gemini API or parsing response:", error);
    throw new Error("Failed to extract bill details from the document.");
  }
};


export const checkForAnomalies = async (base64Images: string[]): Promise<string> => {
  try {
     const imageParts = base64Images.map(img => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: img
      }
    }));

    const textPart = {
      text: `You are an expert fraud detection analyst for a health insurance company.
      Analyze these medical bill documents carefully. Look for any signs of potential fraud, inconsistencies, or anomalies.
      Check for:
      - Mismatched patient names, addresses, or dates between different bills.
      - Unusually high costs for standard procedures compared to typical rates.
      - Signs of document alteration (e.g., misaligned text, different fonts in the same section, blurry numbers).
      - Services or treatments listed that don't logically match the diagnosis or hospital type.
      - Duplicate billing for the same service on different dates or bills.
      - Any other detail that seems suspicious or out of place.

      Provide a concise, bulleted summary of your findings.
      If everything looks normal and consistent, state that "No anomalies or signs of fraud were detected."`
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [textPart, ...imageParts] },
    });

    return response.text;

  } catch (error) {
    console.error("Error calling Gemini API for anomaly check:", error);
    throw new Error("Failed to perform the anomaly check on the document.");
  }
};