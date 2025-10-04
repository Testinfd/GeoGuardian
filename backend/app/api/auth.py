from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from supabase import Client
from pydantic import BaseModel
from typing import Optional
from ..core.auth import verify_google_token, get_or_create_user, get_current_user
from ..core.database import get_supabase
from ..utils.email import email_service

router = APIRouter(prefix="/auth", tags=["authentication"])


class GoogleTokenRequest(BaseModel):
    token: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class OAuthRequest(BaseModel):
    provider: str
    email: str
    name: str
    image: Optional[str] = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


@router.post("/google", response_model=AuthResponse)
async def authenticate_with_google(
    request: GoogleTokenRequest,
    supabase: Client = Depends(get_supabase)
):
    """Authenticate user with Google OAuth token"""

    # Verify Google token
    user_data = await verify_google_token(request.token)

    # Get or create user (respecting RLS)
    user = await get_or_create_user(user_data, supabase)

    # Sign in with Supabase to get access token
    try:
        auth_response = supabase.auth.sign_in_with_oauth_credentials({
            "provider": "google",
            "id_token": request.token
        })
        access_token = auth_response.session.access_token if auth_response.session else None
    except Exception:
        # Fallback: create a simple session
        access_token = request.token  # Use the Google token temporarily

    # Send welcome email for new users (optional, non-blocking)
    try:
        await email_service.send_welcome_email(user.email, user.name)
    except Exception:
        pass  # Don't fail auth if email fails

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "picture": user.picture
        }
    )


@router.post("/register")
async def register_user(
    request: RegisterRequest,
    supabase: Client = Depends(get_supabase)
):
    """Register a new user with email and password"""
    try:
        # Create user with Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {
                    "name": request.name
                }
            }
        })
        
        if auth_response.user:
            # For MVP: Skip inserting into users table due to RLS policies
            # User will be created in Supabase Auth but not in our users table
            # TODO: Configure RLS policies or use service role key

            return {
                "id": auth_response.user.id,
                "email": request.email,
                "name": request.name,
                "message": "User registered successfully (MVP mode)"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed"
            )
            
    except Exception as e:
        if "already registered" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login")
async def login_user(
    request: LoginRequest,
    supabase: Client = Depends(get_supabase)
):
    """Login user with email and password"""
    try:
        # Sign in with Supabase Auth
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })

        if auth_response.user and auth_response.session:
            # Try to get user from our users table first
            try:
                user_response = supabase.table("users").select("*").eq("id", auth_response.user.id).execute()
                if user_response.data and len(user_response.data) > 0:
                    user_data = user_response.data[0]
                    return {
                        "id": user_data["id"],
                        "email": user_data["email"],
                        "name": user_data["name"],
                        "picture": user_data["picture"],
                        "access_token": auth_response.session.access_token
                    }
            except Exception:
                pass  # Fall back to Supabase user data

            # Fallback to Supabase user data
            return {
                "id": auth_response.user.id,
                "email": auth_response.user.email,
                "name": auth_response.user.user_metadata.get("name", auth_response.user.email),
                "picture": auth_response.user.user_metadata.get("picture"),
                "access_token": auth_response.session.access_token
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

    except Exception as e:
        if "invalid" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Login failed: {str(e)}"
        )


@router.post("/oauth")
async def oauth_login(
    request: OAuthRequest,
    supabase: Client = Depends(get_supabase)
):
    """Handle OAuth login (Google, etc.)"""
    try:
        # For MVP: Return user data directly without database operations due to RLS
        # TODO: Configure RLS policies or use service role key

        return {
            "id": "oauth_" + request.email.replace("@", "_").replace(".", "_"),  # Generate temp ID
            "email": request.email,
            "name": request.name,
            "picture": request.image
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth login failed: {str(e)}"
        )


@router.get("/me")
async def get_current_user_info(
    current_user = Depends(get_current_user)
):
    """Get current user information"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "picture": current_user.picture
    }
