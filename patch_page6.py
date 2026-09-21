import os

filepath = 'src/app/admin/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# The "Organisateurs" button looks like this:
old_button = """                <button 
                    onClick={() => setMainTab('organizers')} 
                    style={{ 
                        background: 'none', border: 'none', padding: '1rem 2rem', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer',
                        color: mainTab === 'organizers' ? '#0a2e73' : '#64748b',
                        borderBottom: mainTab === 'organizers' ? '3px solid #ff5a1f' : '3px solid transparent',
                        marginBottom: '-2px'
                    }}
                >
                    Organisateurs
                </button>"""

new_button = """                <button 
                    onClick={() => setMainTab('organizers')} 
                    style={{ 
                        background: 'none', border: 'none', padding: '1rem 2rem', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer',
                        color: mainTab === 'organizers' ? '#0a2e73' : '#64748b',
                        borderBottom: mainTab === 'organizers' ? '3px solid #ff5a1f' : '3px solid transparent',
                        marginBottom: '-2px'
                    }}
                >
                    Organisateurs
                </button>
                {userRole === 'super_admin' && (
                    <button 
                        onClick={() => setMainTab('users')} 
                        style={{ 
                            background: 'none', border: 'none', padding: '1rem 2rem', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer',
                            color: mainTab === 'users' ? '#0a2e73' : '#64748b',
                            borderBottom: mainTab === 'users' ? '3px solid #ff5a1f' : '3px solid transparent',
                            marginBottom: '-2px'
                        }}
                    >
                        ⚙️ Utilisateurs
                    </button>
                )}"""

content = content.replace(old_button, new_button)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Added Users tab button')
