"""Project access control and permissions for role-based features."""

from django.contrib.auth import get_user_model
from rest_framework.permissions import BasePermission

User = get_user_model()


def is_project_owner(user):
    """Check if user has owner role"""
    return getattr(user, 'role', 'owner') == 'owner'


def is_project_contributor(user):
    """Check if user has contributor role"""
    return getattr(user, 'role', 'owner') == 'contributor'


def can_create_project(user):
    """Check if user can create projects - only owners can create projects"""
    return is_project_owner(user)


def can_import_tasks(user):
    """Check if user can import tasks - only owners can import tasks"""
    return is_project_owner(user)


def can_manage_project_contributors(user, project):
    """Check if user can manage contributors for a project - only owners can manage"""
    return is_project_owner(user)


def can_view_project(user, project):
    """Check if user can view a project"""
    if is_project_owner(user):
        # Owners can view all projects in their organization
        return True
    
    if is_project_contributor(user):
        # Contributors can only view projects they are members of
        from projects.models import ProjectMember
        return ProjectMember.objects.filter(
            user=user, 
            project=project, 
            enabled=True
        ).exists()
    
    return False


def get_accessible_projects_for_user(user, organization):
    """Get projects that a user can access based on their role"""
    from projects.models import Project, ProjectMember
    
    if is_project_owner(user):
        # Owners can see all projects in their organization
        return Project.objects.filter(organization=organization)
    
    if is_project_contributor(user):
        # Contributors can only see projects they are members of
        member_project_ids = ProjectMember.objects.filter(
            user=user, 
            enabled=True
        ).values_list('project_id', flat=True)
        
        return Project.objects.filter(
            id__in=member_project_ids,
            organization=organization
        )
    
    return Project.objects.none()


class IsProjectOwner(BasePermission):
    """Permission class to check if user is project owner"""
    
    def has_permission(self, request, view):
        return is_project_owner(request.user)


class CanManageProjectContributors(BasePermission):
    """Permission class to check if user can manage project contributors"""
    
    def has_object_permission(self, request, view, obj):
        return can_manage_project_contributors(request.user, obj)


class CanViewProject(BasePermission):
    """Permission class to check if user can view project"""
    
    def has_object_permission(self, request, view, obj):
        return can_view_project(request.user, obj)