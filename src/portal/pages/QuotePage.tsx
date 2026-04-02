import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { useMyApplications, useApplication, useFormResponses, useApplicationQuestions } from "../hooks/usePortalData";
import { RateSheetQuote } from "../components/RateSheetQuote";

export const QuotePage = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: applications = [] } = useMyApplications();
  const id = paramId || applications[0]?.id;
  const { data: app, isLoading } = useApplication(id);
  const templateId = app?.upload_links?.template_id;
  const { data: questions = [] } = useApplicationQuestions(templateId);
  const { data: responses = {} } = useFormResponses(id);

  if (isLoading) return <p style={{ fontSize: 14, color: "#9ca3af", textAlign: "center", padding: 48 }}>Loading...</p>;
  if (!app) return <p style={{ fontSize: 14, color: "#9ca3af", textAlign: "center", padding: 48 }}>Application not found.</p>;

  const isSubmitted = app.status === "submitted" || app.status === "quoted";
  const loanAmountQ = questions.find((q) => q.label.toLowerCase().includes("loan amount"));
  const loanAmount = loanAmountQ ? parseFloat(responses[loanAmountQ.id]) || 0 : 0;

  if (!isSubmitted) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: 32 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Clock style={{ width: 28, height: 28, color: "#9ca3af" }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111", marginBottom: 6 }}>Quote Not Available Yet</h2>
          <p style={{ fontSize: 14, color: "#9ca3af", maxWidth: 340, margin: "0 auto 20px" }}>
            Complete and submit your application to receive rate options from your loan officer.
          </p>
          <button onClick={() => navigate(`/portal/application/${id}`)}
            style={{ fontSize: 14, color: "#3b82f6", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            Go to Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px 48px" }}>
      <button onClick={() => navigate("/portal")}
        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 20, fontFamily: "inherit" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#111")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}>
        <ArrowLeft style={{ width: 14, height: 14 }} /> Back to Overview
      </button>

      <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 4 }}>Your Quote</h1>
      <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 24 }}>Estimated rate options based on your application</p>

      {loanAmount > 0 ? (
        <RateSheetQuote loanAmount={loanAmount} />
      ) : (
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 32, textAlign: "center" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 6 }}>Application Received</h3>
          <p style={{ fontSize: 14, color: "#9ca3af" }}>
            Your loan officer is reviewing your application and will follow up with personalized rate options shortly.
          </p>
        </div>
      )}
    </div>
  );
};
