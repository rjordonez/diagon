import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useClaimInvite } from "../hooks/usePortalData";

export const InvitePage = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const claimInvite = useClaimInvite();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Redirect to borrower login with redirect back
      navigate(`/portal/login?redirect=/portal/invite/${token}`);
      return;
    }

    // User is logged in — claim the invite
    claimInvite.mutateAsync(token!)
      .then((applicationId) => {
        navigate(`/portal/application/${applicationId}`);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, [user, authLoading, token]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h1 className="text-lg font-semibold mb-1">Invalid Invite</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
};
