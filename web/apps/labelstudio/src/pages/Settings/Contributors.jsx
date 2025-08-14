import { useCallback, useEffect, useState } from "react";
import { Button, Switch } from "@humansignal/ui";
import { Label } from "../../components/Form";
import { Spinner } from "../../components/Spinner/Spinner";
import { ErrorWrapper } from "../../components/Error/Error";
import { useAPI } from "../../providers/ApiProvider";
import { useCurrentUser } from "../../providers/CurrentUser";
import { useProject } from "../../providers/ProjectProvider";
import { cn } from "../../utils/bem";

export const Contributors = () => {
  // ✅ All hooks must be at the top level (React Rules of Hooks)
  const { project } = useProject();
  const { user } = useCurrentUser();
  const api = useAPI();
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(new Set());
  const [error, setError] = useState(null);

  // Debug logging
  console.log('🔍 Contributors Component Loading:', {
    userRole: user?.role,
    userEmail: user?.email,
    projectId: project?.id,
    projectTitle: project?.title,
    loading,
    contributorsCount: contributors.length,
    error,
    apiAvailable: !!api,
    hasCallApi: typeof api?.callApi === 'function'
  });

  // Check if API configuration exists
  console.log('🔧 API Configuration Check:', {
    hasGetProjectContributors: !!api?.config?.getProjectContributors,
    hasAddProjectMember: !!api?.config?.addProjectMember,
    hasRemoveProjectMember: !!api?.config?.removeProjectMember,
    apiConfigSample: Object.keys(api?.config || {}).slice(0, 5)
  });

  const loadContributors = useCallback(async () => {
    console.log('📡 Starting loadContributors...', {
      projectId: project?.id,
      hasProject: !!project,
      hasApi: !!api
    });

    if (!project?.id) {
      console.log('❌ No project ID, skipping load');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Calling getProjectContributors API...', {
        endpoint: 'getProjectContributors',
        params: { pk: project.id }
      });
      
      const response = await api.callApi("getProjectContributors", {
        params: { pk: project.id }
      });
      
      console.log('✅ Contributors API Success:', {
        response,
        responseType: typeof response,
        isArray: Array.isArray(response),
        length: response?.length || 0
      });
      
      setContributors(response || []);
    } catch (err) {
      console.error('❌ Failed to load contributors:', {
        error: err,
        message: err.message,
        stack: err.stack,
        projectId: project?.id
      });
      setError(`Failed to load contributors: ${err.message || err}`);
    } finally {
      setLoading(false);
      console.log('🏁 loadContributors finished');
    }
  }, [project?.id, api]);

  useEffect(() => {
    console.log('🔄 useEffect triggered for loadContributors');
    loadContributors();
  }, [loadContributors]);

  // Only owners can manage contributors - check after hooks
  if (user?.role !== 'owner') {
    console.log('🚫 Access denied - user is not owner:', user?.role);
    return (
      <div className={cn("simple-settings")}>
        <h1>Contributors</h1>
        <div style={{ padding: 20, textAlign: "center", color: "#666" }}>
          You don't have permission to manage contributors. Only organization owners can access this feature.
        </div>
      </div>
    );
  }

  const handleToggleContributor = useCallback(async (contributorUserId, currentStatus) => {
    console.log('🔄 Toggle contributor starting:', {
      contributorUserId,
      currentStatus,
      projectId: project?.id,
      action: currentStatus ? 'REMOVE' : 'ADD'
    });

    if (!project?.id) {
      console.log('❌ No project ID for toggle');
      return;
    }
    
    setUpdating(prev => new Set(prev).add(contributorUserId));
    
    try {
      if (currentStatus) {
        // Remove contributor from project
        console.log('🗑️ Removing contributor from project...');
        await api.callApi("removeProjectMember", {
          params: { 
            pk: project.id,
            member_pk: contributorUserId
          }
        });
        console.log('✅ Successfully removed contributor');
      } else {
        // Add contributor to project
        console.log('➕ Adding contributor to project...');
        await api.callApi("addProjectMember", {
          params: { pk: project.id },
          body: { user_id: contributorUserId, enabled: true }
        });
        console.log('✅ Successfully added contributor');
      }
      
      // Reload contributors list directly
      console.log('🔄 Reloading contributors list...');
      const response = await api.callApi("getProjectContributors", {
        params: { pk: project.id }
      });
      console.log('✅ Reloaded contributors:', response);
      setContributors(response || []);
      
    } catch (err) {
      console.error('❌ Failed to update contributor:', {
        error: err,
        message: err.message,
        contributorUserId,
        currentStatus,
        projectId: project?.id
      });
      setError("Failed to update contributor access. Please try again.");
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(contributorUserId);
        return newSet;
      });
      console.log('🏁 Toggle contributor finished');
    }
  }, [project?.id, api]);

  if (loading) {
    console.log('⏳ Rendering loading state...');
    return (
      <div className={cn("simple-settings")}>
        <h1>Contributors</h1>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <Spinner size={32} />
        </div>
      </div>
    );
  }

  console.log('🎨 Rendering Contributors content:', {
    contributorsCount: contributors.length,
    hasError: !!error,
    contributorsList: contributors.map(c => ({
      id: c.user?.id,
      email: c.user?.email,
      role: c.role,
      is_member: c.is_member
    }))
  });

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
          <p>No contributors found in your organization.</p>
          <p style={{ fontSize: "0.9em", marginTop: 10 }}>
            To add contributors, first create users with "Contributor" role in your organization.
          </p>
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
