from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
from groq import Groq
import json
import re
import requests
from math import radians, sin, cos, sqrt, atan2
import base64
from io import BytesIO
from PIL import Image


app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# API
GROQ_API_KEY = "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"
client = Groq(api_key=GROQ_API_KEY)

MODEL_NAME = "llama-3.3-70b-versatile"

# Google Maps API 
GOOGLE_API_KEY = "AIzaSyAS7HYsHYhWa8uIk0bdBS73PKypRpHzaFo"

# Google Custom Search API 
GOOGLE_SEARCH_API_KEY = "AIzaSyA0r5o9dSg5dNLS5xoqCbrkcRKC1Go0IYw"
GOOGLE_SEARCH_ENGINE_ID = "8079ebae211754c29"


def get_db_connection():
    conn = sqlite3.connect('seichi.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    return app.send_static_file('map.html')

@app.route('/api/spots', methods=['GET'])
def get_spots():
    conn = get_db_connection()
    spots = conn.execute('SELECT * FROM spots').fetchall()
    conn.close()
    return jsonify([dict(row) for row in spots])

@app.route('/api/translate', methods=['POST'])
def translate_text():
    try:
        data = request.json
        text = data.get('text', '')
        target_language = data.get('target_language', 'en')
        
        if not text:
            return jsonify({'error': 'テキストが空です'}), 400
        
        # 言語コードと言語名のマッピング
        language_config = {
            'en': {'name': 'English', 'instruction': 'Translate the following Japanese text to English. Output ONLY the translation, nothing else.'},
            'zh': {'name': '简体中文', 'instruction': '请将以下日语文本翻译成简体中文。只输出翻译结果，不要添加任何解释。'},
            'ko': {'name': '한국어', 'instruction': '다음 일본어 텍스트를 한국어로 번역해주세요. 번역 결과만 출력하고 다른 설명은 추가하지 마세요.'},
            'ja': {'name': '日本語', 'instruction': '以下のテキストを日本語に翻訳してください。翻訳結果のみを出力してください。'}
        }
        
        config = language_config.get(target_language, language_config['en'])
        
        prompt = f"""{config['instruction']}

Text to translate:
{text}

Translation:"""
        
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": f"You are a professional translator. Translate accurately to {config['name']}. Output only the translation without any explanations or notes."},
                {"role": "user", "content": prompt}
            ],
            model=MODEL_NAME,
            temperature=0.3,
            max_tokens=500,
        )
        
        translated_text = chat_completion.choices[0].message.content.strip()
        
        # 余計なプレフィックスを除去
        prefixes_to_remove = ['Translation:', 'translation:', '翻译:', '翻訳:', '번역:']
        for prefix in prefixes_to_remove:
            if translated_text.startswith(prefix):
                translated_text = translated_text[len(prefix):].strip()
        
        return jsonify({
            'original': text,
            'translated': translated_text,
            'target_language': target_language
        })
        
    except Exception as e:
        print(f"翻訳エラー: {e}")
        return jsonify({'error': f'翻訳エラー: {str(e)}'}), 500

@app.route('/api/smart-search', methods=['POST'])
def smart_search():
    try:
        data = request.json
        query = data.get('query', '').strip()
        
        if not query:
            return jsonify({'translated_query': '', 'original_query': query})
        
        conn = get_db_connection()
        spots = conn.execute('SELECT * FROM spots').fetchall()
        conn.close()
        
        spots_data = [dict(row) for row in spots]
        
        query_lower = query.lower()
        direct_matches = []
        for spot in spots_data:
            if (query_lower in (spot.get('name', '') or '').lower() or
                query_lower in (spot.get('anime_name', '') or '').lower() or
                query_lower in (spot.get('address', '') or '').lower()):
                direct_matches.append(spot)
        
        if direct_matches:
            return jsonify({
                'translated_query': query,
                'original_query': query,
                'needs_translation': False
            })
        
        prompt = f""":
Your Name → 
{query} →"""
        
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=MODEL_NAME,
            temperature=0.3,
            max_tokens=50,
        )
        
        translated_query = chat_completion.choices[0].message.content.strip()
        
        return jsonify({
            'translated_query': translated_query,
            'original_query': query,
            'needs_translation': True
        })
        
    except Exception as e:
        print(f"  ")
        return jsonify({'translated_query': query, 'original_query': query, 'needs_translation': False})

@app.route('/api/ai-search', methods=['POST'])
def ai_search():
    """AI"""
    try:
        data = request.json
        user_question = data.get('question', '')
        language = data.get('language', 'ja')
        
        if not user_question:
            return jsonify({'error': ''}), 400
        
        print(f"\n質問: {user_question}")
        
        intent_prompt = f"""以下の質問からアニメ名、地名、キーワードを抽出してJSON形式で返してください。

出力形式:
{{"animes": ["アニメ名"], "locations": ["地名"], "keywords": ["キーワード"]}}

例:
"京都のアニメ聖地" → {{"animes": [], "locations": ["京都"], "keywords": ["聖地"]}}
"君の名はの聖地" → {{"animes": ["君の名は"], "locations": [], "keywords": ["聖地"]}}
"岐阜県のアニメ" → {{"animes": [], "locations": ["岐阜"], "keywords": ["アニメ"]}}
"大阪で行けるアニメ聖地" → {{"animes": [], "locations": ["大阪"], "keywords": ["聖地"]}}

質問: {user_question}
JSON形式で回答:"""

        intent_response = client.chat.completions.create(
            messages=[{"role": "user", "content": intent_prompt}],
            model=MODEL_NAME,
            temperature=0.3,
            max_tokens=200,
        )
        
        intent_text = intent_response.choices[0].message.content.strip()
        
        try:
            intent = json.loads(intent_text)
            animes = intent.get('animes', [])
            locations = intent.get('locations', [])
            keywords = intent.get('keywords', [])
        except:
            animes = []
            locations = []
            keywords = user_question.split()[:3]
        
        print(f"抽出結果 - アニメ: {animes}, 地名: {locations}")
        
        conn = get_db_connection()
        spots_data = []
        
        if animes:
            for anime in animes:
                results = conn.execute('SELECT * FROM spots WHERE anime_name LIKE ? ORDER BY RANDOM() LIMIT 15', [f'%{anime}%']).fetchall()
                spots_data.extend([dict(row) for row in results])
        
        if locations:
            for loc in locations:
                results = conn.execute('''
                    SELECT * FROM spots 
                    WHERE address LIKE ? OR name LIKE ? OR note LIKE ?
                    ORDER BY RANDOM()
                    LIMIT 20
                ''', [f'%{loc}%', f'%{loc}%', f'%{loc}%']).fetchall()
                spots_data.extend([dict(row) for row in results])
        
        if not spots_data and keywords:
            for kw in keywords[:3]:
                results = conn.execute('''
                    SELECT * FROM spots 
                    WHERE LOWER(name) LIKE ? OR LOWER(anime_name) LIKE ? OR LOWER(address) LIKE ?
                    ORDER BY RANDOM()
                    LIMIT 10
                ''', [f'%{kw.lower()}%', f'%{kw.lower()}%', f'%{kw.lower()}%']).fetchall()
                spots_data.extend([dict(row) for row in results])
        
        seen = set()
        unique = []
        for s in spots_data:
            if s['id'] not in seen:
                seen.add(s['id'])
                unique.append(s)
        spots_data = unique
        
        if not spots_data:
            spots_data = [dict(row) for row in conn.execute('SELECT * FROM spots ORDER BY RANDOM() LIMIT 10').fetchall()]
        
        conn.close()
        
        # 言語別の回答指示
        lang_instructions = {
            'ja': '日本語で回答してください。',
            'en': 'Please answer in English.',
            'zh': '请用简体中文回答。',
            'ko': '한국어로 답변해 주세요.'
        }
        
        lang_instruction = lang_instructions.get(language, '日本語で回答してください。')
        
        summary = []
        for spot in spots_data[:30]:
            summary.append({
                'id': spot['id'],
                'name': spot['name'][:40],
                'anime': spot['anime_name'][:40],
                'address': spot['address'][:60]
            })
        
        answer_prompt = f"""あなたはアニメ聖地巡礼の専門ガイドです。
{lang_instruction}

以下は検索で見つかった聖地データです（全{len(spots_data)}件中{len(summary)}件）:
{json.dumps(summary, ensure_ascii=False, indent=2)}

ユーザーの質問: {user_question}

回答のルール:
1. 必ず{lang_instruction}
2. 見つかった聖地を紹介してください
3. 具体的なおすすめを最大10件挙げてください
4. 親しみやすく丁寧な口調で
5. 最後に関連するスポットIDを [IDS: 1,2,3] 形式で記載

回答:"""
        
        answer_response = client.chat.completions.create(
            messages=[{"role": "user", "content": answer_prompt}],
            model=MODEL_NAME,
            temperature=0.6,
            max_tokens=2000,
        )
        
        ai_answer = answer_response.choices[0].message.content
        
        related = []
        match = re.search(r'\[IDS:\s*(.*?)\]', ai_answer)
        if match:
            ids_str = match.group(1).strip()
            ai_answer = re.sub(r'\[IDS:.*?\]', '', ai_answer).strip()
            if ids_str != 'none':
                try:
                    ids = [int(i.strip()) for i in ids_str.split(',')]
                    related = [s for s in spots_data if s['id'] in ids][:10]
                except:
                    pass
        
        return jsonify({'answer': ai_answer, 'related_spots': related, 'language': language})
        
    except Exception as e:
        print(f"  AI")
        return jsonify({'error': f': {str(e)}'}), 500

@app.route('/api/ai-recommend', methods=['POST'])
def ai_recommend():
    """AI"""
    try:
        data = request.json
        history = data.get('history', [])
        viewed_animes = data.get('viewed_animes', [])
        language = data.get('language', 'ja')
        
        if not history:
            return jsonify({'error': ''}), 400
        
        print(f"\n閲覧済みアニメ: {viewed_animes}")
        
        conn = get_db_connection()
        
        all_animes_query = conn.execute('SELECT DISTINCT anime_name FROM spots WHERE anime_name IS NOT NULL').fetchall()
        all_anime_names = [row['anime_name'] for row in all_animes_query]
        
        unviewed_animes = [anime for anime in all_anime_names if anime not in viewed_animes]
        
        print(f"未視聴アニメ: {unviewed_animes}")
        
        if not unviewed_animes:
            return jsonify({'recommendation': '', 'language': language})
        
        # ランダムに10作品選択
        import random
        selected_animes = random.sample(unviewed_animes, min(10, len(unviewed_animes)))
        
        spots_data = []
        for anime in selected_animes:
            result = conn.execute('SELECT * FROM spots WHERE anime_name = ? ORDER BY RANDOM() LIMIT 1', [anime]).fetchone()
            if result:
                spots_data.append(dict(result))
        
        conn.close()
        
        lang_map = {'ja': '日本語', 'en': 'English', 'zh': '中文', 'ko': '한국어'}
        
        summary = [{'id': s['id'], 'name': s['name'][:30], 'anime': s['anime_name'][:30], 'address': s['address'][:40]} for s in spots_data]
        
        prompt = f"""アニメ聖地のおすすめを{lang_map.get(language, '日本語')}で。

【閲覧済み】{', '.join(viewed_animes)}

【未視聴候補（複数アニメ）】
{json.dumps(summary, ensure_ascii=False, indent=2)}

【重要】
1. **異なるアニメから5つ選ぶ**
2. 同じアニメ不可
3. 多様なジャンル提案
4. 各聖地の魅力説明
5. おすすめ理由明確に

例:
「日常系がお好きですね。
1. 『ふらいんぐうぃっち』弘前城 - 青森の自然...
2. 『氷菓』高山市 - 古い町並み...
3. 『たまゆら』竹原市 - 瀬戸内の港...」

おすすめ:"""
        
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=MODEL_NAME,
            temperature=0.8,
            max_tokens=800,
        )
        
        return jsonify({'recommendation': response.choices[0].message.content, 'language': language})
        
    except Exception as e:
        print(f"  ")
        return jsonify({'error': f': {str(e)}'}), 500


# ========================================
# 
# ========================================

def calculate_distance(lat1, lng1, lat2, lng2):
    """2Haversine"""
    R = 6371
    
    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)
    delta_lat = radians(lat2 - lat1)
    delta_lng = radians(lng2 - lng1)
    
    a = sin(delta_lat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lng/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c


def get_route_info(origin_lat, origin_lng, dest_lat, dest_lng, mode='driving'):
    """Google Directions API"""
    url = "https://maps.googleapis.com/maps/api/directions/json"
    
    params = {
        'origin': f"{origin_lat},{origin_lng}",
        'destination': f"{dest_lat},{dest_lng}",
        'mode': mode,
        'language': 'ja',
        'key': GOOGLE_API_KEY
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if data['status'] == 'OK':
            route = data['routes'][0]['legs'][0]
            return {
                'success': True,
                'distance_text': route['distance']['text'],
                'distance_meters': route['distance']['value'],
                'duration_text': route['duration']['text'],
                'duration_seconds': route['duration']['value'],
                'start_address': route['start_address'],
                'end_address': route['end_address']
            }
        else:
            return {
                'success': False,
                'error': data['status']
            }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def get_ai_suggestions(spots):
    """Groq AI"""
    spot_list = []
    for spot in spots:
        spot_list.append(f"- {spot['name']}: {spot.get('anime_name', '')}")
    
    prompt = f"""

:
{chr(10).join(spot_list)}

JSONJSON:
{{
  "suggestions": [
    {{
      "name": "",
      "duration_minutes": 30,
      "comment": "20"
    }}
  ]
}}
"""

    try:
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=MODEL_NAME,
            temperature=0.5,
            max_tokens=800,
        )
        
        response_text = response.choices[0].message.content
        response_text = response_text.replace('```json', '').replace('```', '').strip()
        
        suggestions = json.loads(response_text)
        return suggestions
    
    except Exception as e:
        print(f"  AI: {e}")
        return {
            "suggestions": [
                {"name": spot['name'], "duration_minutes": 30, "comment": ""}
                for spot in spots
            ]
        }


def calculate_optimal_route(selected_spots, start_location=None):
    """"""
    if len(selected_spots) < 2:
        return {'error': '2'}
    
    if start_location is None:
        current_location = {
            'lat': float(selected_spots[0]['latitude']),
            'lng': float(selected_spots[0]['longitude'])
        }
        remaining_spots = selected_spots[1:]
    else:
        current_location = start_location
        remaining_spots = selected_spots[:]
    
    route = []
    total_distance = 0
    total_duration = 0
    
    while remaining_spots:
        min_distance = float('inf')
        next_spot = None
        next_index = -1
        
        for i, spot in enumerate(remaining_spots):
            distance = calculate_distance(
                current_location['lat'], current_location['lng'],
                float(spot['latitude']), float(spot['longitude'])
            )
            
            if distance < min_distance:
                min_distance = distance
                next_spot = spot
                next_index = i
        
        if next_spot:
            route_info = get_route_info(
                current_location['lat'], current_location['lng'],
                float(next_spot['latitude']), float(next_spot['longitude'])
            )
            
            route.append({
                'spot': next_spot,
                'route_info': route_info
            })
            
            if route_info['success']:
                total_distance += route_info['distance_meters']
                total_duration += route_info['duration_seconds']
            
            current_location = {
                'lat': float(next_spot['latitude']),
                'lng': float(next_spot['longitude'])
            }
            
            remaining_spots.pop(next_index)
    
    ai_suggestions = get_ai_suggestions(selected_spots)
    
    result = {
        'route': route,
        'ai_suggestions': ai_suggestions,
        'total_distance_km': round(total_distance / 1000, 1),
        'total_duration_minutes': round(total_duration / 60),
        'spot_count': len(selected_spots)
    }
    
    return result


@app.route('/api/route-planner', methods=['POST'])
def route_planner():
    """"""
    try:
        data = request.json
        spot_ids = data.get('spot_ids', [])
        start_location = data.get('start_location')
        
        if not spot_ids or len(spot_ids) < 2:
            return jsonify({'error': '2'}), 400
        
        conn = get_db_connection()
        
        placeholders = ','.join(['?' for _ in spot_ids])
        query = f'SELECT * FROM spots WHERE id IN ({placeholders})'
        rows = conn.execute(query, spot_ids).fetchall()
        conn.close()
        
        selected_spots = [dict(row) for row in rows]
        
        if len(selected_spots) < 2:
            return jsonify({'error': '2'}), 400
        
        print(f"\n  : {len(selected_spots)}")
        
        result = calculate_optimal_route(selected_spots, start_location)
        
        return jsonify(result)
    
    except Exception as e:
        print(f'  : {e}')
        return jsonify({'error': ''}), 500


# ========================================
# Google Vision API
# ========================================

def analyze_image_with_google_vision(image_base64):
    """Google Cloud Vision API"""
    
    url = "https://vision.googleapis.com/v1/images:annotate"
    
    payload = {
        "requests": [
            {
                "image": {
                    "content": image_base64
                },
                "features": [
                    {"type": "LANDMARK_DETECTION", "maxResults": 5},
                    {"type": "LABEL_DETECTION", "maxResults": 10},
                    {"type": "TEXT_DETECTION", "maxResults": 5}
                ]
            }
        ]
    }
    
    params = {"key": GOOGLE_API_KEY}
    
    try:
        response = requests.post(url, json=payload, params=params, timeout=30)
        data = response.json()
        
        if 'responses' not in data or len(data['responses']) == 0:
            return None
        
        result = data['responses'][0]
        
        landmark_name = None
        prefecture = None
        city = None
        confidence = 0.0
        
        if 'landmarkAnnotations' in result and len(result['landmarkAnnotations']) > 0:
            landmark = result['landmarkAnnotations'][0]
            landmark_name = landmark.get('description', '')
            confidence = landmark.get('score', 0.0)
        
        location_type = None
        features = []
        
        if 'labelAnnotations' in result:
            labels = [label['description'] for label in result['labelAnnotations'][:5]]
            features = labels
            
            type_keywords = {
                '': ['shrine', 'temple', '', ''],
                '': ['castle', ''],
                '': ['station', 'railway', ''],
                '': ['bridge', ''],
                '': ['park', ''],
                '': ['building', 'architecture']
            }
            
            for jp_type, keywords in type_keywords.items():
                for label in labels:
                    if any(kw in label.lower() for kw in keywords):
                        location_type = jp_type
                        break
                if location_type:
                    break
        
        analysis = {
            "landmark_name": landmark_name or "",
            "location_type": location_type or "",
            "prefecture": prefecture or "",
            "city": city or "",
            "features": features,
            "description": f"{landmark_name}" if landmark_name else "",
            "confidence": confidence
        }
        
        return analysis
        
    except Exception as e:
        print(f"Google Vision API : {e}")
        return None


@app.route('/api/identify-location', methods=['POST'])
def identify_location():
    """Google Vision API"""
    try:
        image_data = request.json.get('image')
        
        if not image_data:
            return jsonify({'error': ''}), 400
        
        print(" Google Vision API...")
        
        analysis = analyze_image_with_google_vision(image_data)
        
        if not analysis:
            return jsonify({'error': ''}), 500
        
        print(f" : {analysis.get('landmark_name', '')}")
        
        conn = get_db_connection()
        candidates = []
        
        if analysis.get('landmark_name') and analysis['landmark_name'] != '':
            spots = conn.execute(
                'SELECT * FROM spots WHERE name LIKE ? OR note LIKE ? OR address LIKE ?',
                [f"%{analysis['landmark_name']}%", 
                 f"%{analysis['landmark_name']}%",
                 f"%{analysis['landmark_name']}%"]
            ).fetchall()
            candidates.extend([dict(row) for row in spots])
        
        if not candidates and analysis.get('features'):
            for feature in analysis['features'][:3]:
                spots = conn.execute(
                    'SELECT * FROM spots WHERE name LIKE ? OR note LIKE ?',
                    [f"%{feature}%", f"%{feature}%"]
                ).fetchall()
                candidates.extend([dict(row) for row in spots])
        
        conn.close()
        
        seen = set()
        unique_candidates = []
        for spot in candidates:
            if spot['id'] not in seen:
                seen.add(spot['id'])
                unique_candidates.append(spot)
        
        print(f" : {len(unique_candidates)}")
        
        return jsonify({
            'success': True,
            'analysis': analysis,
            'candidates': unique_candidates[:10]
        })
        
    except Exception as e:
        print(f"  : {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/search-image-by-keyword', methods=['POST'])
def search_image_by_keyword():
    """GoogleGoogle Vision API"""
    try:
        keyword = request.json.get('keyword')
        
        if not keyword:
            return jsonify({'error': ''}), 400
        
        print(f" : {keyword}")
        
        search_url = "https://www.googleapis.com/customsearch/v1"
        params = {
            'key': GOOGLE_SEARCH_API_KEY,
            'cx': GOOGLE_SEARCH_ENGINE_ID,
            'q': keyword,
            'searchType': 'image',
            'num': 3,
            'imgSize': 'large'
        }
        
        response = requests.get(search_url, params=params)
        search_results = response.json()
        
        if 'items' not in search_results:
            return jsonify({'error': ''}), 404
        
        image_urls = [item['link'] for item in search_results['items']]
        
        print(f" : {len(image_urls)}")
        
        img_response = requests.get(image_urls[0], timeout=10)
        img = Image.open(BytesIO(img_response.content))
        
        img.thumbnail((1024, 1024))
        
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        
        buffered = BytesIO()
        img.save(buffered, format="JPEG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        print("AI分析開始（Google Vision API）...")
        
        analysis = analyze_image_with_google_vision(img_base64)
        
        if not analysis:
            return jsonify({'error': ''}), 500
        
        print(f" : {analysis.get('landmark_name', '')}")
        
        conn = get_db_connection()
        candidates = []
        
        if analysis.get('landmark_name') and analysis['landmark_name'] != '':
            spots = conn.execute(
                'SELECT * FROM spots WHERE name LIKE ? OR note LIKE ? OR address LIKE ?',
                [f"%{analysis['landmark_name']}%", 
                 f"%{analysis['landmark_name']}%",
                 f"%{analysis['landmark_name']}%"]
            ).fetchall()
            candidates.extend([dict(row) for row in spots])
        
        if not candidates:
            spots = conn.execute(
                'SELECT * FROM spots WHERE name LIKE ? OR address LIKE ?',
                [f"%{keyword}%", f"%{keyword}%"]
            ).fetchall()
            candidates.extend([dict(row) for row in spots])
        
        conn.close()
        
        seen = set()
        unique_candidates = []
        for spot in candidates:
            if spot['id'] not in seen:
                seen.add(spot['id'])
                unique_candidates.append(spot)
        
        print(f" : {len(unique_candidates)}")
        
        return jsonify({
            'success': True,
            'keyword': keyword,
            'image_url': image_urls[0],
            'analysis': analysis,
            'candidates': unique_candidates[:10]
        })
        
    except Exception as e:
        print(f"  : {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ========================================
# 
# ========================================

print("=" * 50)
print("   - ")
print("=" * 50)
print(" :")
print("  - ")
print("  - AI")
print("  - ")
print("  - ")
print("  - ")
print("  ")
print(" :")
print("  -  → Google Vision API")
print("  -  → Google → Google Vision API")
import os

print("=" * 50)
print(" : http://127.0.0.1:8080")
print("=" * 50)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(debug=False, port=port, host='0.0.0.0')