import sqlite3
c = sqlite3.connect('Kantama.db')
hash = c.execute("SELECT password_hash FROM users WHERE email='admin@Kantama.fi'").fetchone()[0]
c.execute("UPDATE users SET password_hash=?, is_active=1, is_verified=1 WHERE email='t.leinonen@yahoo.com'", (hash,))
c.commit()
print("Done! t.leinonen@yahoo.com can now login with password: admin123")

