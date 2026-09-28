-- MySQL 8+ schema.
-- mysql -u USER -p -e "CREATE DATABASE IF NOT EXISTS task_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
-- mysql -u USER -p task_management < mysql/schema.sql

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(191) DEFAULT NULL,
  email VARCHAR(191) NOT NULL,
  password_hash TEXT,
  role VARCHAR(32) NOT NULL DEFAULT 'member',
  initials VARCHAR(8) NOT NULL,
  color VARCHAR(32) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY users_email_key (email),
  UNIQUE KEY users_username_key (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `groups` (
  id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS group_members (
  id VARCHAR(36) NOT NULL,
  group_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY group_members_group_user_key (group_id, user_id),
  KEY group_members_user_idx (user_id),
  KEY group_members_group_idx (group_id),
  CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES `groups` (id) ON DELETE CASCADE,
  CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  color VARCHAR(64) NOT NULL,
  share_code VARCHAR(64) NOT NULL,
  owner_id VARCHAR(36) NOT NULL,
  access VARCHAR(32) NOT NULL DEFAULT 'personal',
  group_id VARCHAR(36) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY projects_share_code_key (share_code),
  KEY projects_access_idx (access),
  KEY projects_group_id_idx (group_id),
  CONSTRAINT projects_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE RESTRICT,
  CONSTRAINT projects_group_id_fkey FOREIGN KEY (group_id) REFERENCES `groups` (id) ON DELETE RESTRICT,
  CONSTRAINT projects_access_check CHECK (access IN ('personal', 'group', 'organization')),
  CONSTRAINT projects_group_access_check CHECK (
    (access = 'group' AND group_id IS NOT NULL)
    OR (access <> 'group' AND group_id IS NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_members (
  id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'member',
  source VARCHAR(32) NOT NULL DEFAULT 'invite',
  joined_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY project_members_project_user_key (project_id, user_id),
  CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT project_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT project_members_source_check CHECK (source IN ('owner', 'invite', 'access'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_pins (
  id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY project_pins_user_project_key (user_id, project_id),
  KEY project_pins_user_idx (user_id),
  KEY project_pins_project_idx (project_id),
  CONSTRAINT project_pins_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT project_pins_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sprints (
  id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  goal TEXT NOT NULL,
  start_date DATETIME(3) NOT NULL,
  end_date DATETIME(3) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'planning',
  PRIMARY KEY (id),
  CONSTRAINT sprints_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  sprint_id VARCHAR(36) DEFAULT NULL,
  title VARCHAR(512) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'backlog',
  priority VARCHAR(32) NOT NULL DEFAULT 'medium',
  type VARCHAR(32) NOT NULL DEFAULT 'story',
  points INT DEFAULT NULL,
  `rank` DOUBLE NOT NULL DEFAULT 0,
  start_date DATETIME(3) DEFAULT NULL,
  due_date DATETIME(3) DEFAULT NULL,
  all_day TINYINT(1) NOT NULL DEFAULT 1,
  assignee_id VARCHAR(36) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY tasks_project_rank_idx (project_id, `rank`, created_at),
  CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT tasks_sprint_id_fkey FOREIGN KEY (sprint_id) REFERENCES sprints (id) ON DELETE SET NULL,
  CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS task_assignees (
  id VARCHAR(36) NOT NULL,
  task_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY task_assignees_task_user_key (task_id, user_id),
  KEY task_assignees_task_idx (task_id),
  KEY task_assignees_user_idx (user_id),
  CONSTRAINT task_assignees_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
  CONSTRAINT task_assignees_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comments (
  id VARCHAR(36) NOT NULL,
  task_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY comments_task_idx (task_id, created_at),
  CONSTRAINT comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attachments (
  id VARCHAR(36) NOT NULL,
  task_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  filename VARCHAR(512) NOT NULL,
  mime_type VARCHAR(191) NOT NULL,
  size INT NOT NULL,
  stored_name VARCHAR(512) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT attachments_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
  CONSTRAINT attachments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS daily_logs (
  id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  date VARCHAR(32) NOT NULL,
  yesterday TEXT NOT NULL,
  today TEXT NOT NULL,
  blockers TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY daily_logs_project_user_date_key (project_id, user_id, date),
  CONSTRAINT daily_logs_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT daily_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY activities_project_idx (project_id, created_at),
  CONSTRAINT activities_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_analyses (
  project_id VARCHAR(36) NOT NULL,
  content MEDIUMTEXT NOT NULL,
  model VARCHAR(191) NOT NULL,
  created_by VARCHAR(36) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (project_id),
  CONSTRAINT project_analyses_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT project_analyses_created_by_fkey FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS presences (
  user_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) DEFAULT NULL,
  task_id VARCHAR(36) DEFAULT NULL,
  path VARCHAR(512) NOT NULL DEFAULT '/',
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id),
  KEY presences_updated_idx (updated_at),
  CONSTRAINT presences_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT presences_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL,
  CONSTRAINT presences_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS google_calendar_connections (
  user_id VARCHAR(36) NOT NULL,
  google_email VARCHAR(191) NOT NULL,
  calendar_id VARCHAR(191) NOT NULL DEFAULT 'primary',
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry DATETIME(3) NOT NULL,
  connected_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_synced_at DATETIME(3) DEFAULT NULL,
  PRIMARY KEY (user_id),
  CONSTRAINT google_calendar_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS google_calendar_events (
  id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  task_id VARCHAR(36) NOT NULL,
  event_id VARCHAR(191) NOT NULL,
  calendar_id VARCHAR(191) NOT NULL DEFAULT 'primary',
  PRIMARY KEY (id),
  UNIQUE KEY google_calendar_events_user_task_key (user_id, task_id),
  KEY google_calendar_events_task_idx (task_id),
  CONSTRAINT google_calendar_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT google_calendar_events_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS file_blobs (
  stored_name VARCHAR(512) NOT NULL,
  mime_type VARCHAR(191) NOT NULL,
  size INT NOT NULL,
  data LONGBLOB NOT NULL,
  PRIMARY KEY (stored_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
