Note to Claude: I'm planning to migrate this frontend only app to fullstack with 
a FastAPI backend and persistent sqlite. I will likely use Tanstack Query as well but 
that's a design choice I'm still considering. 

Below is a basic json schema to model the application state abstractly before modeling as SQL entity relationships.


chats = [
    {
        id,
        name,
        date,
        messages: [
            {
                id
                role: system | user | assistant,
                content: string
                position: int
            }
        ]
        temperature: number,
        settings: [
            {
                type: input | select | multiselect | toggle | json
                name: string
                data: jsonb
            }
        ]
    }
]

# Improved Data Model

```json
chats = [
  {
    "id": "uuid-string",
    "name": "Chat Name",
    "createdAt": "2025-03-08T12:00:00Z",
    "updatedAt": "2025-03-08T14:30:00Z",
    "messages": [
      {
        "id": "msg-uuid-string",
        "role": "system", // system | user | assistant
        "content": "You are a helpful assistant",
        "position": 0,
        "createdAt": "2025-03-08T12:00:00Z",
        "updatedAt": "2025-03-08T12:00:00Z"
      },
      {
        "id": "msg-uuid-string-2",
        "role": "user",
        "content": "Hello, can you help me?",
        "position": 1,
        "createdAt": "2025-03-08T12:01:00Z",
        "updatedAt": "2025-03-08T12:01:00Z"
      },
      {
        "id": "msg-uuid-string-3",
        "role": "assistant",
        "content": "Yes, I'd be happy to help! What do you need assistance with?",
        "position": 2,
        "createdAt": "2025-03-08T12:01:30Z",
        "updatedAt": "2025-03-08T12:01:30Z"
      }
    ],
    "settings": [
      {
        "id": "setting-uuid-1",
        "name": "Temperature",
        "type": "temperature",
        "value": 0.7,
        "createdAt": "2025-03-08T12:00:00Z",
        "updatedAt": "2025-03-08T12:00:00Z"
      },
      {
        "id": "setting-uuid-2",
        "name": "Model Name",
        "type": "text",
        "value": "gpt-4",
        "createdAt": "2025-03-08T12:00:00Z",
        "updatedAt": "2025-03-08T12:00:00Z"
      },
      {
        "id": "setting-uuid-3",
        "name": "Stream Response",
        "type": "checkbox",
        "value": true,
        "createdAt": "2025-03-08T12:00:00Z",
        "updatedAt": "2025-03-08T12:00:00Z"
      },
      {
        "id": "setting-uuid-4",
        "name": "Response Type",
        "type": "radio",
        "value": "option-2", // ID of the selected option
        "options": [
          {
            "id": "option-1",
            "name": "Concise"
          },
          {
            "id": "option-2",
            "name": "Detailed"
          },
          {
            "id": "option-3",
            "name": "Creative"
          }
        ],
        "createdAt": "2025-03-08T12:00:00Z",
        "updatedAt": "2025-03-08T12:00:00Z"
      },
      {
        "id": "setting-uuid-5",
        "name": "Available Tools",
        "type": "multiselect",
        "value": ["web_search", "calculator"], // Array of selected option IDs
        "options": [
          {
            "id": "web_search",
            "name": "Web Search"
          },
          {
            "id": "calculator",
            "name": "Calculator"
          },
          {
            "id": "image_gen",
            "name": "Image Generation"
          },
          {
            "id": "code_interpreter",
            "name": "Code Interpreter"
          }
        ],
        "createdAt": "2025-03-08T12:00:00Z",
        "updatedAt": "2025-03-08T12:00:00Z"
      },
      {
        "id": "setting-uuid-6",
        "name": "System Context",
        "type": "json",
        "value": {
          "rules": ["Be helpful", "Be accurate", "Cite sources"],
          "constraints": {
            "maxResponseLength": 500,
            "avoidTopics": ["politics", "religion"]
          }
        },
        "createdAt": "2025-03-08T12:00:00Z",
        "updatedAt": "2025-03-08T14:15:00Z"
      }
    ]
  }
]
```

Key improvements:
1. Added proper timestamps (createdAt/updatedAt) for all entities
2. Structured each setting type with appropriate values based on type
3. Made option handling explicit for multiselect and radio settings
4. Used properly typed values (no generic "data" field)
5. Included IDs for all entities to support efficient updates
6. Used ISO-8601 for all date timestamps
7. Clear separation between available options and selected options 
8. Consistent naming and structure throughout

# SQLite Database Schema

```sql
-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Chats table
CREATE TABLE chats (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,  -- ISO8601 format
    updated_at TEXT NOT NULL   -- ISO8601 format
);

-- Messages table
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
    content TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TEXT NOT NULL,  -- ISO8601 format
    updated_at TEXT NOT NULL,  -- ISO8601 format
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    UNIQUE (chat_id, position)  -- Ensure positions are unique within a chat
);

-- Settings table
CREATE TABLE settings (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('temperature', 'text', 'checkbox', 'radio', 'multiselect', 'json')),
    value TEXT,  -- Stored as text, interpretation depends on type:
                 -- temperature: numeric string
                 -- text: plain string
                 -- checkbox: "true" or "false"
                 -- radio: selected option ID as string
                 -- multiselect: JSON array of option IDs
                 -- json: serialized JSON string
    created_at TEXT NOT NULL,  -- ISO8601 format
    updated_at TEXT NOT NULL,  -- ISO8601 format
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    UNIQUE (chat_id, name)  -- Each setting name should be unique within a chat
);

-- Setting options table (for radio and multiselect settings)
CREATE TABLE setting_options (
    id TEXT PRIMARY KEY,  -- Auto-generated UUID
    setting_id TEXT NOT NULL,
    option_id TEXT NOT NULL,  -- The ID used as reference in the setting value
    name TEXT NOT NULL,
    FOREIGN KEY (setting_id) REFERENCES settings(id) ON DELETE CASCADE,
    UNIQUE (setting_id, option_id)  -- Each option_id should be unique within a setting
);

-- Indexes for performance
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_position ON messages(chat_id, position);
CREATE INDEX idx_settings_chat_id ON settings(chat_id);
CREATE INDEX idx_setting_options_setting_id ON setting_options(setting_id);
```

## Implementation Considerations

### Data Operations

**Creating a new chat:**
```sql
-- 1. Insert the chat
INSERT INTO chats (id, name, created_at, updated_at) 
VALUES (?, ?, datetime('now'), datetime('now'));

-- 2. Insert initial settings
INSERT INTO settings (id, chat_id, name, type, value, created_at, updated_at)
VALUES (?, ?, 'Temperature', 'temperature', '0.7', datetime('now'), datetime('now'));

-- 3. Insert any initial messages
INSERT INTO messages (id, chat_id, role, content, position, created_at, updated_at)
VALUES (?, ?, 'system', 'You are a helpful assistant', 0, datetime('now'), datetime('now'));
```

**Adding a new message:**
```sql
-- Get the next position
SELECT COALESCE(MAX(position) + 1, 0) FROM messages WHERE chat_id = ?;

-- Then insert the message
INSERT INTO messages (id, chat_id, role, content, position, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'));

-- Update the chat's updated_at timestamp
UPDATE chats SET updated_at = datetime('now') WHERE id = ?;
```

**Creating a multiselect setting with options:**
```sql
-- 1. Insert the setting
INSERT INTO settings (id, chat_id, name, type, value, created_at, updated_at)
VALUES (?, ?, 'Available Tools', 'multiselect', '[]', datetime('now'), datetime('now'));

-- 2. Insert the options
INSERT INTO setting_options (id, setting_id, option_id, name)
VALUES (?, ?, 'web_search', 'Web Search');

INSERT INTO setting_options (id, setting_id, option_id, name)
VALUES (?, ?, 'calculator', 'Calculator');

-- More options as needed...
```

**Updating a setting value:**
```sql
-- For a multiselect, encode the selected options as a JSON array
UPDATE settings 
SET value = '["web_search", "calculator"]', updated_at = datetime('now')
WHERE id = ?;

-- Update the chat's updated_at timestamp
UPDATE chats SET updated_at = datetime('now') WHERE id = ?;
```

### Retrieval Functions

**Get a complete chat with messages and settings:**
```sql
-- 1. Get the chat
SELECT * FROM chats WHERE id = ?;

-- 2. Get all messages for the chat, ordered by position
SELECT * FROM messages 
WHERE chat_id = ? 
ORDER BY position;

-- 3. Get all settings for the chat
SELECT s.*, GROUP_CONCAT(
    json_object(
        'id', o.option_id, 
        'name', o.name
    )
) as options
FROM settings s
LEFT JOIN setting_options o ON s.id = o.setting_id
WHERE s.chat_id = ?
GROUP BY s.id;
```

**In code, you would process the setting options:**
```python
# Pseudocode
for setting in settings:
    if setting["type"] in ["radio", "multiselect"]:
        if setting["options"]:  # If options exist
            # Parse the GROUP_CONCAT result
            option_json_array = setting["options"].split(",")
            setting["options"] = [json.loads(opt) for opt in option_json_array]
        else:
            setting["options"] = []
            
    # Process the value based on type
    if setting["type"] == "temperature":
        setting["value"] = float(setting["value"])
    elif setting["type"] == "checkbox":
        setting["value"] = setting["value"] == "true"
    elif setting["type"] == "multiselect":
        setting["value"] = json.loads(setting["value"])
    elif setting["type"] == "json":
        try:
            setting["value"] = json.loads(setting["value"])
        except:
            setting["value"] = {}
```