import { useState } from "react";

/**
 * Email-to-be-sent page
 * - Shows email preview
 * - Contains API call
 * - One button to send
 */

async function sendAuditResultEmail(payload: {
  to: string[];
  cc?: string[];
  subject: string;
  bodyHtml: string;
}) {
  const res = await fetch("/api/audits/send-result-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export default function AuditResultEmailPage() {
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 👉 This is the ACTUAL email content
  const subject = "Audit report VDA 6.3 – Evaluation of quality capability";

  const bodyHtml = `
  <div style="font-family:Arial, sans-serif; max-width:900px; margin:auto;">
    <h2>Audit report VDA 6.3 – Evaluation of quality capability</h2>

    <p><strong>Supplier:</strong> MAHLE</p>
    <p><strong>Date:</strong> 10/09/2024</p>
    <p><strong>Location:</strong> Tunisia</p>

    <hr/>

    <h3>Audit result</h3>
    <p><strong>EG:</strong> 94% &nbsp;&nbsp; <strong>Rating:</strong> A</p>

    <h3>Summary of the audit carried out</h3>
    <p>
      L’audit a permis d’identifier plusieurs non-conformités et points
      d’amélioration concernant la gestion des matières premières, des outils,
      des pièces de rechange et les plans de réaction aux incidents.
    </p>

    <h3>Strengths</h3>
    <ul>
      <li>High-tech equipment clearly identifiable</li>
      <li>Well organized production area</li>
      <li>Detailed work instructions</li>
    </ul>

    <h3>Opportunities for improvement</h3>
    <ul>
      <li>Improve separation of inspected materials</li>
      <li>Additional operator training</li>
      <li>Better alignment PFMEA / Control Plan</li>
    </ul>

    <hr/>
    <p style="font-size:12px;color:#666">
      Classification scale: A = 90–100%, B = 80–89%, C &lt; 80%
    </p>
  </div>
  `;

  const onSend = async () => {
    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      await sendAuditResultEmail({
        to: ["auditee@example.com"],
        subject,
        bodyHtml,
      });

      setSuccess("Email sent successfully to auditee.");
    } catch (e: any) {
      setError(e.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Email to be sent</h1>
      <p className="text-sm text-slate-600">
        Please review the email before sending it to the auditee.
      </p>

      {/* Email preview */}
      <div className="border rounded-xl shadow-sm bg-white">
        <div className="border-b px-4 py-2 bg-slate-50">
          <p className="text-sm">
            <strong>Subject:</strong> {subject}
          </p>
        </div>

        <div
          className="p-6 prose max-w-none"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      </div>

      {/* Status */}
      {success && <p className="text-green-600 font-semibold">{success}</p>}
      {error && <p className="text-red-600 font-semibold">{error}</p>}

      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={onSend}
          disabled={sending}
          className={`px-6 py-3 rounded-lg font-semibold ${
            sending
              ? "bg-slate-300 text-slate-600"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {sending ? "Sending…" : "Send email"}
        </button>
      </div>
    </div>
  );
}
