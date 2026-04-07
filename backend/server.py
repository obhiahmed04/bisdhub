from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Query, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import asyncio
import resend
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend API setup
resend.api_key = os.getenv('RESEND_API_KEY', '')
SENDER_EMAIL = os.getenv('SENDER_EMAIL', 'onboarding@resend.dev')

# JWT settings
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

    async def broadcast(self, message: dict, chat_room: str):
        for user_id, connection in self.active_connections.items():
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

# ============= MODELS =============

class RegistrationRequest(BaseModel):
    id_number: str
    full_name: str
    date_of_birth: str
    current_class: str
    section: str
    email: EmailStr
    phone_number: Optional[str] = None
    is_ex_student: bool
    date_of_leaving: Optional[str] = None
    last_class: Optional[str] = None

class Registration(BaseModel):
    model_config = ConfigDict(extra="ignore")
    reg_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    id_number: str
    full_name: str
    date_of_birth: str
    current_class: str
    section: str
    email: EmailStr
    phone_number: Optional[str] = None
    is_ex_student: bool
    date_of_leaving: Optional[str] = None
    last_class: Optional[str] = None
    status: str = "pending"  # pending, approved, rejected
    rejection_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    email_verified: bool = False
    phone_verified: bool = False

class OTPVerification(BaseModel):
    email: EmailStr
    otp: str

class UserLogin(BaseModel):
    id_number: str
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    id_number: str  # Primary key/username
    full_name: str
    display_name: str
    date_of_birth: str
    current_class: str
    section: str
    email: EmailStr
    phone_number: Optional[str] = None
    is_ex_student: bool
    date_of_leaving: Optional[str] = None
    last_class: Optional[str] = None
    password_hash: str
    profile_picture: Optional[str] = None
    banner_image: Optional[str] = "https://static.prod-images.emergentagent.com/jobs/17b61164-1d10-46cf-baba-b1316ac6e12c/images/3363304a1d6cf6e5fdb07fb61d2e7c00bb6c265629ca175243351c3baa65a1b2.png"
    bio: Optional[str] = ""
    badges: List[str] = Field(default_factory=list)
    is_profile_public: bool = True
    is_admin: bool = False
    is_moderator: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    followers: List[str] = Field(default_factory=list)
    following: List[str] = Field(default_factory=list)

class Post(BaseModel):
    model_config = ConfigDict(extra="ignore")
    post_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    content: str
    images: List[str] = Field(default_factory=list)
    likes: List[str] = Field(default_factory=list)
    comments: List[Dict[str, Any]] = Field(default_factory=list)
    is_official: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    chat_room: str  # general, boys_only, girls_only, class_X, section_X_Y, ex_students
    user_id: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DirectMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    dm_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    receiver_id: str
    content: str
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminAction(BaseModel):
    reg_id: str
    action: str  # approve or reject
    rejection_reason: Optional[str] = None
    password: str  # Temporary password for approved users

class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None
    banner_image: Optional[str] = None
    is_profile_public: Optional[bool] = None

class PostCreate(BaseModel):
    content: str
    images: List[str] = Field(default_factory=list)

class CommentCreate(BaseModel):
    content: str

# ============= HELPER FUNCTIONS =============

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

async def verify_admin(user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def send_otp_email(email: str, otp: str):
    html_content = f"""
    <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #2563EB;">BISD HUB - Email Verification</h2>
        <p>Your OTP for email verification is:</p>
        <h1 style="color: #111111; font-size: 32px; letter-spacing: 8px;">{otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
    </div>
    """
    
    params = {
        "from": SENDER_EMAIL,
        "to": [email],
        "subject": "BISD HUB - Email Verification OTP",
        "html": html_content
    }
    
    try:
        email_response = await asyncio.to_thread(resend.Emails.send, params)
        return email_response
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return None

# ============= ROUTES =============

@api_router.get("/")
async def root():
    return {"message": "BISD HUB API"}

# OTP Management
otp_storage = {}  # In production, use Redis

@api_router.post("/auth/send-otp")
async def send_otp(request: dict):
    email = request.get('email')
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
    
    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    otp_storage[email] = {
        "otp": otp,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10)
    }
    
    # Send OTP via email
    email_sent = await send_otp_email(email, otp)
    
    if email_sent:
        return {"status": "success", "message": "OTP sent to email"}
    else:
        # For development/testing without valid Resend API key
        logger.info(f"OTP for {email}: {otp}")
        return {"status": "success", "message": "OTP sent (check logs)", "dev_otp": otp}

@api_router.post("/auth/verify-otp")
async def verify_otp(request: OTPVerification):
    stored = otp_storage.get(request.email)
    if not stored:
        raise HTTPException(status_code=400, detail="OTP not found or expired")
    
    if stored['expires_at'] < datetime.now(timezone.utc):
        del otp_storage[request.email]
        raise HTTPException(status_code=400, detail="OTP expired")
    
    if stored['otp'] != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    del otp_storage[request.email]
    return {"status": "success", "message": "Email verified"}

# Registration
@api_router.post("/auth/register")
async def register(reg_request: RegistrationRequest):
    # Check if ID already exists
    existing = await db.registrations.find_one({"id_number": reg_request.id_number}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="ID number already registered")
    
    existing_user = await db.users.find_one({"id_number": reg_request.id_number}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    registration = Registration(**reg_request.model_dump())
    doc = registration.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.registrations.insert_one(doc)
    return {"status": "success", "message": "Registration submitted for approval", "reg_id": registration.reg_id}

# Admin: Get pending registrations
@api_router.get("/admin/registrations/pending")
async def get_pending_registrations(admin: User = Depends(verify_admin)):
    registrations = await db.registrations.find({"status": "pending"}, {"_id": 0}).to_list(1000)
    for reg in registrations:
        if isinstance(reg.get('created_at'), str):
            reg['created_at'] = datetime.fromisoformat(reg['created_at'])
    return registrations

# Admin: Approve/Reject registration
@api_router.post("/admin/registrations/action")
async def admin_action_registration(action: AdminAction, admin: User = Depends(verify_admin)):
    registration = await db.registrations.find_one({"reg_id": action.reg_id}, {"_id": 0})
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    if action.action == "approve":
        # Create user account
        password_hash = bcrypt.hashpw(action.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        user = User(
            id_number=registration['id_number'],
            full_name=registration['full_name'],
            display_name=registration['full_name'].split()[0] + " " + registration['full_name'].split()[-1],
            date_of_birth=registration['date_of_birth'],
            current_class=registration['current_class'],
            section=registration['section'],
            email=registration['email'],
            phone_number=registration.get('phone_number'),
            is_ex_student=registration['is_ex_student'],
            date_of_leaving=registration.get('date_of_leaving'),
            last_class=registration.get('last_class'),
            password_hash=password_hash
        )
        
        user_doc = user.model_dump()
        user_doc['created_at'] = user_doc['created_at'].isoformat()
        await db.users.insert_one(user_doc)
        
        # Update registration status
        await db.registrations.update_one(
            {"reg_id": action.reg_id},
            {"$set": {"status": "approved"}}
        )
        
        return {"status": "success", "message": "User approved and account created"}
    
    elif action.action == "reject":
        await db.registrations.update_one(
            {"reg_id": action.reg_id},
            {"$set": {"status": "rejected", "rejection_reason": action.rejection_reason}}
        )
        return {"status": "success", "message": "Registration rejected"}
    
    raise HTTPException(status_code=400, detail="Invalid action")

# Login
@api_router.post("/auth/login")
async def login(login_request: UserLogin):
    user = await db.users.find_one({"id_number": login_request.id_number}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(login_request.password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create JWT token
    token_payload = {
        "user_id": user['user_id'],
        "id_number": user['id_number'],
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    user_data = User(**user)
    return {
        "token": token,
        "user": user_data.model_dump(exclude={'password_hash'})
    }

# Get current user profile
@api_router.get("/users/me")
async def get_my_profile(user: User = Depends(get_current_user)):
    return user.model_dump(exclude={'password_hash'})

# Update profile
@api_router.put("/users/me")
async def update_profile(update: ProfileUpdate, user: User = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    if update_data:
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return User(**updated_user).model_dump(exclude={'password_hash'})

# Search users (must come before /users/{id_number} to avoid route conflict)
@api_router.get("/users/search")
async def search_users(
    query: str = Query(..., min_length=1),
    user: User = Depends(get_current_user)
):
    # Search by name, ID, class, or section
    users = await db.users.find({
        "$or": [
            {"full_name": {"$regex": query, "$options": "i"}},
            {"display_name": {"$regex": query, "$options": "i"}},
            {"id_number": {"$regex": query, "$options": "i"}},
            {"current_class": {"$regex": query, "$options": "i"}},
            {"section": {"$regex": query, "$options": "i"}}
        ]
    }, {"_id": 0}).to_list(50)
    
    # Filter out private profiles
    results = []
    for u in users:
        user_obj = User(**u)
        if user_obj.is_profile_public or user_obj.user_id == user.user_id:
            results.append(user_obj.model_dump(exclude={'password_hash'}))
    
    return results

# Get user profile by ID number
@api_router.get("/users/{id_number}")
async def get_user_profile(id_number: str, user: User = Depends(get_current_user)):
    target_user = await db.users.find_one({"id_number": id_number}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_obj = User(**target_user)
    
    # Check if profile is private
    if not user_obj.is_profile_public and user_obj.user_id != user.user_id:
        raise HTTPException(status_code=403, detail="Profile is private")
    
    return user_obj.model_dump(exclude={'password_hash'})

# Follow/Unfollow user
@api_router.post("/users/{id_number}/follow")
async def follow_user(id_number: str, user: User = Depends(get_current_user)):
    if id_number == user.id_number:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    target_user = await db.users.find_one({"id_number": id_number}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Add to following list
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$addToSet": {"following": target_user['user_id']}}
    )
    
    # Add to followers list
    await db.users.update_one(
        {"user_id": target_user['user_id']},
        {"$addToSet": {"followers": user.user_id}}
    )
    
    return {"status": "success", "message": "User followed"}

@api_router.delete("/users/{id_number}/follow")
async def unfollow_user(id_number: str, user: User = Depends(get_current_user)):
    target_user = await db.users.find_one({"id_number": id_number}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Remove from following list
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$pull": {"following": target_user['user_id']}}
    )
    
    # Remove from followers list
    await db.users.update_one(
        {"user_id": target_user['user_id']},
        {"$pull": {"followers": user.user_id}}
    )
    
    return {"status": "success", "message": "User unfollowed"}

# Posts
@api_router.post("/posts")
async def create_post(post_create: PostCreate, user: User = Depends(get_current_user)):
    post = Post(
        user_id=user.user_id,
        content=post_create.content,
        images=post_create.images,
        is_official=user.is_admin or user.is_moderator
    )
    
    doc = post.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.posts.insert_one(doc)
    
    return post

@api_router.get("/posts/feed/{feed_type}")
async def get_feed(feed_type: str, user: User = Depends(get_current_user), skip: int = 0, limit: int = 20):
    if feed_type == "official":
        posts = await db.posts.find({"is_official": True}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    elif feed_type == "following":
        posts = await db.posts.find({"user_id": {"$in": user.following}}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    else:  # public feed
        posts = await db.posts.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with user data
    for post in posts:
        if isinstance(post.get('created_at'), str):
            post['created_at'] = datetime.fromisoformat(post['created_at'])
        post_user = await db.users.find_one({"user_id": post['user_id']}, {"_id": 0, "user_id": 1, "display_name": 1, "id_number": 1, "profile_picture": 1, "badges": 1})
        post['user'] = post_user
    
    return posts

@api_router.get("/posts/user/{id_number}")
async def get_user_posts(id_number: str, user: User = Depends(get_current_user), skip: int = 0, limit: int = 20):
    target_user = await db.users.find_one({"id_number": id_number}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    posts = await db.posts.find({"user_id": target_user['user_id']}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for post in posts:
        if isinstance(post.get('created_at'), str):
            post['created_at'] = datetime.fromisoformat(post['created_at'])
        post['user'] = {
            "user_id": target_user['user_id'],
            "display_name": target_user['display_name'],
            "id_number": target_user['id_number'],
            "profile_picture": target_user.get('profile_picture'),
            "badges": target_user.get('badges', [])
        }
    
    return posts

@api_router.post("/posts/{post_id}/like")
async def like_post(post_id: str, user: User = Depends(get_current_user)):
    await db.posts.update_one(
        {"post_id": post_id},
        {"$addToSet": {"likes": user.user_id}}
    )
    return {"status": "success"}

@api_router.delete("/posts/{post_id}/like")
async def unlike_post(post_id: str, user: User = Depends(get_current_user)):
    await db.posts.update_one(
        {"post_id": post_id},
        {"$pull": {"likes": user.user_id}}
    )
    return {"status": "success"}

@api_router.post("/posts/{post_id}/comment")
async def add_comment(post_id: str, comment: CommentCreate, user: User = Depends(get_current_user)):
    comment_data = {
        "comment_id": str(uuid.uuid4()),
        "user_id": user.user_id,
        "display_name": user.display_name,
        "content": comment.content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.posts.update_one(
        {"post_id": post_id},
        {"$push": {"comments": comment_data}}
    )
    
    return {"status": "success", "comment": comment_data}

@api_router.get("/posts/search")
async def search_posts(query: str = Query(..., min_length=1), user: User = Depends(get_current_user)):
    posts = await db.posts.find(
        {"content": {"$regex": query, "$options": "i"}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    for post in posts:
        if isinstance(post.get('created_at'), str):
            post['created_at'] = datetime.fromisoformat(post['created_at'])
        post_user = await db.users.find_one({"user_id": post['user_id']}, {"_id": 0, "user_id": 1, "display_name": 1, "id_number": 1, "profile_picture": 1, "badges": 1})
        post['user'] = post_user
    
    return posts

# Global Chat
@api_router.get("/chat/{chat_room}/messages")
async def get_chat_messages(chat_room: str, user: User = Depends(get_current_user), limit: int = 50):
    # Verify user has access to chat room
    if chat_room == "boys_only" and not user.section.endswith(("B1", "B2")):
        if not user.is_ex_student:
            raise HTTPException(status_code=403, detail="Access denied")
    elif chat_room == "girls_only" and not user.section.endswith(("G1", "G2")):
        if not user.is_ex_student:
            raise HTTPException(status_code=403, detail="Access denied")
    elif chat_room.startswith("class_") and user.is_ex_student:
        raise HTTPException(status_code=403, detail="Ex-students cannot access class chats")
    elif chat_room == "ex_students" and not user.is_ex_student:
        raise HTTPException(status_code=403, detail="Only ex-students can access this chat")
    
    messages = await db.chat_messages.find({"chat_room": chat_room}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    for msg in messages:
        if isinstance(msg.get('created_at'), str):
            msg['created_at'] = datetime.fromisoformat(msg['created_at'])
        msg_user = await db.users.find_one({"user_id": msg['user_id']}, {"_id": 0, "display_name": 1, "profile_picture": 1})
        msg['user'] = msg_user
    
    return list(reversed(messages))

# Direct Messages
@api_router.get("/dm/conversations")
async def get_dm_conversations(user: User = Depends(get_current_user)):
    messages = await db.direct_messages.find(
        {"$or": [{"sender_id": user.user_id}, {"receiver_id": user.user_id}]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    # Group by conversation
    conversations = {}
    for msg in messages:
        other_user_id = msg['receiver_id'] if msg['sender_id'] == user.user_id else msg['sender_id']
        if other_user_id not in conversations:
            conversations[other_user_id] = []
        if isinstance(msg.get('created_at'), str):
            msg['created_at'] = datetime.fromisoformat(msg['created_at'])
        conversations[other_user_id].append(msg)
    
    # Enrich with user data
    result = []
    for other_user_id, msgs in conversations.items():
        other_user = await db.users.find_one({"user_id": other_user_id}, {"_id": 0, "user_id": 1, "display_name": 1, "id_number": 1, "profile_picture": 1})
        unread_count = sum(1 for m in msgs if m['receiver_id'] == user.user_id and not m['read'])
        result.append({
            "user": other_user,
            "last_message": msgs[0],
            "unread_count": unread_count
        })
    
    return result

@api_router.get("/dm/{other_user_id}/messages")
async def get_dm_messages(other_user_id: str, user: User = Depends(get_current_user), limit: int = 50):
    messages = await db.direct_messages.find(
        {"$or": [
            {"sender_id": user.user_id, "receiver_id": other_user_id},
            {"sender_id": other_user_id, "receiver_id": user.user_id}
        ]},
        {"_id": 0}
    ).sort("created_at", 1).limit(limit).to_list(limit)
    
    # Mark as read
    await db.direct_messages.update_many(
        {"sender_id": other_user_id, "receiver_id": user.user_id, "read": False},
        {"$set": {"read": True}}
    )
    
    for msg in messages:
        if isinstance(msg.get('created_at'), str):
            msg['created_at'] = datetime.fromisoformat(msg['created_at'])
    
    return messages

@api_router.post("/dm/{receiver_id}/send")
async def send_dm(receiver_id: str, message: dict, user: User = Depends(get_current_user)):
    dm = DirectMessage(
        sender_id=user.user_id,
        receiver_id=receiver_id,
        content=message['content']
    )
    
    doc = dm.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.direct_messages.insert_one(doc)
    
    # Send via WebSocket if receiver is online
    await manager.send_personal_message(doc, receiver_id)
    
    return dm

# Admin: Get all users
@api_router.get("/admin/users")
async def get_all_users(admin: User = Depends(verify_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(5000)
    return users

# Admin: Update user badges
@api_router.put("/admin/users/{user_id}/badges")
async def update_user_badges(user_id: str, badges: List[str], admin: User = Depends(verify_admin)):
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"badges": badges}}
    )
    return {"status": "success"}

# WebSocket for real-time chat
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            
            if data['type'] == 'chat_message':
                # Save to database
                chat_msg = ChatMessage(
                    chat_room=data['chat_room'],
                    user_id=user_id,
                    content=data['content']
                )
                doc = chat_msg.model_dump()
                doc['created_at'] = doc['created_at'].isoformat()
                await db.chat_messages.insert_one(doc)
                
                # Get user info
                user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "display_name": 1, "profile_picture": 1})
                
                # Broadcast to all connected users
                broadcast_data = {
                    **doc,
                    "user": user
                }
                await manager.broadcast(broadcast_data, data['chat_room'])
            
            elif data['type'] == 'dm':
                dm = DirectMessage(
                    sender_id=user_id,
                    receiver_id=data['receiver_id'],
                    content=data['content']
                )
                doc = dm.model_dump()
                doc['created_at'] = doc['created_at'].isoformat()
                await db.direct_messages.insert_one(doc)
                
                # Send to receiver
                await manager.send_personal_message(doc, data['receiver_id'])
    
    except WebSocketDisconnect:
        manager.disconnect(user_id)

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
