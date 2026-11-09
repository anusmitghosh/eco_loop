from fastapi import APIRouter, Depends
from database import get_db
from routes.auth_routes import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@router.get("")
def get_notifications(user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM notifications
        WHERE user_id = ?
        ORDER BY id DESC LIMIT 50
    """, (user["id"],))
    rows = cursor.fetchall()
    conn.close()
    return {"success": True, "notifications": [dict(r) for r in rows]}

@router.post("/{notification_id}/read")
def mark_read(notification_id: int, user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", (notification_id, user["id"]))
    conn.commit()
    conn.close()
    return {"success": True}

@router.post("/read-all")
def mark_all_read(user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ?", (user["id"],))
    conn.commit()
    conn.close()
    return {"success": True}
