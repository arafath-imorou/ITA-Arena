import os
import requests
import json

env = {}
with open('.env.local', 'r') as f:
    for line in f:
        if '=' in line:
            key, val = line.strip().split('=', 1)
            env[key] = val

url = f"{env['NEXT_PUBLIC_SUPABASE_URL']}/rest/v1/votes_cast?status=eq.pending"
headers = {
    "apikey": env['SUPABASE_SERVICE_ROLE_KEY'],
    "Authorization": f"Bearer {env['SUPABASE_SERVICE_ROLE_KEY']}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

res = requests.patch(url, headers=headers, json={"status": "valid"})
print("Status:", res.status_code)
print("Response:", res.text)
