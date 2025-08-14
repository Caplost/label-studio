import { useCallback, useEffect, useState } from "react";
import { Button, Switch } from "@humansignal/ui";
import { Label } from "../../components/Form";
import { Spinner } from "../../components/Spinner/Spinner";
import { ErrorWrapper } from "../../components/Error/Error";
import { useAPI } from "../../providers/ApiProvider";
import { useProject } from "../../providers/ProjectProvider";
import { cn } from "../../utils/bem";

export const Contributors = () => {
  const { project } = useProject();
  const api = useAPI();
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(new Set());
  const [error, setError] = useState(null);

  const loadContributors = useCallback(async () => {
    if (!project?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.callApi("getProjectContributors", {
        params: { pk: project.id }
      });
      
      setContributors(response || []);
    } catch (err) {
      console.error("Failed to load contributors:", err);
      setError("Failed to load contributors. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [api, project?.id]);

  useEffect(() => {
    loadContributors();
  }, [loadContributors]);

  const handleToggleContributor = useCallback(async (contributorUserId, currentStatus) => {
    setUpdating(prev => new Set(prev).add(contributorUserId));
    
    try {
      if (currentStatus) {
        // Remove contributor from project
        // The API should handle finding the membership by user_id
        await api.callApi("removeProjectMember", {
          params: { 
            pk: project.id,
            member_pk: contributorUserId  // Use user_id directly
          }
        });
      } else {
        // Add contributor to project
        await api.callApi("addProjectMember", {
          params: { pk: project.id },
          body: { user_id: contributorUserId, enabled: true }
        });
      }
      
      // Reload contributors list
      await loadContributors();
    } catch (err) {
      console.error("Failed to update contributor:", err);
      setError("Failed to update contributor access. Please try again.");
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(contributorUserId);
        return newSet;
      });
    }
  }, [api, project?.id, loadContributors]);

  if (loading) {
    return (
      <div className={cn("simple-settings")}>
        <h1>Contributors</h1>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <Spinner size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("simple-settings")}>
      <h1>Contributors</h1>
      <Label description="Manage contributor access to this project. Contributors with 'Yes' can view and annotate tasks in this project." />

      {error && (
        <ErrorWrapper>
          {error}
        </ErrorWrapper>
      )}

      {contributors.length === 0 ? (
        <div style={{ marginTop: 24, padding: 20, textAlign: "center", color: "#666" }}>
          No contributors found in your organization.
        </div>
      ) : (
        <div style={{ marginTop: 24 }}>
          <div className={cn("contributors-header")} style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr auto auto", 
            gap: 16, 
            padding: "12px 16px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px 8px 0 0",
            fontWeight: "600",
            borderBottom: "1px solid #e9ecef"
          }}>
            <span>Contributor Email</span>
            <span>Role</span>
            <span>Access</span>
          </div>
          
          {contributors.map((contributor) => {
            const isUpdating = updating.has(contributor.user.id);
            
            return (
              <div 
                key={contributor.user.id}
                className={cn("contributor-row")}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  gap: 16,
                  padding: "16px",
                  borderBottom: "1px solid #e9ecef",
                  alignItems: "center",
                  backgroundColor: isUpdating ? "#f8f9fa" : "white"
                }}
              >
                <div>
                  <div style={{ fontWeight: "500" }}>
                    {contributor.user.email}
                  </div>
                  {(contributor.user.first_name || contributor.user.last_name) && (
                    <div style={{ fontSize: "0.9em", color: "#666" }}>
                      {contributor.user.first_name} {contributor.user.last_name}
                    </div>
                  )}
                </div>
                
                <div style={{ 
                  textTransform: "capitalize",
                  color: "#666",
                  fontSize: "0.9em"
                }}>
                  {contributor.role}
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isUpdating && <Spinner size={16} />}
                  <Switch
                    checked={contributor.is_member}
                    disabled={isUpdating}
                    onChange={() => handleToggleContributor(contributor.user.id, contributor.is_member)}
                    size="small"
                  />
                  <span style={{ 
                    fontSize: "0.9em", 
                    color: contributor.is_member ? "#28a745" : "#dc3545",
                    fontWeight: "500"
                  }}>
                    {contributor.is_member ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div style={{ marginTop: 24, padding: 16, backgroundColor: "#f8f9fa", borderRadius: 8 }}>
        <div style={{ fontSize: "0.9em", color: "#666" }}>
          <strong>Note:</strong> Only users with the "Contributor" role will appear in this list. 
          Contributors added to this project will have access to all tasks within this project.
        </div>
      </div>
    </div>
  );
};

Contributors.title = "Contributors";
Contributors.path = "/contributors";
