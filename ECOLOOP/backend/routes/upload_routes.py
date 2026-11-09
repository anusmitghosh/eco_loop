import os
import secrets
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from routes.auth_routes import get_current_user
from database import get_db
from auth import log_audit

router = APIRouter(prefix="/api/upload", tags=["upload"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024 # 5 MB

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    # 1. Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{ext}'. Allowed image extensions are: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # 2. Validate MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Disallowed content type '{file.content_type}'. Only images are allowed."
        )

    # 3. Read content and check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds the 5 MB security limit."
        )

    # 4. Generate cryptographically safe random filename (prevents directory traversal & overwrites)
    safe_filename = f"{secrets.token_hex(16)}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(dest_path, "wb") as f:
        f.write(content)

    file_url = f"/static/uploads/{safe_filename}"

    # 5. Record in database
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO uploaded_files (user_id, original_filename, stored_filename, file_url, file_size, mime_type)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user["id"], file.filename, safe_filename, file_url, len(content), file.content_type))
    upload_id = cursor.lastrowid
    conn.commit()

    log_audit(conn, user["id"], "FILE_UPLOADED", "file", str(upload_id), f"Uploaded {file.filename} -> {safe_filename}")
    conn.close()

    return {
        "success": True,
        "upload_id": upload_id,
        "file_url": file_url,
        "original_filename": file.filename,
        "file_size": len(content)
    }
