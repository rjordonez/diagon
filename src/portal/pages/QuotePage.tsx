import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { useMyApplications, useApplication, useFormResponses, useApplicationQuestions } from "../hooks/usePortalData";
import { RateSheetQuote } from "../components/RateSheetQuote";

export const QuotePage = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const { data: applications = [] } = useMyApplications();
  const id = paramId || applications[0]?.id;
  const { data: app, isLoading } = useApplication(id);
  const templateId = app?.upload_links?.template_id;
  const { data: questions = [] } = useApplicationQuestions(templateId);
  const { data: responses = {} } = useFormResponses(id);

  if (isLoading) return <p className="text-sm text-muted-foreground py-12 text-center">Loading...</p>;
  if (!app) return <p className="text-sm text-muted-foreground py-12 text-center">Application not found.</p>;

  const isSubmitted = app.status === "submitted" || app.status === "quoted";

  // Try to find loan amount from form responses
  const loanAmountQ = questions.find((q) => q.label.toLowerCase().includes("loan amount"));
  const loanAmount = loanAmountQ ? parseFloat(responses[loanAmountQ.id]) || 0 : 0;

  if (!isSubmitted) {
    return (
      <div className="py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Clock className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold mb-1">Quote Not Available Yet</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
          Complete and submit your application to receive rate options from your loan officer.
        </p>
        <Link to={`/portal/application/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-foreground font-medium hover:underline">
          Go to Application
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <Link to="/portal" className="text-xs text-muted-foreground flex items-center gap-1 mb-3 hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to Overview
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Your Quote</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Estimated rate options based on your application</p>
      </div>

      {loanAmount > 0 ? (
        <RateSheetQuote loanAmount={loanAmount} />
      ) : (
        <div className="border border-border rounded-xl p-6 text-center">
          <h3 className="text-sm font-semibold mb-1">Application Received</h3>
          <p className="text-sm text-muted-foreground">
            Your loan officer is reviewing your application and will follow up with personalized rate options shortly.
          </p>
        </div>
      )}
    </div>
  );
};
