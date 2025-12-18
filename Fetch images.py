"""
聖地画像自動取得スクリプト
- Google Places API で場所の写真を取得
- 見つからない場合は Street View API でフォールバック
"""

import sqlite3
import requests
import os
import time
import json

# ========================================
# 設定
# ========================================
GOOGLE_API_KEY = "AIzaSyAS7HYsHYhWa8uIk0bdBS73PKypRpHzaFo"
DB_PATH = "seichi.db"
IMAGES_DIR = "images"  # 画像保存フォルダ

# ========================================
# フォルダ作成
# ========================================
if not os.path.exists(IMAGES_DIR):
    os.makedirs(IMAGES_DIR)
    print(f"📁 フォルダ作成: {IMAGES_DIR}/")

# ========================================
# データベース接続
# ========================================
def get_spots():
    """DBから全スポットを取得"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, address, latitude, longitude, anime_name FROM spots')
    spots = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return spots

# ========================================
# Google Places API で画像取得
# ========================================
def get_place_photo(name, address):
    """
    場所名と住所からGoogle Places APIで写真を取得
    """
    try:
        # Step 1: 場所を検索
        search_url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
        params = {
            'input': f"{name} {address}",
            'inputtype': 'textquery',
            'fields': 'photos,place_id,name',
            'key': GOOGLE_API_KEY
        }
        
        response = requests.get(search_url, params=params)
        data = response.json()
        
        if data.get('status') != 'OK' or not data.get('candidates'):
            return None
        
        candidate = data['candidates'][0]
        
        if 'photos' not in candidate or not candidate['photos']:
            return None
        
        # Step 2: 写真のURLを取得
        photo_reference = candidate['photos'][0]['photo_reference']
        
        photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference={photo_reference}&key={GOOGLE_API_KEY}"
        
        return photo_url
        
    except Exception as e:
        print(f"  ⚠️ Places API エラー: {e}")
        return None

# ========================================
# Street View API で画像取得（フォールバック）
# ========================================
def get_streetview_url(lat, lng):
    """
    座標からStreet View画像のURLを生成
    """
    url = f"https://maps.googleapis.com/maps/api/streetview?size=800x600&location={lat},{lng}&key={GOOGLE_API_KEY}"
    
    # Street Viewが存在するか確認
    meta_url = f"https://maps.googleapis.com/maps/api/streetview/metadata?location={lat},{lng}&key={GOOGLE_API_KEY}"
    
    try:
        response = requests.get(meta_url)
        data = response.json()
        
        if data.get('status') == 'OK':
            return url
        else:
            return None
    except:
        return None

# ========================================
# 画像をダウンロード
# ========================================
def download_image(url, filepath):
    """
    URLから画像をダウンロードして保存
    """
    try:
        response = requests.get(url, stream=True)
        if response.status_code == 200:
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            return True
    except Exception as e:
        print(f"  ⚠️ ダウンロードエラー: {e}")
    return False

# ========================================
# メイン処理
# ========================================
def main():
    print("=" * 50)
    print("🖼️  聖地画像自動取得スクリプト")
    print("=" * 50)
    
    spots = get_spots()
    total = len(spots)
    
    print(f"\n📊 対象スポット: {total}件\n")
    
    # 統計
    stats = {
        'places_api': 0,
        'streetview': 0,
        'not_found': 0,
        'already_exists': 0
    }
    
    # 結果を保存するリスト
    results = []
    
    for i, spot in enumerate(spots):
        spot_id = spot['id']
        name = spot['name'] or ''
        address = spot['address'] or ''
        lat = spot['latitude']
        lng = spot['longitude']
        
        filename = f"{spot_id}.jpg"
        filepath = os.path.join(IMAGES_DIR, filename)
        
        print(f"[{i+1}/{total}] {name[:30]}...", end=" ")
        
        # 既に画像がある場合はスキップ
        if os.path.exists(filepath):
            print("⏭️ スキップ（既存）")
            stats['already_exists'] += 1
            results.append({'id': spot_id, 'image': filename, 'source': 'existing'})
            continue
        
        # Step 1: Google Places API を試す
        photo_url = get_place_photo(name, address)
        
        if photo_url:
            if download_image(photo_url, filepath):
                print("✅ Places API")
                stats['places_api'] += 1
                results.append({'id': spot_id, 'image': filename, 'source': 'places'})
                time.sleep(0.1)  # API制限対策
                continue
        
        # Step 2: Street View API を試す
        streetview_url = get_streetview_url(lat, lng)
        
        if streetview_url:
            if download_image(streetview_url, filepath):
                print("✅ Street View")
                stats['streetview'] += 1
                results.append({'id': spot_id, 'image': filename, 'source': 'streetview'})
                time.sleep(0.1)
                continue
        
        # 両方失敗
        print("❌ 画像なし")
        stats['not_found'] += 1
        results.append({'id': spot_id, 'image': None, 'source': 'none'})
        
        time.sleep(0.1)  # API制限対策
    
    # 結果を保存
    with open('image_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    # 統計表示
    print("\n" + "=" * 50)
    print("📊 結果サマリー")
    print("=" * 50)
    print(f"✅ Places API:    {stats['places_api']}件")
    print(f"✅ Street View:   {stats['streetview']}件")
    print(f"⏭️ 既存スキップ:   {stats['already_exists']}件")
    print(f"❌ 画像なし:      {stats['not_found']}件")
    print(f"\n📁 画像保存先: {IMAGES_DIR}/")
    print(f"📄 結果ファイル: image_results.json")

if __name__ == "__main__":
    main()