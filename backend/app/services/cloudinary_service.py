import logging
import cloudinary
import cloudinary.uploader
from app.core.config import settings

logger = logging.getLogger("problems_ap.cloudinary")


def is_cloudinary_configured() -> bool:
    return bool(
        settings.CLOUDINARY_CLOUD_NAME
        and settings.CLOUDINARY_API_KEY
        and settings.CLOUDINARY_API_SECRET
    )


def init_cloudinary() -> None:
    if is_cloudinary_configured():
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )
        logger.info("Cloudinary service initialized successfully.")


def upload_image_to_cloudinary(file_content: bytes, filename: str) -> str:
    """Uploads citizen evidence image to Cloudinary and returns optimized secure HTTPS URL."""
    if not is_cloudinary_configured():
        logger.warning("Cloudinary credentials not configured. Skipping remote upload.")
        return ""

    try:
        response = cloudinary.uploader.upload(
            file_content,
            folder="problems_ap/evidence",
            resource_type="image",
            transformation=[
                {"width": 1200, "crop": "limit", "quality": "auto", "fetch_format": "auto"}
            ],
        )
        return response.get("secure_url", "")
    except Exception as e:
        logger.error(f"Failed to upload image to Cloudinary: {e}")
        raise
