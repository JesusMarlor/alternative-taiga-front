export interface User {
  id: number;
  username: string;
  full_name: string;
  full_name_display: string;
  color?: string;
  bio?: string;
  photo?: string | null;
  big_photo?: string | null;
  gravatar_id?: string;
  email?: string;
  roles?: string[];
  auth_token?: string;
  refresh?: string;
}

export interface AuthResponse extends User {
  auth_token: string;
  refresh: string;
}

export interface StatusItem {
  id: number;
  name: string;
  slug?: string;
  order: number;
  is_closed: boolean;
  color: string;
  project_id?: number;
  wip_limit?: number | null;
}

export interface PriorityItem {
  id: number;
  name: string;
  color: string;
  order: number;
}

export interface SeverityItem {
  id: number;
  name: string;
  color: string;
  order: number;
}

export interface TypeItem {
  id: number;
  name: string;
  color: string;
  order: number;
}

export interface PointItem {
  id: number;
  name: string;
  order: number;
  value: number | null;
}

export interface RoleItem {
  id: number;
  name: string;
  slug?: string;
  order: number;
  computable?: boolean;
  permissions?: string[];
  project?: number;
}

export interface Webhook {
  id: number;
  project: number;
  name: string;
  url: string;
  key?: string;
  created_date?: string;
  modified_date?: string;
  logs_counter?: number;
}

export interface WebhookLog {
  id: number;
  webhook: number;
  url: string;
  status: number;
  created_date: string;
}


export interface ProjectMember {
  id: number;
  user: number;
  project: number;
  role: number;
  role_name: string;
  full_name: string;
  username?: string;
  color?: string;
  photo?: string | null;
  gravatar_id?: string;
  is_admin: boolean;
  email?: string;
  user_email?: string;
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  description: string;
  created_date: string;
  modified_date: string;
  owner: {
    id: number;
    username: string;
    full_name_display: string;
    photo?: string | null;
  };
  members: number[] | ProjectMember[];
  is_epics_activated: boolean;
  is_backlog_activated: boolean;
  is_kanban_activated: boolean;
  is_wiki_activated: boolean;
  is_issues_activated: boolean;
  is_private: boolean;
  logo_big_url?: string | null;
  logo_small_url?: string | null;
  my_permissions: string[];
  total_milestones?: number | null;
  total_story_points?: number | null;
  total_activity?: number;
  tags?: string[];
  tags_colors?: Record<string, string>;

  default_epic_status?: number;
  default_points?: number;
  default_us_status?: number;
  default_task_status?: number;
  default_priority?: number;
  default_severity?: number;
  default_issue_status?: number;
  default_issue_type?: number;

  // Schema configs
  us_statuses?: StatusItem[];
  task_statuses?: StatusItem[];
  issue_statuses?: StatusItem[];
  epic_statuses?: StatusItem[];
  points?: PointItem[];
  priorities?: PriorityItem[];
  severities?: SeverityItem[];
  issue_types?: TypeItem[];
  roles?: RoleItem[];
  milestones?: Milestone[];
}

export interface UserStory {
  id: number;
  ref: number;
  subject: string;
  description?: string;
  description_html?: string;
  status: number;
  status_extra_info?: {
    name: string;
    color: string;
    is_closed: boolean;
  };
  assigned_to?: number | null;
  assigned_to_extra_info?: {
    id: number;
    username: string;
    full_name_display: string;
    photo?: string | null;
  } | null;
  owner?: number;
  owner_extra_info?: {
    id: number;
    username: string;
    full_name_display: string;
    photo?: string | null;
  };
  project: number;
  project_extra_info?: {
    id: number;
    name: string;
    slug: string;
    logo_small_url?: string | null;
  };
  milestone?: number | null;
  milestone_name?: string | null;
  milestone_slug?: string | null;
  points?: Record<string, number>;
  total_points?: number | null;
  kanban_order?: number;
  backlog_order?: number;
  sprint_order?: number;
  tags?: string[];
  is_closed: boolean;
  is_blocked?: boolean;
  blocked_note?: string;
  client_requirement?: boolean;
  team_requirement?: boolean;
  version: number;
  created_date: string;
  modified_date: string;
  tasks?: Task[];
  epics?: Array<{
    id: number;
    ref: number;
    subject: string;
    color: string;
  }> | null;
}

export interface Milestone {
  id: number;
  name: string;
  slug: string;
  project: number;
  estimated_start: string;
  estimated_finish: string;
  closed: boolean;
  disponibility?: number;
  order: number;
  total_points?: number;
  closed_points?: number | null;
  user_stories?: UserStory[];
}

export interface Task {
  id: number;
  ref: number;
  subject: string;
  description?: string;
  user_story: number | null;
  user_story_extra_info?: {
    id: number;
    ref: number;
    subject: string;
  } | null;
  status: number;
  status_extra_info?: {
    name: string;
    color: string;
    is_closed: boolean;
  };
  assigned_to?: number | null;
  assigned_to_extra_info?: {
    id: number;
    username: string;
    full_name_display: string;
    photo?: string | null;
  } | null;
  is_closed: boolean;
  project: number;
  created_date: string;
  modified_date: string;
  version: number;
}

export interface Issue {
  id: number;
  ref: number;
  subject: string;
  description?: string;
  status: number;
  status_extra_info?: {
    name: string;
    color: string;
    is_closed: boolean;
  };
  priority: number;
  priority_extra_info?: {
    name: string;
    color: string;
  };
  severity: number;
  severity_extra_info?: {
    name: string;
    color: string;
  };
  type: number;
  type_extra_info?: {
    name: string;
    color: string;
  };
  assigned_to?: number | null;
  assigned_to_extra_info?: {
    id: number;
    username: string;
    full_name_display: string;
    photo?: string | null;
  } | null;
  project: number;
  milestone?: number | null;
  milestone_name?: string | null;
  is_closed: boolean;
  is_blocked?: boolean;
  blocked_note?: string;
  version?: number;
  tags?: string[];
  created_date: string;
  modified_date: string;
}

export interface Epic {
  id: number;
  ref: number;
  subject: string;
  description?: string;
  color: string;
  status: number;
  status_extra_info?: {
    name: string;
    color: string;
    is_closed: boolean;
  };
  assigned_to?: number | null;
  assigned_to_extra_info?: {
    id: number;
    username: string;
    full_name_display: string;
    photo?: string | null;
  } | null;
  project: number;
  user_stories_counts?: {
    progress: number;
    total: number;
  };
  created_date: string;
  modified_date: string;
}

export interface WikiPage {
  id: number;
  slug: string;
  content: string;
  html?: string;
  project: number;
  created_date: string;
  modified_date: string;
  last_modifier?: number;
  version?: number;
}
