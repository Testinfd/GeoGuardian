from fastapi import HTTPException, Depends, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from supabase import Client
from .config import settings
from .database import get_supabase
from ..models.models import User
import httpx
from typing import Optional

security = HTTPBearer()


async def verify_supabase_token(token: str) -> dict:
    """Verify Supabase JWT token"""
    try:
        # Use Supabase's built-in user retrieval to verify the token
        supabase = get_supabase()

        # This will automatically verify the token and return user data
        user_response = await supabase.auth.get_user(token)

        if user_response.user:
            # Return the user payload
            return {
                "sub": user_response.user.id,
                "email": user_response.user.email,
                "name": user_response.user.user_metadata.get("name") if user_response.user.user_metadata else None,
                "picture": user_response.user.user_metadata.get("avatar_url") if user_response.user.user_metadata else None,
                "aud": "authenticated",
                "role": "authenticated"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
    except Exception as e:
        print(f"Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate token"
        )


async def verify_google_token(token: str) -> dict:
    """Verify Google JWT token"""
    try:
        # Verify with Google's token info endpoint
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token"
                )
            return response.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed"
        )


async def get_current_user_optional(
    authorization: str = Header(None),
    supabase: Client = Depends(get_supabase)
) -> User:
    """Get current authenticated user (optional) - returns None if not authenticated"""
    
    if not authorization or not authorization.startswith("Bearer "):
        return None
        
    token = authorization.replace("Bearer ", "")
    
    try:
        # Verify the token and get user info
        payload = await verify_supabase_token(token)
        user_id = payload.get("sub")
        user_email = payload.get("email")
        
        if not user_id or not user_email:
            return None
        
        # For MVP: Create user object from token data, skip database lookup due to RLS
        user_data = {
            "id": user_id,
            "email": user_email,
            "name": payload.get("name", user_email),
            "picture": payload.get("picture"),
            "created_at": None
        }
        return User(**user_data)
        
    except Exception:
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase)
) -> User:
    """Get current authenticated user from Supabase token"""
    token = credentials.credentials
    
    try:
        # Verify the token and get user info
        payload = await verify_supabase_token(token)
        user_id = payload.get("sub")
        user_email = payload.get("email")
        
        if not user_id or not user_email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
        
        # For MVP: Create user object from token data, skip database lookup due to RLS
        user_data = {
            "id": user_id,
            "email": user_email,
            "name": payload.get("name", user_email),
            "picture": payload.get("picture"),
            "created_at": None
        }
        return User(**user_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


async def get_or_create_user(user_data: dict, supabase: Client) -> User:
    """Get or create user from Google OAuth data"""
    email = user_data.get("email")
    name = user_data.get("name", email)
    picture = user_data.get("picture")
    
    # Check if user exists
    response = supabase.table("users").select("*").eq("email", email).execute()
    
    if response.data:
        user_data = response.data[0]
        return User(**user_data)
    else:
        # Create new user
        new_user = {
            "email": email,
            "name": name,
            "picture": picture
        }
        response = supabase.table("users").insert(new_user).execute()
        
        if response.data:
            return User(**response.data[0])
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
