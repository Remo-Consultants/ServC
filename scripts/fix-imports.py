from pathlib import Path

replacements = [
    ('import { Role } from "@prisma/client";', 'import { Role } from "@/lib/roles";'),
    ("import { Role } from '@prisma/client';", 'import { Role } from "@/lib/roles";'),
    (
        'import { Role, RepairOrderStatus } from "@prisma/client";',
        'import { Role, type RepairOrderStatus } from "@/lib/roles";',
    ),
    (
        'import { PrismaClient, Role, FuelType, PartSource } from "@prisma/client";',
        'import { PrismaClient } from "@prisma/client";\nimport { Role, FuelType, PartSource } from "../src/lib/roles";',
    ),
]

# Also remove unused Role import from otp/request if Role isn't used
for path in list(Path("src").rglob("*.ts")) + list(Path("src").rglob("*.tsx")) + [Path("prisma/seed.ts")]:
    text = path.read_text(encoding="utf-8")
    orig = text
    for a, b in replacements:
        text = text.replace(a, b)
    if text != orig:
        path.write_text(text, encoding="utf-8")
        print("updated", path)
