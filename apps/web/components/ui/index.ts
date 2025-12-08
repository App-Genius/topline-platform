// UI Component Library
// Pure presentational components with no business logic

// Core Components
export { Modal, type ModalProps } from "./Modal";
export { Button, IconButton, type ButtonProps, type IconButtonProps } from "./Button";
export {
  Alert,
  ErrorAlert,
  SuccessAlert,
  type AlertProps,
} from "./Alert";
export { Badge, StatusBadge, RoleBadge, CountBadge, type BadgeProps } from "./Badge";
export {
  LoadingSpinner,
  PageLoading,
  type LoadingSpinnerProps,
} from "./LoadingSpinner";
export {
  EmptyState,
  NoDataFound,
  NoSearchResults,
  type EmptyStateProps,
} from "./EmptyState";

// Form Components
export { FormField, TextAreaField, type FormFieldProps, type TextAreaFieldProps } from "./FormField";
export {
  Select,
  CheckboxGroup,
  type SelectProps,
  type SelectOption,
  type CheckboxGroupProps,
} from "./Select";
export { SearchInput, useDebouncedSearch, type SearchInputProps } from "./SearchInput";

// Data Display Components
export {
  DataTable,
  type DataTableProps,
  type Column,
} from "./DataTable";
export { Tabs, TabPanel, type TabsProps, type Tab, type TabPanelProps } from "./Tabs";
export {
  KpiCard,
  MiniKpi,
  KpiRow,
  type KpiCardProps,
  type MiniKpiProps,
  type KpiRowProps,
} from "./KpiCard";

// Dialog Components
export {
  ConfirmDialog,
  DeleteConfirmDialog,
  type ConfirmDialogProps,
} from "./ConfirmDialog";
