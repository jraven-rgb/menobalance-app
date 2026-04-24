from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from backend.database import db
from backend.models.models import ForumPost, ForumPostCreate, ForumComment
from backend.routers.auth import get_current_user

router = APIRouter(prefix="/community", tags=["community"])

@router.get("/posts")
async def get_posts(category: Optional[str] = None):
    query = {}
    if category and category != "All":
        query["category"] = category
    
    # Sort by newest
    posts = await db.forum_posts.find(query).sort("created_at", -1).to_list(100)
    for post in posts:
        post["_id"] = str(post["_id"])
    return posts

@router.post("/posts")
async def create_post(post: ForumPostCreate, current_user = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    # Force Anonymous to protect identity
    new_post = ForumPost(
        user_id=user_id,
        author_alias="Anonymous", 
        category=post.category,
        title=post.title,
        content=post.content
    )
    
    result = await db.forum_posts.insert_one(new_post.dict())
    return {"status": "success", "post_id": str(result.inserted_id)}

@router.post("/posts/{post_id}/like")
async def like_post(post_id: str, current_user = Depends(get_current_user)):
    # Simple like increment (in real system, would track users to prevent double-likes)
    result = await db.forum_posts.update_one(
        {"id": post_id},
        {"$inc": {"likes": 1}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"status": "success"}

@router.get("/posts/{post_id}/comments")
async def get_comments(post_id: str):
    comments = await db.forum_comments.find({"post_id": post_id}).sort("created_at", 1).to_list(100)
    for comment in comments:
        comment["_id"] = str(comment["_id"])
    return comments

@router.post("/posts/{post_id}/comments")
async def add_comment(post_id: str, content: str, current_user = Depends(get_current_user)):
    new_comment = ForumComment(
        post_id=post_id,
        content=content,
        author_alias="Anonymous"
    )
    
    await db.forum_comments.insert_one(new_comment.dict())
    await db.forum_posts.update_one({"id": post_id}, {"$inc": {"comments_count": 1}})
    
    return {"status": "success"}
