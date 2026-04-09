# BISD HUB - Social Media Platform

## Original Problem Statement
Build a social media app named BISD HUB for 5000 users. Registration is strictly private and requires Admin approval. Features include complex registration form, user profiles, custom feeds, Global Chat with dedicated rooms, DMs, 3-tier staff panel, and various social features.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Real-time**: WebSocket (chat/notifications/WebRTC signaling)
- **File Storage**: Local uploads at /app/backend/uploads/ (images, video, audio)
- **Calls**: WebRTC peer-to-peer (STUN: stun.l.google.com)

## What's Implemented (Cumulative)

### Core Features
- JWT authentication with login/register
- Multi-step registration with calendar pickers, 10-min edit window
- Admin approval/rejection of registrations
- User profiles with PFP, Banner, Bio, Badges
- Following/followers system
- Friend requests with dedicated /friends page
- Post creation with visibility settings (Public, Profile Only, Friends Only, Official)
- Comments, likes, share/repost
- Post deletion with timestamps
- Dark mode toggle

### Communication
- WebSocket-based real-time Global Chat with room filtering (General, Boys/Girls, Class, Section, Ex-Students)
- Chat reply to messages with preview
- Chat emoji reactions (6 quick emojis)
- Chat message reporting
- Voice messages in Global Chat (MediaRecorder API)
- Direct Messages with conversation list
- DM search bar (filter by name/ID)
- Voice messages in DMs
- Audio/Video calls in DMs (WebRTC peer-to-peer)
- Call UI: full-screen overlay with mute/video toggle/end call

### Staff Panels (3-tier)
- **Management Panel**: User overview, stats
- **Admin Panel**: Pending registrations, user management, edit user dialog (name, email, class, section, bio), action logs with search, help chat
- **Moderation Panel**: Post reports (enriched with violator info, post content), Chat reports (message author, room, content), user actions (ban/mute/unban/unmute), action logs with search

### Search & Navigation
- Real-time search dropdown in sidebar (users + posts)
- Dedicated /search page with All/Users/Posts tabs
- BISD HUB logo on Login, Sidebar, Mobile header, Admin/Mod panels
- Mobile-responsive bottom nav (Home, Chat, DMs, Friends, Profile, Settings)

### Privacy & Security
- Privacy toggles (profile, followers, following, friends visibility)
- Password reset via OTP (Resend)
- Spam detection in chat (rate limiting)
- Serial numbers for all entities (hidden from users, visible in staff panels + report dialogs)

### File Handling
- Local file uploads: images (jpeg/png/gif/webp), video (mp4/quicktime), audio (webm/ogg/mp4/mpeg/wav)
- Upload limit: 10MB

## Prioritized Backlog

### P1 (Important)
- Message Requests folder for DMs from non-friends
- Basic Automoderation enhancements
- Voice recording in post creation (CreatePostDialog)

### P2 (Nice to Have)
- Push notifications service worker
- User blocking system
- Advanced search filters
- Post pinning for profiles
- GIF support (skipped - Tenor closed, Giphy possible if user provides key)
- Verify Email Notifications (Resend) - keep OFF until user says go
- Backend refactoring (server.py ~2100 lines -> split into modules)
