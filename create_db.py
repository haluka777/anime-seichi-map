import sqlite3

# データベースファイルを作成（なければ新規作成される）
conn = sqlite3.connect("seichi.db")
cur = conn.cursor()

# spotsテーブルを作成
cur.execute("""
CREATE TABLE IF NOT EXISTS spots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anime_name TEXT,   -- 追加：作品名
    name TEXT NOT NULL, -- 場所名
    address TEXT,
    latitude REAL,
    longitude REAL,
    note TEXT
);
""")

conn.commit()
conn.close()

print("✅ seichi.db を作成しました！")
