"""
Seed script to populate the marketplace with sample templates.

On a fresh database, API startup also runs the same idempotent seed; this CLI is optional.
"""
import asyncio
import os
import sys

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from sqlalchemy import func, or_, select

from backend.database.db import AsyncSessionLocal, init_db
from backend.database.models import WorkflowTemplateDB
from backend.services.default_marketplace_templates import (
    BUNDLED_MARKETPLACE_TEMPLATES,
    ensure_default_marketplace_templates,
    ensure_default_marketplace_workflows,
)


async def seed_templates():
    await init_db()
    async with AsyncSessionLocal() as db:
        inserted_templates = await ensure_default_marketplace_templates(db)
        inserted_workflows = await ensure_default_marketplace_workflows(db)

        if inserted_templates > 0:
            print(f"✅ Seeded {inserted_templates} workflow template(s) (workflow_templates table)")
            print("\nTemplates added:")
            for template_data in BUNDLED_MARKETPLACE_TEMPLATES:
                cat = template_data["category"]
                cat_val = cat.value if hasattr(cat, "value") else str(cat)
                print(f"  - {template_data['name']} ({cat_val})")
        else:
            result = await db.execute(select(func.count(WorkflowTemplateDB.id)))
            existing_count = result.scalar() or 0
            print(
                f"⚠️  workflow_templates: {existing_count} row(s) already — skipped template seed."
            )

        if inserted_workflows > 0:
            print(f"✅ Seeded {inserted_workflows} public workflow(s) (workflows table)")
        else:
            from backend.database.models import WorkflowDB

            wf_result = await db.execute(
                select(func.count(WorkflowDB.id)).where(
                    or_(
                        WorkflowDB.is_public == True,
                        WorkflowDB.is_template == True,
                    )
                )
            )
            wf_count = wf_result.scalar() or 0
            print(
                f"⚠️  workflows (public/template): {wf_count} row(s) already — skipped workflow seed."
            )


if __name__ == "__main__":
    print("🌱 Seeding workflow templates for marketplace...")
    asyncio.run(seed_templates())
    print("\n✨ Done! The marketplace should now be populated.")
