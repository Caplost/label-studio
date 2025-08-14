import { useCallback, useEffect, useState } from "react";
import { Spinner } from "../../components/Spinner/Spinner";
import { ErrorWrapper } from "../../components/Error/Error";
import { useAPI } from "../../providers/ApiProvider";
import { useCurrentUser } from "../../providers/CurrentUser";
import { useProject } from "../../providers/ProjectProvider";
import { cn } from "../../utils/bem";

// Try different import paths for UI components
let Switch, Label, Button;
try {
  const UI = require("@humansignal/ui");
  Switch = UI.Switch;
  Button = UI.Button;
  console.log('✅ Imported Switch and Button from @humansignal/ui:', { Switch: typeof Switch, Button: typeof Button });
} catch (err) {
  console.error('❌ Failed to import from @humansignal/ui:', err);
}

try {
  const Form = require("../../components/Form");
  Label = Form.Label;
  console.log('✅ Imported Label from components/Form:', { Label: typeof Label });
} catch (err) {
  console.error('❌ Failed to import Label from components/Form:', err);
  // Fallback to a simple div-based Label
  Label = ({ description }) => <div style={{ marginBottom: 16, color: "#666" }}>{description}</div>;
}

// Fallback Switch component if import fails
if (!Switch || typeof Switch !== 'function') {
  console.warn('⚠️ Switch component not available, using fallback');
  Switch = ({ checked, disabled, onChange, size }) => (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      style={{
        padding: '4px 8px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: checked ? '#007bff' : '#fff',
        color: checked ? '#fff' : '#000',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    >
      {checked ? 'ON' : 'OFF'}
    </button>
  );
}

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
    apiType: typeof api,
    hasCallApi: typeof api?.callApi === 'function',
    apiKeys: api ? Object.keys(api).slice(0, 5) : [],
    configKeys: api?.config ? Object.keys(api.config).slice(0, 10) : []
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
    console.log('🔄 Toggle contributor project access:', {
      contributorUserId,
      projectId: project?.id,
      projectTitle: project?.title,
      currentStatus: currentStatus ? 'HAS ACCESS' : 'NO ACCESS',
      action: currentStatus ? 'REMOVE ACCESS FROM PROJECT' : 'GRANT ACCESS TO PROJECT'
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
    contributorsList: contributors.map((c, index) => ({
      index,
      id: c?.user?.id,
      email: c?.user?.email,
      role: c?.role,
      is_member: c?.is_member,
      hasUser: !!c?.user,
      rawContributor: c
    }))
  });

  // Validate components before rendering
  console.log('🧩 Component Validation:', {
    SwitchComponent: typeof Switch,
    SpinnerComponent: typeof Spinner,
    ErrorWrapperComponent: typeof ErrorWrapper,
    LabelComponent: typeof Label
  });

  return (
    <div className={cn("simple-settings")}>
      <h1>Contributors</h1>
      <Label description="Manage contributor access to this project. All users with 'Contributor' role are listed below. Use the switch to grant/revoke access to this specific project." />

      {error && (
        <ErrorWrapper>
          {error}
        </ErrorWrapper>
      )}

      <div style={{ marginBottom: 16, fontSize: "0.9em", color: "#666" }}>
        <strong>Project:</strong> {project?.title || 'Current Project'} (ID: {project?.id})
        <br />
        <strong>Total Contributors:</strong> {contributors.length}
      </div>

      {contributors.length === 0 ? (
        <div style={{ marginTop: 24, padding: 20, textAlign: "center", color: "#666" }}>
          <p><strong>No contributors found in your organization.</strong></p>
          <p style={{ fontSize: "0.9em", marginTop: 10 }}>
            To see contributors here, you need to:
          </p>
          <ol style={{ textAlign: "left", maxWidth: "400px", margin: "10px auto" }}>
            <li>Create users with "Contributor" role during signup</li>
            <li>Ensure they are members of your organization</li>
            <li>Then you can manage their access to specific projects here</li>
          </ol>
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
            <span>User Role</span>
            <span>Project Access</span>
          </div>
          
          <div style={{ 
            padding: "8px 16px", 
            backgroundColor: "#e3f2fd", 
            fontSize: "0.85em", 
            color: "#1565c0",
            borderBottom: "1px solid #e9ecef"
          }}>
            All users with 'Contributor' role are shown below. Toggle 'Project Access' to grant/revoke access to <strong>{project?.title}</strong>
          </div>
          
          {(() => {
            try {
              return contributors.map((contributor, index) => {
            console.log(`🎯 Rendering contributor ${index}:`, {
              email: contributor?.user?.email,
              name: `${contributor?.user?.first_name || ''} ${contributor?.user?.last_name || ''}`.trim(),
              role: contributor?.role,
              hasProjectAccess: contributor?.is_member ? 'YES - Can access this project' : 'NO - Cannot access this project',
              userId: contributor?.user?.id
            });

            // Safety check - skip if contributor data is invalid
            if (!contributor || !contributor.user || !contributor.user.id) {
              console.warn(`⚠️ Skipping invalid contributor at index ${index}:`, contributor);
              return null;
            }

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
                    {contributor.user.email || 'No email'}
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
                  {contributor.role || 'Unknown'}
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isUpdating && <Spinner size={16} />}
                  <Switch
                    checked={!!contributor.is_member}
                    disabled={isUpdating}
                    onChange={() => handleToggleContributor(contributor.user.id, contributor.is_member)}
                    size="small"
                  />
                  <span style={{ 
                    fontSize: "0.9em", 
                    color: contributor.is_member ? "#28a745" : "#dc3545",
                    fontWeight: "500",
                    minWidth: "60px"
                  }}>
                    {contributor.is_member ? "✓ Access" : "✗ No Access"}
                  </span>
                </div>
              </div>
            );
              }).filter(Boolean);
            } catch (error) {
              console.error('❌ Error rendering contributors list:', error);
              return (
                <div style={{ padding: 20, color: '#dc3545', textAlign: 'center' }}>
                  Error rendering contributors list: {error.message}
                  <br />
                  <small>Please check console for details</small>
                </div>
              );
            }
          })()}
        </div>
      )}
      
      <div style={{ marginTop: 24, padding: 16, backgroundColor: "#f8f9fa", borderRadius: 8 }}>
        <div style={{ fontSize: "0.9em", color: "#666" }}>
          <strong>How it works:</strong>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            <li>This page shows <strong>all users with "Contributor" role</strong> in your organization</li>
            <li>Use the <strong>switch button</strong> to grant/revoke access to <strong>this specific project</strong></li>
            <li>Contributors with "✓ Access" can view and annotate <strong>all tasks</strong> in this project</li>
            <li>Contributors with "✗ No Access" cannot see this project at all</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

Contributors.title = "Contributors";
Contributors.path = "/contributors";
