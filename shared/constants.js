/**
 * VYNEX Shared Constants
 * Single source of truth for Roles, Permissions, Statuses and Actions.
 */

const ROLES = {
  ADMIN: 'ADMIN',
  BUSINESS: 'BUSINESS',
  USER: 'USER'
};

const PERMISSIONS = {
  ADMIN: ['manage_users', 'manage_permissions', 'view_all_logs', 'view_metrics', 'dispatch_tasks', 'write_reports', 'user_access', 'manage_digital_card', 'view_card_analytics', 'export_card_leads'],
  BUSINESS: ['view_metrics', 'dispatch_tasks', 'write_reports', 'user_access', 'view_card_analytics'],
  USER: ['user_access', 'manage_digital_card', 'view_card_analytics']
};

const FLOW_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

const EVENT_TYPES = {
  AUTH_LOGIN: 'auth/login',
  AUTH_LOGOUT: 'auth/logout',
  FLOW_TRIGGER: 'flow/trigger',
  FLOW_COMPLETE: 'flow/complete',
  METRICS_UPDATE: 'metrics/update',
  SYSTEM_ALERT: 'system/alert'
};

module.exports = {
  ROLES,
  PERMISSIONS,
  FLOW_STATUS,
  EVENT_TYPES
};
