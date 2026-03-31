CREATE TABLE task_drafts (
  id          INT IDENTITY(1,1) PRIMARY KEY,
  user_id     INT NOT NULL UNIQUE,
  data        NVARCHAR(MAX) NOT NULL,
  updated_at  DATETIME NOT NULL DEFAULT GETDATE(),
  CONSTRAINT fk_draft_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
