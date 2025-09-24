import React, { useState } from "react";
import {
  FaQrcode,
  FaCopy,
  FaEye,
  FaCheck,
  FaTimes,
  FaClock,
  FaDownload,
} from "react-icons/fa";
import { useCookies } from "react-cookie";
import { getDecodedTokenData, baseUrl, SERVER_URL } from "@/helper/auth";
import {
  getPaymentGateways,
  getPaymentRequests,
  updateDepositRequest,
} from "@/helper/user";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface GatewayDetails {
  upiId: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountHolder: string;
  phoneNumber: string;
  email: string;
  minAmount: number;
  maxAmount: number;
}

interface PaymentGatewayDetails {
  id: string;
  gatewayMethod: string;
  gatewayImage: string;
  qrImage: string;
  gatewayDetails: string | GatewayDetails; // Can be JSON string or object
  isActive: boolean;
  createdBy: string;
  createdByType: string;
  groupId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaymentGatewayResponse {
  success: boolean;
  data: PaymentGatewayDetails[];
}

interface PaymentRequestResponse {
  success: boolean;
  data: PaymentRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface PaymentRequest {
  id: string;
  transactionNo: string;
  paymentProof: string;
  amount: string;
  balance: string;
  ipAddress: string;
  status: string;
  reason: string | null;
  uplineId: string;
  uplineType: string;
  clientId: string;
  clientType: string;
  gatewayId: string;
  gatewayMethod: {
    gatewayMethod: string;
    gatewayDetails: string;
  };
  groupId: string | null;
  loginId: string;
  processedBy: string | null;
  processedByType: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  gateway: {
    id: string;
    gatewayMethod: string;
    gatewayImage: string;
    qrImage: string;
    gatewayDetails: string;
    isActive: boolean;
    createdBy: string;
    createdByType: string;
    groupId: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

const PaymentGateway = () => {
  const [cookies] = useCookies(["Admin", "TechAdmin"]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(
    null
  );
  const [selectedAction, setSelectedAction] = useState<
    "Proceed" | "Cancel" | null
  >(null);
  const [transactionPassword, setTransactionPassword] = useState("");
  const [reason, setReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isQRCovered, setIsQRCovered] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [qrImageFile, setQrImageFile] = useState<File | null>(null);
  const [isUpdatingQR, setIsUpdatingQR] = useState(false);
  const [showEditGatewayModal, setShowEditGatewayModal] = useState(false);
  const [gatewayImageFile, setGatewayImageFile] = useState<File | null>(null);
  const [isUpdatingGateway, setIsUpdatingGateway] = useState(false);
  const [editFormData, setEditFormData] = useState({
    gatewayMethod: '',
    upiId: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    accountHolder: '',
    phoneNumber: '',
    email: '',
    minAmount: '',
    maxAmount: ''
  });

  // Get auth token
  const token = cookies[baseUrl.includes("techadmin") ? "TechAdmin" : "Admin"];

  // Fetch payment gateways data
  const {
    data: paymentGatewayResponse,
    isLoading: gatewayLoading,
    error: gatewayError,
    refetch: refetchGateway,
  } = useQuery<PaymentGatewayResponse>({
    queryKey: ["paymentGateways"],
    queryFn: () => getPaymentGateways({ cookies }),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Fetch payment requests data
  const {
    data: paymentRequestsResponse,
    isLoading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests,
  } = useQuery<PaymentRequestResponse>({
    queryKey: ["paymentRequests"],
    queryFn: () => getPaymentRequests({ cookies }),
    enabled: !!token,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Parse gateway details and get the first active gateway
  const paymentGatewayDetails = React.useMemo(() => {
    console.log("PaymentGateway Response:", paymentGatewayResponse);

    if (
      !paymentGatewayResponse?.success ||
      !paymentGatewayResponse?.data?.length
    ) {
      console.log("No data or not successful:", {
        success: paymentGatewayResponse?.success,
        dataLength: paymentGatewayResponse?.data?.length,
      });
      return null;
    }

    const activeGateway = paymentGatewayResponse.data.find(
      (gateway: PaymentGatewayDetails) => gateway.isActive
    );
    console.log("Active Gateway:", activeGateway);

    if (!activeGateway) {
      console.log("No active gateway found");
      return null;
    }

    try {
      // Handle both string and object formats for gatewayDetails
      let parsedDetails: GatewayDetails;
      if (typeof activeGateway.gatewayDetails === 'string') {
        parsedDetails = JSON.parse(activeGateway.gatewayDetails);
      } else {
        parsedDetails = activeGateway.gatewayDetails as GatewayDetails;
      }
      console.log("Parsed Details:", parsedDetails);

      // Clean up qrImage path - remove "public/" prefix if present
      const cleanQrImage = activeGateway.qrImage.startsWith('public/') 
        ? activeGateway.qrImage.replace('public/', '') 
        : activeGateway.qrImage;

      const result = {
        ...activeGateway,
        parsedDetails,
        qrCodeUrl: `${SERVER_URL}${cleanQrImage}`,
        gatewayImageUrl: `${SERVER_URL}${activeGateway.gatewayImage}`,
      };

      console.log("Final Result:", result);
      return result;
    } catch (error) {
      console.error("Error parsing gateway details:", error);
      return null;
    }
  }, [paymentGatewayResponse]);

  // Get payment requests from API
  const paymentRequests = React.useMemo(() => {
    console.log("Payment Requests Response:", paymentRequestsResponse);

    if (
      !paymentRequestsResponse?.success ||
      !paymentRequestsResponse?.data?.length
    ) {
      console.log("No payment requests data:", {
        success: paymentRequestsResponse?.success,
        dataLength: paymentRequestsResponse?.data?.length,
      });
      return [];
    }

    return paymentRequestsResponse.data;
  }, [paymentRequestsResponse]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <FaClock className="w-3 h-3" />;
      case "approved":
        return <FaCheck className="w-3 h-3" />;
      case "rejected":
        return <FaTimes className="w-3 h-3" />;
      case "completed":
        return <FaCheck className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const handleAction = (
    action: "Proceed" | "Cancel",
    transactionNo: string
  ) => {
    const request = paymentRequests.find(
      (req) => req.transactionNo === transactionNo
    );
    if (!request) {
      toast.error("Request not found");
      return;
    }

    setSelectedRequest(request);
    setSelectedAction(action);
    setTransactionPassword("");
    setReason(
      action === "Proceed" ? "Payment verified" : "Payment verification failed"
    );
    setShowPasswordModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest || !selectedAction || !transactionPassword.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsProcessing(true);
    try {
      const status = selectedAction === "Proceed" ? "Approved" : "Rejected";
      const result = await updateDepositRequest({
        requestId: selectedRequest.id,
        transactionPassword,
        status,
        reason:
          reason.trim() ||
          (selectedAction === "Proceed"
            ? "Payment verified"
            : "Payment verification failed"),
        cookies,
      });

      if (result.success) {
        toast.success(`Request ${status.toLowerCase()} successfully`);
        setShowPasswordModal(false);
        setSelectedRequest(null);
        setSelectedAction(null);
        setTransactionPassword("");
        setReason("");
        // Refetch the data to update the UI
        (refetchRequests as any)?.();
      } else {
        toast.error(result.message || "Failed to update request");
      }
    } catch (error) {
      console.error("Error updating deposit request:", error);
      toast.error("Failed to update request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Update QR image function
  const updateQRImage = async (gatewayId: string, qrImageFile: File) => {
    const formData = new FormData();
    formData.append('qrImage', qrImageFile);

    // Use the same base URL as other API calls
    const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:7080';
    const apiUrl = `${baseUrl}/api/v1/payment/updatepaymentgateway/${gatewayId}/qr-image`;

    console.log('Updating QR image:', { gatewayId, apiUrl });

    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`Failed to update QR image: ${response.status} ${errorText}`);
    }

    return response.json();
  };

  const handleQRImageUpdate = async () => {
    if (!qrImageFile || !paymentGatewayDetails) {
      toast.error("Please select a QR image file");
      return;
    }

    // Validate file size (5MB limit)
    if (qrImageFile.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(qrImageFile.type)) {
      toast.error("Please select a valid image file (JPG, PNG, or GIF)");
      return;
    }

    setIsUpdatingQR(true);
    try {
      console.log('Starting QR image update...');
      const result = await updateQRImage(paymentGatewayDetails.id, qrImageFile);
      console.log('QR image update result:', result);
      
      toast.success("QR image updated successfully!");
      setShowEditModal(false);
      setQrImageFile(null);
      
      // Refetch the gateway data to show updated QR
      await refetchGateway();
    } catch (error: any) {
      console.error("Error updating QR image:", error);
      const errorMessage = error?.message || "Failed to update QR image. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsUpdatingQR(false);
    }
  };

  const handleCloseModal = () => {
    setShowPasswordModal(false);
    setSelectedRequest(null);
    setSelectedAction(null);
    setTransactionPassword("");
    setReason("");
  };

  // Update gateway function
  const updateGateway = async (gatewayId: string, formData: any, gatewayImageFile?: File, qrImageFile?: File) => {
    const formDataToSend = new FormData();
    formDataToSend.append('gatewayMethod', formData.gatewayMethod);
    formDataToSend.append('gatewayDetails', JSON.stringify({
      upiId: formData.upiId,
      accountNumber: formData.accountNumber,
      ifscCode: formData.ifscCode,
      bankName: formData.bankName,
      accountHolder: formData.accountHolder,
      phoneNumber: formData.phoneNumber,
      email: formData.email,
      minAmount: parseInt(formData.minAmount),
      maxAmount: parseInt(formData.maxAmount)
    }));

    if (gatewayImageFile) {
      formDataToSend.append('gatewayImage', gatewayImageFile);
    }
    if (qrImageFile) {
      formDataToSend.append('qrImage', qrImageFile);
    }

    const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:7080';
    const apiUrl = `${baseUrl}/api/v1/payment/updatepaymentgateway/${gatewayId}`;

    console.log('Updating gateway:', { gatewayId, apiUrl, formData });

    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formDataToSend
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gateway Update Error:', response.status, errorText);
      throw new Error(`Failed to update gateway: ${response.status} ${errorText}`);
    }

    return response.json();
  };

  const handleGatewayUpdate = async () => {
    if (!paymentGatewayDetails) {
      toast.error("Gateway details not found");
      return;
    }

    // Validate required fields
    if (!editFormData.gatewayMethod || !editFormData.upiId || !editFormData.accountNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate file sizes if provided
    if (gatewayImageFile && gatewayImageFile.size > 5 * 1024 * 1024) {
      toast.error("Gateway image size must be less than 5MB");
      return;
    }
    if (qrImageFile && qrImageFile.size > 5 * 1024 * 1024) {
      toast.error("QR image size must be less than 5MB");
      return;
    }

    setIsUpdatingGateway(true);
    try {
      console.log('Starting gateway update...');
      const result = await updateGateway(
        paymentGatewayDetails.id, 
        editFormData, 
        gatewayImageFile || undefined, 
        qrImageFile || undefined
      );
      console.log('Gateway update result:', result);
      
      toast.success("Gateway updated successfully!");
      setShowEditGatewayModal(false);
      setGatewayImageFile(null);
      setQrImageFile(null);
      
      // Refetch the gateway data to show updated information
      await refetchGateway();
    } catch (error: any) {
      console.error("Error updating gateway:", error);
      const errorMessage = error?.message || "Failed to update gateway. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsUpdatingGateway(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setQrImageFile(null);
  };

  const handleCloseEditGatewayModal = () => {
    setShowEditGatewayModal(false);
    setGatewayImageFile(null);
    setQrImageFile(null);
    setEditFormData({
      gatewayMethod: '',
      upiId: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      accountHolder: '',
      phoneNumber: '',
      email: '',
      minAmount: '',
      maxAmount: ''
    });
  };

  const openEditGatewayModal = () => {
    if (paymentGatewayDetails) {
      setEditFormData({
        gatewayMethod: paymentGatewayDetails.gatewayMethod,
        upiId: paymentGatewayDetails.parsedDetails.upiId,
        accountNumber: paymentGatewayDetails.parsedDetails.accountNumber,
        ifscCode: paymentGatewayDetails.parsedDetails.ifscCode,
        bankName: paymentGatewayDetails.parsedDetails.bankName,
        accountHolder: paymentGatewayDetails.parsedDetails.accountHolder,
        phoneNumber: paymentGatewayDetails.parsedDetails.phoneNumber,
        email: paymentGatewayDetails.parsedDetails.email,
        minAmount: paymentGatewayDetails.parsedDetails.minAmount.toString(),
        maxAmount: paymentGatewayDetails.parsedDetails.maxAmount.toString()
      });
    }
    setShowEditGatewayModal(true);
  };

  // Loading state
  if (gatewayLoading || requestsLoading) {
    return (
      <div className="p-4 bg-[#fafafa] min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">
            Loading payment gateway data...
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (gatewayError || requestsError) {
    return (
      <div className="p-4 bg-[#fafafa] min-h-screen">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="text-lg text-red-500">
            ❌ Error loading payment gateway data
          </div>
          <button
            onClick={() => {
              refetchGateway();
              refetchRequests();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No gateway data
  if (!paymentGatewayDetails) {
    return (
      <div className="p-4 bg-[#fafafa] min-h-screen">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="text-lg text-gray-600">
            No active payment gateway found
          </div>
          <p className="text-sm text-gray-500">
            Please contact administrator to set up a payment gateway
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#fafafa] min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Payment Gateway
        </h2>
      </div>

      {/* Gateway Details Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Gateway Details
          </h3>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              onClick={openEditGatewayModal}
              title="Edit Gateway"
            >
              <FaCheck className="w-4 h-4" />
              Edit
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* QR Code Section */}
          <div className="lg:col-span-1">
            <div className="text-center">
              <h4 className="text-md font-semibold mb-3 text-gray-700">
                QR Code
              </h4>
              <div 
                className="relative bg-white p-4 rounded-lg border-2 border-gray-200 inline-block transition-all duration-200"
                onMouseEnter={() => setIsQRCovered(true)}
                onMouseLeave={() => setIsQRCovered(false)}
              >
                <img
                  src={`${SERVER_URL}${paymentGatewayDetails.qrImage}`}
                  alt="Payment QR Code"
                  className={`w-32 h-32 mx-auto object-cover transition-opacity duration-200 ${
                    isQRCovered ? 'opacity-20' : ''
                  }`}
                />
                {isQRCovered && (
                  <div className="absolute inset-0 flex gap-2 items-center justify-center bg-black/60 rounded-lg">
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
                      onClick={() => setShowQRModal(true)}
                      title="Open full size QR code"
                    >
                      Open
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-md text-sm transition-colors"
                      onClick={() => setShowEditModal(true)}
                      title="Edit QR details"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-2">Scan to make payment</p>
            </div>
          </div>

          {/* Gateway Information */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* UPI Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-700">
                  UPI Details
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">UPI ID:</span>
        <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {paymentGatewayDetails.parsedDetails.upiId}
          </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            paymentGatewayDetails.parsedDetails.upiId,
                            "UPI ID"
                          )
                        }
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaCopy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
        </div>
      </div>

              {/* Bank Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-700">
                  Bank Details
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Account:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {paymentGatewayDetails.parsedDetails.accountNumber}
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            paymentGatewayDetails.parsedDetails.accountNumber,
                            "Account Number"
                          )
                        }
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaCopy className="w-3 h-3" />
                      </button>
        </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">IFSC:</span>
        <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {paymentGatewayDetails.parsedDetails.ifscCode}
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            paymentGatewayDetails.parsedDetails.ifscCode,
                            "IFSC Code"
                          )
                        }
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaCopy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gateway Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-700">
                  Gateway Status
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Method:</span>
                    <span className="font-medium text-sm">
                      {paymentGatewayDetails.gatewayMethod}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(paymentGatewayDetails.isActive ? "active" : "inactive")}`}
                    >
                      {paymentGatewayDetails.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Amount Range:</span>
                    <span className="font-medium text-sm">
                      ₹{paymentGatewayDetails.parsedDetails.minAmount} - ₹
                      {paymentGatewayDetails.parsedDetails.maxAmount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-700">
                  Contact Info
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Phone:</span>
                    <span className="font-medium text-sm">
                      {paymentGatewayDetails.parsedDetails.phoneNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="font-medium text-sm">
                      {paymentGatewayDetails.parsedDetails.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Bank:</span>
                    <span className="font-medium text-sm">
                      {paymentGatewayDetails.parsedDetails.bankName}
          </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request History Section */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Payment Request History</h3>
          <p className="text-sm text-gray-600 mt-1">
            View and manage payment requests
          </p>
          {paymentRequestsResponse?.pagination && (
            <div className="mt-2 text-sm text-gray-500">
              Showing {paymentRequestsResponse.pagination.page} of{" "}
              {paymentRequestsResponse.pagination.totalPages} pages (
              {paymentRequestsResponse.pagination.total} total requests)
            </div>
          )}
          {requestsError && (
            <div className="mt-2 p-2 bg-red-100 text-red-700 rounded text-sm">
              Error loading payment requests.
              <button
                onClick={() => (refetchRequests as any)?.()}
                className="ml-2 underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {requestsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-600">Loading payment requests...</div>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction No
                </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Proof
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {paymentRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.transactionNo}
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.loginId}
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{parseFloat(request.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{parseFloat(request.balance).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.gatewayMethod.gatewayMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}
                      >
                        {getStatusIcon(request.status)}
                        {request.status.toUpperCase()}
                      </span>
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.paymentProof ? (
                        <img
                          src={`${SERVER_URL}${request.paymentProof}`}
                          alt="Payment Proof"
                          className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80"
                          onClick={() =>
                            window.open(
                              `${SERVER_URL}${request.paymentProof}`,
                              "_blank"
                            )
                          }
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://via.placeholder.com/64x64/cccccc/666666?text=No+Image";
                          }}
                        />
                      ) : (
                        <span className="text-gray-400">No proof</span>
                      )}
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(request.createdAt).toLocaleDateString()}
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {request.status.toLowerCase() === "pending" && (
                          <>
                    <button
                              onClick={() =>
                                handleAction("Proceed", request.transactionNo)
                              }
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                              title="Proceed"
                            >
                              Proceed
                    </button>
                    <button
                              onClick={() =>
                                handleAction("Cancel", request.transactionNo)
                              }
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                              title="Cancel"
                            >
                              Cancel
                    </button>
                          </>
                        )}
                        {request.status.toLowerCase() !== "pending" && (
                          <span className="text-gray-400 text-xs">
                            No actions
                          </span>
                        )}
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {!requestsLoading && paymentRequests.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No payment requests found
          </div>
        )}
      </div>

      {/* Transaction Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedAction === "Proceed" ? "Approve" : "Reject"} Payment
                Request
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
                disabled={isProcessing}
              >
                <FaTimes className="w-5 h-5" />
              </button>
        </div>

            {selectedRequest && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  <strong>Transaction:</strong> {selectedRequest.transactionNo}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Amount:</strong> ₹
                  {parseFloat(selectedRequest.amount).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Client:</strong> {selectedRequest.loginId}
                </p>
        </div>
            )}

            <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Password *
              </label>
              <input
                  type="password"
                  value={transactionPassword}
                  onChange={(e) => setTransactionPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your transaction password"
                  disabled={isProcessing}
              />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
              </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter reason for this action"
                  rows={3}
                  disabled={isProcessing}
              />
            </div>
          </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                  selectedAction === "Proceed"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={isProcessing || !transactionPassword.trim()}
              >
                {isProcessing
                  ? "Processing..."
                  : selectedAction === "Proceed"
                    ? "Approve"
                    : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit QR Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit QR Code
              </h3>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-400 hover:text-gray-600"
                disabled={isUpdatingQR}
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select New QR Code Image
              </label>
              <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setQrImageFile(file);
                    }
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isUpdatingQR}
                />
                {qrImageFile && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                    Selected: {qrImageFile.name}
                  </div>
                )}
            </div>

              <div className="text-sm text-gray-600">
                <p className="mb-2">Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Image format: JPG, PNG, or GIF</li>
                  <li>Recommended size: 256x256 pixels or larger</li>
                  <li>File size: Maximum 5MB</li>
                </ul>
            </div>
          </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseEditModal}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={isUpdatingQR}
              >
                Cancel
              </button>
              <button
                onClick={handleQRImageUpdate}
                className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                  isUpdatingQR ? "opacity-50 cursor-not-allowed bg-gray-400" : "bg-red-600 hover:bg-red-700"
                }`}
                disabled={isUpdatingQR || !qrImageFile}
              >
                {isUpdatingQR ? "Updating..." : "Update QR Code"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Gateway Modal */}
      {showEditGatewayModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Payment Gateway
              </h3>
              <button
                onClick={handleCloseEditGatewayModal}
                className="text-gray-400 hover:text-gray-600"
                disabled={isUpdatingGateway}
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Gateway Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gateway Method *
              </label>
              <select
                  value={editFormData.gatewayMethod}
                  onChange={(e) => setEditFormData({...editFormData, gatewayMethod: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isUpdatingGateway}
                >
                  <option value="">Select Method</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Wallet">Wallet</option>
              </select>
            </div>

              {/* UPI Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                    UPI ID *
              </label>
                  <input
                    type="text"
                    value={editFormData.upiId}
                    onChange={(e) => setEditFormData({...editFormData, upiId: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="example@paytm"
                    disabled={isUpdatingGateway}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={editFormData.accountNumber}
                    onChange={(e) => setEditFormData({...editFormData, accountNumber: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1234567890"
                    disabled={isUpdatingGateway}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={editFormData.ifscCode}
                    onChange={(e) => setEditFormData({...editFormData, ifscCode: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SBIN0001234"
                    disabled={isUpdatingGateway}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.bankName}
                    onChange={(e) => setEditFormData({...editFormData, bankName: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="State Bank of India"
                    disabled={isUpdatingGateway}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Holder
                  </label>
                  <input
                    type="text"
                    value={editFormData.accountHolder}
                    onChange={(e) => setEditFormData({...editFormData, accountHolder: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Account Holder Name"
                    disabled={isUpdatingGateway}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.phoneNumber}
                    onChange={(e) => setEditFormData({...editFormData, phoneNumber: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+91 9876543210"
                    disabled={isUpdatingGateway}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="support@example.com"
                    disabled={isUpdatingGateway}
                  />
                </div>
              </div>

              {/* Amount Limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Amount
                  </label>
                  <input
                    type="number"
                    value={editFormData.minAmount}
                    onChange={(e) => setEditFormData({...editFormData, minAmount: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                    disabled={isUpdatingGateway}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Amount
                  </label>
                  <input
                    type="number"
                    value={editFormData.maxAmount}
                    onChange={(e) => setEditFormData({...editFormData, maxAmount: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="50000"
                    disabled={isUpdatingGateway}
                  />
                </div>
              </div>

              {/* File Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gateway Image
                  </label>
                <input
                  type="file"
                  accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setGatewayImageFile(file);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isUpdatingGateway}
                  />
                  {gatewayImageFile && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      Selected: {gatewayImageFile.name}
              </div>
              )}
            </div>
                <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                    QR Code Image
            </label>
              <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setQrImageFile(file);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isUpdatingGateway}
                  />
                  {qrImageFile && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      Selected: {qrImageFile.name}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p className="mb-2">File Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Image format: JPG, PNG, or GIF</li>
                  <li>Recommended size: 256x256 pixels or larger</li>
                  <li>File size: Maximum 5MB per file</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseEditGatewayModal}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={isUpdatingGateway}
              >
                Cancel
              </button>
              <button
                onClick={handleGatewayUpdate}
                className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                  isUpdatingGateway ? "opacity-50 cursor-not-allowed bg-gray-400" : "bg-green-600 hover:bg-green-700"
                }`}
                disabled={isUpdatingGateway}
              >
                {isUpdatingGateway ? "Updating..." : "Update Gateway"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Payment QR Code
              </h3>
            <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 hover:text-gray-600"
            >
                <FaTimes className="w-5 h-5" />
            </button>
          </div>

            <div className="text-center">
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200 inline-block">
                <img
                  src={`${SERVER_URL}${paymentGatewayDetails.qrImage}`}
                  alt="Payment QR Code - Full Size"
                  className="w-64 h-64 mx-auto object-cover"
                />
      </div>
              <p className="text-sm text-gray-600 mt-4">
                Scan this QR code with your payment app to make a payment
              </p>
              <div className="mt-4 flex gap-2 justify-center">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${SERVER_URL}${paymentGatewayDetails.qrImage}`);
                    toast.success("QR code URL copied to clipboard");
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <FaCopy className="w-3 h-3" />
                  Copy URL
                </button>
            <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `${SERVER_URL}${paymentGatewayDetails.qrImage}`;
                    link.download = 'payment-qr-code.png';
                    link.click();
                    toast.success("QR code downloaded");
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <FaDownload className="w-3 h-3" />
                  Download
            </button>
              </div>
            </div>
          </div>
      </div>
      )}
    </div>
  );
};

export default PaymentGateway;
