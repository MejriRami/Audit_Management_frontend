import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import axiosInstance from "../services/axiosInstance";

interface CarFormData {
  audit_number: string;
  auditee_name: string;
  audit_type: string;
  audit_plant: string;
  reason_why: string;
  due_date: string;
  finding: string;
  implemented_solution: string;
  is_submitted: boolean;
  status: string;
  submitted_at: string | null;
  documents: DocumentInfo[];
}

interface DocumentInfo {
  id: number;
  filename: string;
  file_url: string;
  size: number;
  uploaded_at: string | null;
}

export const CarAccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get("token") || "";

  const [step, setStep] = useState<"email" | "otp" | "form" | "submitted">(
    "email"
  );
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [carData, setCarData] = useState<CarFormData | null>(null);
  const [implementedSolution, setImplementedSolution] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedDate, setSubmittedDate] = useState<string | null>(null);

  // États pour les fichiers
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Validation de l'email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      emailRegex.test(email) && email.toLowerCase().endsWith("@avocarbon.com")
    );
  };

  const getEmailError = (): string | null => {
    if (!email) return null;
    if (!email.includes("@")) return null;
    if (!isValidEmail(email)) {
      return "Email must end with @avocarbon.com";
    }
    return null;
  };

  // Gestion des fichiers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);

      // Vérifier la taille des fichiers
      const maxSize = 10 * 1024 * 1024; // 10 MB
      const invalidFiles = files.filter((file) => file.size > maxSize);

      if (invalidFiles.length > 0) {
        setMessage(
          `⚠️ Fichier(s) trop volumineux: ${invalidFiles
            .map((f) => f.name)
            .join(", ")}. Taille maximum: 10MB`
        );
        return;
      }

      setSelectedFiles((prev) => [...prev, ...files]);
      setMessage("");
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const requestOtp = async () => {
    if (!isValidEmail(email)) {
      setMessage(
        "⚠️ Please use your professional email address (@avocarbon.com)"
      );
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await axiosInstance.post("/car/request-otp", {
        token: tokenParam,
        email,
      });

      if (response.data.already_submitted) {
        setSubmittedDate(response.data.submitted_at);
        setStep("submitted");
        setMessage(
          `This form has already been submitted on ${response.data.submitted_at}`
        );
      } else {
        setStep("otp");
        setMessage("✅ OTP code sent to your email.");
      }
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Error sending the code.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    try {
      setLoading(true);
      setMessage("");
      await axiosInstance.post("/car/verify-otp", {
        token: tokenParam,
        email,
        code: otp,
      });

      const res = await axiosInstance.get<CarFormData>("/car/form", {
        params: { token: tokenParam, email },
      });

      setCarData(res.data);
      console.log(res.data);
      setImplementedSolution(res.data.implemented_solution || "");

      if (res.data.is_submitted) {
        setStep("submitted");
        setSubmittedDate(res.data.submitted_at);
        setMessage(
          `✅ This form has already been submitted on ${res.data.submitted_at}`
        );
      } else {
        setStep("form");
        setMessage("");
      }
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Invalid OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const submitForm = async () => {
    if (!implementedSolution.trim()) {
      setMessage("⚠️ Please describe the implemented solution");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      // Créer FormData pour envoyer les fichiers
      const formData = new FormData();
      formData.append("token", tokenParam);
      formData.append("email", email);
      formData.append("implemented_solution", implementedSolution);

      // Ajouter les fichiers
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });
      if (selectedFiles.length === 0) {
        setMessage("⚠️ Could not submit without at least one document.");
        return;
      }
      const response = await axiosInstance.post("/car/submit", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.already_submitted) {
        setMessage(
          `⚠️ Ce formulaire a déjà été soumis le ${response.data.submitted_at}`
        );
      } else {
        setStep("submitted");
        setSubmittedDate(response.data.submitted_at);
        setMessage("✅ Form submitted successfully!");
      }
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Error submitting the form.");
    } finally {
      setLoading(false);
    }
  };

  const emailError = getEmailError();
  const isEmailValid = isValidEmail(email);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-[url('images/avocarbon-brushes.jpg')] bg-cover bg-center"></div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -20px) scale(1.05); }
          50% { transform: translate(-20px, 20px) scale(0.95); }
          75% { transform: translate(20px, 20px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Logo et en-tête */}
        <div className="text-center mb-8 fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-800 to-blue-900 rounded-2xl mb-4 shadow-lg">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="text-4xl font-bold flex items-center">
                <div className="text-4xl font-bold">
                  <span className="text-blue-900 uppercase">AVO</span>
                  <span className="text-gray-500">Carbon</span>
                </div>
              </div>
              <div className="w-full border-t border-gray-300 my-1"></div>

              <div className="absolute right-0 -bottom-6 text-orange-500 font-semibold tracking-wide">
                STS
              </div>
            </div>
          </div>
          {/* <p className="text-gray-600 text-lg font-medium">
            Système d'Actions Correctives
          </p> */}
        </div>

        {/* Carte principale */}
        <div
          className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/20 fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          {/* Indicateur de progression */}
          {step !== "submitted" && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`flex items-center gap-2 text-sm font-medium ${
                    step === "email" ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      step === "email"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    1
                  </span>
                  Email
                </span>
                <span
                  className={`flex items-center gap-2 text-sm font-medium ${
                    step === "otp" ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      step === "otp"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    2
                  </span>
                  Verification
                </span>
                <span
                  className={`flex items-center gap-2 text-sm font-medium ${
                    step === "form" ? "text-blue-900" : "text-gray-400"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      step === "form"
                        ? "from-blue-700 text-blue-900"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    3
                  </span>
                  Form
                </span>
              </div>
              <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-500 ease-out"
                  style={{
                    width:
                      step === "email"
                        ? "33.33%"
                        : step === "otp"
                        ? "66.66%"
                        : "100%",
                  }}
                />
              </div>
            </div>
          )}

          {/* Messages d'alerte */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                message.includes("✅")
                  ? "bg-blue-50 text-blue-800 border border-blue-200"
                  : message.includes("⚠️")
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              <span className="text-xl flex-shrink-0">
                {message.includes("✅")
                  ? "✅"
                  : message.includes("⚠️")
                  ? "⚠️"
                  : "❌"}
              </span>
              <span className="text-sm font-medium">
                {message.replace(/^[✅⚠️❌]\s*/, "")}
              </span>
            </div>
          )}

          {/* Étape 1 : Email */}
          {step === "email" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Professional Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="your.name@avocarbon.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && isEmailValid && !loading) {
                        requestOtp();
                      }
                    }}
                    className={`w-full px-4 py-4 pl-12 border-2 rounded-xl focus:outline-none transition-all ${
                      emailError
                        ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                        : isEmailValid
                        ? "border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        : "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    }`}
                    disabled={loading}
                    autoFocus
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  {isEmailValid && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <svg
                        className="w-5 h-5 text-blue-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                {emailError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {emailError}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  Use your work email address to access the form.
                </p>
              </div>

              <button
                onClick={requestOtp}
                disabled={loading || !isEmailValid}
                className={`w-full py-4 rounded-xl font-semibold text-white transition-all transform ${
                  loading || !isEmailValid
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Verification in progress...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Continue
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Étape 2 : OTP */}
          {step === "otp" && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Security Verification
                </h3>
                <p className="text-sm text-gray-600">
                  A 6-digit code has been sent to
                  <br />
                  <span className="font-semibold text-blue-600">{email}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
                  Verification Code
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && otp.length === 6 && !loading) {
                      verifyOtp();
                    }
                  }}
                  maxLength={6}
                  className="w-full px-4 py-5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none text-center text-3xl tracking-[0.5em] font-bold transition-all"
                  disabled={loading}
                  autoFocus
                />
                <p className="text-center text-sm text-gray-500 mt-2">
                  Enter the 6-digit code
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={verifyOtp}
                  disabled={loading || otp.length !== 6}
                  className={`w-full py-4 rounded-xl font-semibold text-white transition-all transform ${
                    loading || otp.length !== 6
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-700 hover:to-teal-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      VVerification in progress...
                    </span>
                  ) : (
                    "Vérifier le code"
                  )}
                </button>

                <button
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setMessage("");
                  }}
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  ← Return
                </button>
              </div>
            </div>
          )}

          {/* Étape 3 : Formulaire (partie 1 - continued in next file due to length) */}
          {step === "form" && carData && (
            <div className="space-y-6">
              {/* Informations CAR - Compact Version */}
              <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-cyan-50 rounded-2xl p-6 space-y-4 border border-blue-200 shadow-lg">
                {/* Basic Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-600 text-xs uppercase tracking-wide mb-1">
                      Audit Number
                    </h3>
                    <p className="text-gray-900 font-medium">
                      {carData.audit_number}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-600 text-xs uppercase tracking-wide mb-1">
                      Auditee Name
                    </h3>
                    <p className="text-gray-900 font-medium">
                      {carData.auditee_name}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-600 text-xs uppercase tracking-wide mb-1">
                      Plant
                    </h3>
                    <p className="text-gray-900 font-medium">
                      {carData.audit_plant}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-600 text-xs uppercase tracking-wide mb-1">
                      Questionnaire
                    </h3>
                    <p className="text-gray-900 font-medium">
                      {carData.audit_type}
                    </p>
                  </div>
                </div>

                <div className="border-t border-blue-200/60"></div>

                {/* Raison - Compact */}
                <div className="bg-gradient-to-r from-blue-300 to-blue-300 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="bg-blue-600 rounded p-1.5">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-sm mb-1">
                        Reason of the Non-Conformity
                      </h3>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {carData.reason_why}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Date and Finding - Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date limite */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-blue-600 rounded p-1.5">
                        <svg
                          className="w-3.5 h-3.5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <h3 className="font-bold text-gray-900 text-xs">
                        Due Date
                      </h3>
                    </div>
                    <p className="text-gray-900 font-semibold ml-7">
                      {carData.due_date}
                    </p>
                  </div>

                  {/* Constat (Finding) */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200 md:col-span-2">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="bg-amber-600 rounded p-1.5">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-sm mb-1">
                          Finding
                        </h3>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {carData.finding}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Solution textarea */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Implemented Solution *
                </label>
                <textarea
                  value={implementedSolution}
                  onChange={(e) => setImplementedSolution(e.target.value)}
                  rows={5}
                  placeholder="Decribe in detail the actions taken to address the issue...
Example:
- Actions taken
- People involved
- Implementation timeline
- Expected outcomes
"
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none resize-none transition-all"
                  disabled={loading}
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    Describe in detail the actions taken to address the issue.
                  </p>
                  <p
                    className={`text-xs font-medium ${
                      implementedSolution.length < 50
                        ? "text-gray-400"
                        : "text-blue-600"
                    }`}
                  >
                    {implementedSolution.length} caracters
                  </p>
                </div>
              </div>

              {/* Section d'upload de fichiers */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Justify the implemented solution with supporting documents *
                </label>

                {selectedFiles.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <svg
                            className="w-5 h-5 text-gray-400 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className="w-full flex flex-col items-center px-4 py-6 bg-white border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span className="mt-2 text-sm font-medium text-gray-600">
                    Click to upload files
                  </span>
                  <span className="mt-1 text-xs text-gray-500">
                    PDF, JPG, PNG, DOC, XLS (max 10MB)
                  </span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
              </div>

              {/* Bouton de soumission */}
              <button
                onClick={submitForm}
                disabled={loading || !implementedSolution.trim()}
                className={`w-full py-4 rounded-xl font-semibold text-white transition-all transform ${
                  loading || !implementedSolution.trim()
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submission in progress...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Submit Solution
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Étape 4 : Soumis */}
          {step === "submitted" && (
            <div className="text-center space-y-6 py-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-800 to-blue-900 rounded-full mb-4 animate-pulse">
                <svg
                  className="w-14 h-14 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  Form already submitted
                </h3>
                <p className="text-gray-600">
                  Your corrective action has been recorded on{" "}
                  <span className="font-bold text-blue-600">
                    {submittedDate}
                  </span>
                </p>
              </div>

              {(implementedSolution || carData?.implemented_solution) && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 text-left border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Solution submitted
                  </h4>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {implementedSolution || carData?.implemented_solution}
                  </p>
                </div>
              )}

              {carData && carData.documents && carData.documents.length > 0 && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 text-left border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Documents joints ({carData.documents.length})
                  </h4>
                  <div className="space-y-2">
                    {carData.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between bg-white p-3 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <svg
                            className="w-5 h-5 text-gray-400 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.filename}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(doc.size)}
                            </p>
                          </div>
                        </div>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 p-2"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-blue-800 font-medium text-left">
                    If you need to modify your response, please contact the
                    AVOCARBON Quality team.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="text-center mt-8 fade-in-up"
          style={{ animationDelay: "0.4s" }}
        >
          <p className="text-sm text-white">
            © 2025 AVOCARBON - Audit Track - équipe Qualité
          </p>
        </div>
      </div>
    </div>
  );
};
