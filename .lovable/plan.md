## Plan: Bid Pipeline Management System MVP

### 1. Database Migration
- Remove `user_roles` table and `app_role` enum dependencies
- Add `bids` table with stages: new_lead, qualified, in_progress, submitted, won, lost
- Add `bid_activities` table for audit trail
- Add `bid_notes` table
- Simplify RLS to just authenticated users (no role checks)
- Keep `profiles` table

### 2. Simplify Auth
- Remove role logic from AuthContext (no more hasRole, isManagerOrAdmin, etc.)
- Keep basic session/profile auth

### 3. Core Pages
- **Dashboard**: Analytics (pipeline value, bids per stage, win rate)
- **Pipeline**: Kanban board with drag-and-drop (6 stages)
- **Bid Detail**: Full detail view with activity timeline, notes, document links
- **Create/Edit Bid**: Form with title, client, description, value, deadline, stage

### 4. Navigation
- Dashboard, Pipeline, Create Bid (simplified sidebar)

### 5. Remove old procurement-specific pages
- Remove Tenders, Prequalifications, MyTasks, ManagerView, AuditLog pages
- Remove old procurement components

### Tech: React + Tailwind + Supabase (already in place), add @hello-pangea/dnd for Kanban