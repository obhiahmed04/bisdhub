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
- ReportDialog for posts
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

### Phase 3.5 - Current Session (April 9, 2026)
- **Logo Integration**: BISD HUB logo (PNG/SVG) displayed on Login, MainApp sidebar, Mobile header, Admin Panel
- **Friends Page Separation**: Dedicated `/friends` route with FriendsPage.js (tabs for Friends list & Requests, search, accept/decline/remove)
- **Settings Cleaned**: Removed inline friends management, added "Manage Friends" shortcut button
- **Global Chat Enhancements**: Reply to messages (with reply preview), emoji reactions (6 quick emojis), report messages
- **Admin User Editing**: Edit dialog in Admin Panel for modifying user profiles (name, email, class, section, bio)
- **Action Logs Tab**: Added to Admin Panel with search bar (filter by serial #, admin name, action type)
- **Moderation Logs Search**: Added search input to Moderation Panel action logs
- **Mobile Nav**: Added Friends icon to mobile bottom navigation

## Prioritized Backlog

### P0 (Critical)
- None remaining

### P1 (Important)
- GIF support via Tenor/Giphy integration (posts & chat)
- Voice recording for posts and chat
- Message Requests folder for DMs from non-friends
- Video/Voice calls in DMs (requires WebRTC/Twilio)
- Basic Automoderation enhancements
- DM search bar connection (backend exists)

### P2 (Nice to Have)
- Push notifications (browser) - toggle exists, needs service worker
- Content sharing to external platforms
- User blocking
- Advanced search filters
- Post pinning for profiles
- Verify Email Notifications (Resend) - logic exists, keep OFF until user says go
- Backend refactoring (server.py is ~2000 lines, split into modules)
