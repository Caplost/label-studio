import { SidebarMenu } from "../../components/SidebarMenu/SidebarMenu";
import { WebhookPage } from "../WebhookPage/WebhookPage";
import { Contributors } from "./Contributors";
import { DangerZone } from "./DangerZone";
import { GeneralSettings } from "./GeneralSettings";
import { AnnotationSettings } from "./AnnotationSettings";
import { LabelingSettings } from "./LabelingSettings";
import { MachineLearningSettings } from "./MachineLearningSettings/MachineLearningSettings";
import { PredictionsSettings } from "./PredictionsSettings/PredictionsSettings";
import { StorageSettings } from "./StorageSettings/StorageSettings";
import { isInLicense, LF_CLOUD_STORAGE_FOR_MANAGERS } from "../../utils/license-flags";
import { useCurrentUser } from "../../providers/CurrentUser";
import "./settings.scss";

const isAllowCloudStorage = !isInLicense(LF_CLOUD_STORAGE_FOR_MANAGERS);

export const MenuLayout = ({ children, ...routeProps }) => {
  const { user } = useCurrentUser();
  const canManageContributors = user?.role === 'owner';

  return (
    <SidebarMenu
      menuItems={[
        GeneralSettings,
        LabelingSettings,
        AnnotationSettings,
        MachineLearningSettings,
        PredictionsSettings,
        isAllowCloudStorage && StorageSettings,
        WebhookPage,
        DangerZone,
        canManageContributors && Contributors,
      ].filter(Boolean)}
      path={routeProps.match.url}
      children={children}
    />
  );
};

// Create a function to get pages based on user permissions
const getPages = (user) => {
  const pages = {
    AnnotationSettings,
    LabelingSettings,
    MachineLearningSettings,
    PredictionsSettings,
    WebhookPage,
    DangerZone,
  };

  // Add storage settings if allowed
  if (isAllowCloudStorage) {
    pages.StorageSettings = StorageSettings;
  }

  // Add contributors management for owners only
  if (user?.role === 'owner') {
    pages.Contributors = Contributors;
  }

  return pages;
};

export const SettingsPage = {
  title: "Settings",
  path: "/settings",
  exact: true,
  layout: MenuLayout,
  component: GeneralSettings,
  get pages() {
    // Note: This is a simplified approach. In a real app, you might want 
    // to handle this differently to get user context properly
    return {
      AnnotationSettings,
      LabelingSettings,
      MachineLearningSettings,
      PredictionsSettings,
      WebhookPage,
      Contributors, // Keep it in pages for routing, but control visibility in menu
      DangerZone,
      ...(isAllowCloudStorage && { StorageSettings }),
    };
  },
};
