import os

filepath = 'src/app/vote/[id]/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove email validation
content = content.replace('if (!email) return alert("L\'email est requis.");', '')

# 2. Make input optional visually and HTML
old_input = """                            <label>Email *</label>
                            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" className={styles.input} />"""

new_input = """                            <label>Email (facultatif)</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" className={styles.input} />"""

content = content.replace(old_input, new_input)

# 3. Handle Fedapay customer object if email is empty (just pass a dummy if empty to avoid FedaPay crash, or just pass whatever they typed)
# Actually, if email is optional, Fedapay accepts a phone number instead, but requires either.
# But just in case FedaPay strictly requires valid email format, let's pass a dummy if empty.
old_customer = """                    customer: {
                        email: email,
                        phone_number: {
                            number: phone,
                            country: "BJ"
                        }
                    },"""

new_customer = """                    customer: {
                        email: email || "anonyme@itaarena.com",
                        phone_number: {
                            number: phone,
                            country: "BJ"
                        }
                    },"""
content = content.replace(old_customer, new_customer)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated page.tsx')
