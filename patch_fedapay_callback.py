import os

filepath = 'src/app/vote/[id]/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_condition = """                        if (response.reason === "checkout.complete" || (response.status || "").toLowerCase() === "approved") {"""
new_condition = """                        const reason = (response.reason || "").toLowerCase().replace(/_/g, ' ').replace(/\./g, ' ');
                        const status = (response.transaction?.status || response.status || "").toLowerCase();
                        if (reason === "checkout complete" || status === "approved") {"""

content = content.replace(old_condition, new_condition)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated page.tsx')
