export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      workspaces: {
        Row: Workspace;
        Insert: Omit<Workspace, "id" | "created_at">;
        Update: Partial<Omit<Workspace, "id" | "created_at">>;
      };
      workspace_members: {
        Row: WorkspaceMember;
        Insert: Omit<WorkspaceMember, "id" | "joined_at">;
        Update: Partial<WorkspaceMember>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Task, "id" | "created_at">>;
      };
      task_comments: {
        Row: TaskComment;
        Insert: Omit<TaskComment, "id" | "created_at">;
        Update: Partial<Omit<TaskComment, "id" | "created_at">>;
      };
      task_attachments: {
        Row: TaskAttachment;
        Insert: Omit<TaskAttachment, "id" | "created_at">;
        Update: Partial<TaskAttachment>;
      };
      task_status_history: {
        Row: TaskStatusHistory;
        Insert: Omit<TaskStatusHistory, "id" | "changed_at">;
        Update: Partial<TaskStatusHistory>;
      };
      checklists: {
        Row: Checklist;
        Insert: Omit<Checklist, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Checklist, "id" | "created_at">>;
      };
      checklist_items: {
        Row: ChecklistItem;
        Insert: Omit<ChecklistItem, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ChecklistItem, "id" | "created_at">>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, "id" | "created_at">;
        Update: Partial<Omit<Message, "id" | "created_at">>;
      };
      study_sessions: {
        Row: StudySession;
        Insert: Omit<StudySession, "id" | "created_at">;
        Update: Partial<Omit<StudySession, "id" | "created_at">>;
      };
      daily_goals: {
        Row: DailyGoal;
        Insert: Omit<DailyGoal, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<DailyGoal, "id" | "created_at">>;
      };
      weekly_goals: {
        Row: WeeklyGoal;
        Insert: Omit<WeeklyGoal, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<WeeklyGoal, "id" | "created_at">>;
      };
      career_topics: {
        Row: CareerTopic;
        Insert: Omit<CareerTopic, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<CareerTopic, "id" | "created_at">>;
      };
      user_topic_progress: {
        Row: UserTopicProgress;
        Insert: Omit<UserTopicProgress, "id" | "updated_at">;
        Update: Partial<Omit<UserTopicProgress, "id">>;
      };
      activity_logs: {
        Row: ActivityLog;
        Insert: Omit<ActivityLog, "id" | "created_at">;
        Update: Partial<ActivityLog>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, "id" | "created_at">;
        Update: Partial<Omit<Notification, "id" | "created_at">>;
      };
      gate_mock_tests: {
        Row: GateMockTest;
        Insert: Omit<GateMockTest, "id" | "created_at">;
        Update: Partial<Omit<GateMockTest, "id" | "created_at">>;
      };
      learning_resources: {
        Row: LearningResource;
        Insert: Omit<LearningResource, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<LearningResource, "id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  is_online: boolean;
  last_active: string;
  workspace_id: string | null;
  theme: "light" | "dark" | "system";
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  joined_at: string;
}

export type TaskStatus =
  | "Requested"
  | "Accepted"
  | "In Progress"
  | "Submitted for Review"
  | "Revision Requested"
  | "Approved"
  | "Overdue"
  | "Cancelled";

export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

export type TaskCategory =
  | "GATE ECE"
  | "Verilog"
  | "SystemVerilog"
  | "Digital Electronics"
  | "VLSI Design"
  | "AI and Machine Learning"
  | "FPGA"
  | "Semiconductor Engineering"
  | "Projects"
  | "College Work"
  | "Revision"
  | "Mock Tests"
  | "Personal Development"
  | "Other";

export interface Task {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  created_by: string;
  assigned_to: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  start_date: string | null;
  deadline: string | null;
  expected_duration: number | null; // minutes
  expected_deliverable: string | null;
  reference_links: string[] | null;
  additional_instructions: string | null;
  progress_percentage: number;
  requires_review: boolean;
  submission_notes: string | null;
  created_at: string;
  updated_at: string;
  // joined
  creator?: Profile;
  assignee?: Profile;
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: Profile;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export interface TaskStatusHistory {
  id: string;
  task_id: string;
  changed_by: string;
  old_status: TaskStatus | null;
  new_status: TaskStatus;
  note: string | null;
  changed_at: string;
  user?: Profile;
}

export interface Checklist {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  date: string; // YYYY-MM-DD
  is_shared: boolean;
  created_at: string;
  updated_at: string;
  items?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  content: string;
  is_completed: boolean;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type MessageChannel =
  | "general"
  | "study"
  | "tasks"
  | "career";

export interface Message {
  id: string;
  workspace_id: string;
  sender_id: string;
  channel: MessageChannel;
  content: string;
  reply_to: string | null;
  is_deleted: boolean;
  created_at: string;
  sender?: Profile;
  reply?: Message;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
}

export interface StudySession {
  id: string;
  workspace_id: string;
  user_id: string;
  subject: string;
  track: string;
  notes: string | null;
  duration_seconds: number;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  session_type: "solo" | "together";
  partner_joined: boolean;
  created_at: string;
}

export interface DailyGoal {
  id: string;
  workspace_id: string;
  user_id: string;
  date: string;
  gate_subject: string | null;
  vlsi_topic: string | null;
  gate_questions_target: number;
  study_hours_target: number;
  individual_goals: string[];
  shared_goals: string[];
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeeklyGoal {
  id: string;
  workspace_id: string;
  created_by: string;
  week_start: string;
  week_end: string;
  objectives: string[];
  milestones: string[];
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export type TopicStatus = "not_started" | "in_progress" | "completed" | "revision";
export type TopicDifficulty = "beginner" | "intermediate" | "advanced";

export interface CareerTopic {
  id: string;
  workspace_id: string;
  track: "gate" | "vlsi";
  subject: string;
  level: number;
  title: string;
  description: string | null;
  difficulty: TopicDifficulty;
  reference_links: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserTopicProgress {
  id: string;
  user_id: string;
  topic_id: string;
  status: TopicStatus;
  notes: string | null;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  workspace_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Json;
  created_at: string;
  user?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "task" | "chat" | "goal" | "milestone" | "system";
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface GateMockTest {
  id: string;
  workspace_id: string;
  user_id: string;
  test_type: "subject" | "topic" | "full";
  subject: string | null;
  topic: string | null;
  test_date: string;
  total_questions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  marks_obtained: number;
  total_marks: number;
  negative_marks: number;
  time_taken_minutes: number;
  accuracy_percentage: number;
  notes: string | null;
  created_at: string;
}

export interface LearningResource {
  id: string;
  workspace_id: string;
  uploaded_by: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  tags: string[];
  linked_topic_id: string | null;
  created_at: string;
  updated_at: string;
  uploader?: Profile;
}

