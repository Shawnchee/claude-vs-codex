-- Apply with: turso db shell <your-db-name> < schema.sql

create table if not exists votes (
  id         integer primary key autoincrement,
  choice     text not null check (choice in ('claude', 'codex')),
  voter_hash text not null unique,                  -- one vote per voter
  created_at text not null default (datetime('now'))
);

create table if not exists reasons (
  id          integer primary key autoincrement,
  choice      text not null check (choice in ('claude', 'codex')),
  body        text not null,
  author_hash text,
  created_at  text not null default (datetime('now'))
);

-- one reason per browser — re-submitting replaces it in place
create unique index if not exists idx_reasons_author on reasons(author_hash);

-- one row per upvote => dedup is built in, and the count never drifts
create table if not exists reason_upvotes (
  reason_id  integer not null references reasons(id) on delete cascade,
  voter_hash text not null,
  primary key (reason_id, voter_hash)
);

create index if not exists idx_reason_upvotes_reason on reason_upvotes(reason_id);
