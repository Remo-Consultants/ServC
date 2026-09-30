import re

path = "prisma/schema.prisma"
text = open(path, encoding="utf-8").read()

enums = re.findall(r"enum (\w+) \{([^}]+)\}", text)
enum_map = {}
for name, body in enums:
    vals = [v.strip() for v in body.split("\n") if v.strip() and not v.strip().startswith("//")]
    enum_map[name] = vals[0] if vals else "UNKNOWN"

text2 = re.sub(r"\nenum \w+ \{[^}]+\}\n", "\n", text)
text2 = text2.replace("Json?", "String?")

for name in enum_map:
    text2 = re.sub(
        rf"\b{name}\s+@default\((\w+)\)",
        lambda m: f'String @default("{m.group(1)}")',
        text2,
    )
    text2 = re.sub(rf"\b{name}\b", "String", text2)

open(path, "w", encoding="utf-8").write(text2)
print("Converted enums:", ", ".join(enum_map.keys()))
