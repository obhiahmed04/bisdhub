# BISD HUB - Social Media Platform

## Original Problem Statement
Build a social media app named BISD HUB for 5000 users. Registration is strictly private and requires Admin approval. Features include complex registration form, user profiles, custom feeds, Global Chat with dedicated rooms, DMs, 3-tier staff panel, and various social features.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Real-time**: WebSocket (chat/notifications)
- **File Storage**: Local uploads at /app/backend/uploads/

## Core Requirements
1. Private registration with admin approval
2. User profiles (PFP, Banner, Bio, Badges)
3. Custom feeds (Official, Public, Following, Friends)
4. Global Chat rooms (General, Boys, Girls, Class, Section, Ex-Students)
5. Direct Messages
6. 3-tier staff panel (Management, Admin, Moderation)
7. Friend system with requests
8. Dark mode
9. File uploads (images/video)

## What's Implemented

### Phase 1 - MVP
- JWT authentication with login/register
- Multi-step registration form with calendar pickers
- Pending registration page with status check + 10-min edit window
- Admin approval/rejection of registrations
- User profiles with banner, PFP, bio, badges
- Following/followers system
- Post creation with visibility settings
- Comments and likes on posts
- WebSocket-based real-time Global Chat
- Direct Messages
- Notification bell system
- 3 staff panels (Management, Admin, Moderation)

### Phase 2 - UI Refactor
- CreatePostDialog with visibility selector
- ReportDialog for posts (shows serial # after submit)
- EditProfileDialog with file uploads
- CommentSection component
- Friend request system
- Serial numbers for all entities

### Phase 3 - Comprehensive Fixes
- Fixed Global Chat WebSocket (/api/ws/ prefix)
- Fixed User model (added friends, friend_requests fields)
- File upload system (PFP, banner, post images)
- Post visibility: Public, Profile Only, Friends Only, Official
- Official post confirmation popup
- Separate Official and Public feeds
- Real-time search bar
- Share/Repost functionality
- DM initiation from profiles
- Dark mode (global toggle)
- Banned user routing page with help chat
- Searchbars in all 3 staff panels
- Improved action logs with serial numbers and color coding
- Email notification on approval/rejection (Resend - toggled OFF until tested)
- Privacy toggles (profile, followers, following, friends visibility)
- Password Reset via OTP (Resend)
- Post timestamps, deletion, serial numbers
- Spam detection in chat (rate limiting)

### Phase 3.5 (April 9, 2026)
- **Logo Integration**: BISD HUB logo on Login (w-44), Sidebar (w-28), Mobile header (w-20), Admin/Mod panels
- **Friends Page**: Dedicated /friends route with tabs (Friends list, Requests), search, accept/decline/remove
- **Settings Cleaned**: Friends management removed, added shortcut button to /friends
- **Global Chat Enhanced**: Reply to messages, emoji reactions (6 quick), report messages
- **Admin User Editing**: Edit dialog (name, email, class, section, bio) in Admin Panel
- **Action Logs Tab**: Added to Admin + Moderation panels with search (serial #, name, action type)
- **Mobile Nav**: Added Friends icon

### Phase 3.6 — Bug Fixes (April 9, 2026)
- **Logo Sizing Fixed**: Width-based sizing for proper alignment
- **Serial Numbers Hidden**: Removed from user-facing posts & chat; only shown in report dialogs and staff panels
- **Notification Bell Fixed**: Prevented overflow, added backdrop for mobile, mark-all-read button
- **Search Enhanced**: Realtime dropdown results in sidebar + dedicated /search page with tabs (All/Users/Posts)
- **Report Details Enriched**: Staff panels now show violator name, ID, class/section, post/message content, images
- **Chat Reports Tab**: New tab in Moderation Panel for chat message reports with full context
- **Backend**: Added /mod/chat-reports, /mod/chat-reports/{id}/resolve endpoints, enriched /mod/reports with violator data

## Prioritized Backlog

### P1 (Important)
- GIF support via Tenor/Giphy (posts & chat) — requires API key from user
- Voice recording for posts and chat (MediaRecorder API)
- Audio/Video calls in DMs — requires WebRTC/Twilio integration
- DM search bar frontend connection (backend exists)
- Message Requests folder for DMs from non-friends

### P2 (Nice to Have)
- Push notifications service worker
- Content sharing to external platforms
- User blocking
- Advanced search filters
- Post pinning for profiles
- Verify Email Notifications (Resend) - keep OFF until user says go
- Backend refactoring (server.py ~2000 lines → split into modules)
