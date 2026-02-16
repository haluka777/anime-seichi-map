from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
from groq import Groq
import json
import re
import requests
import os
from math import radians, sin, cos, sqrt, atan2
import base64
from io import BytesIO
from PIL import Image


app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# API（環境変数から取得）
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

MODEL_NAME = "llama-3.3-70b-versatile"

# Google Maps API 
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

# Google Custom Search API 
GOOGLE_SEARCH_API_KEY = os.environ.get("GOOGLE_SEARCH_API_KEY")
GOOGLE_SEARCH_ENGINE_ID = os.environ.get("GOOGLE_SEARCH_ENGINE_ID")


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
    # anime_urlを含めてJOIN
    spots = conn.execute('''
        SELECT s.*, a.anime_url 
        FROM spots s 
        LEFT JOIN anime a ON s.anime_name = a.anime
    ''').fetchall()
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
        
        # 言語コードと言語名のマッピング（8言語対応）
        language_config = {
            'en': {'name': 'English', 'instruction': 'Translate the following Japanese text to English. Output ONLY the translation, nothing else.'},
            'zh': {'name': '简体中文', 'instruction': '请将以下日语文本翻译成简体中文。只输出翻译结果，不要添加任何解释。'},
            'ko': {'name': '한국어', 'instruction': '다음 일본어 텍스트를 한국어로 번역해주세요. 번역 결과만 출력하고 다른 설명은 추가하지 마세요.'},
            'ja': {'name': '日本語', 'instruction': '以下のテキストを日本語に翻訳してください。翻訳結果のみを出力してください。'},
            'hi': {'name': 'हिन्दी', 'instruction': 'निम्नलिखित जापानी पाठ का हिंदी में अनुवाद करें। केवल अनुवाद ही आउटपुट करें, कुछ और नहीं।'},
            'es': {'name': 'Español', 'instruction': 'Traduce el siguiente texto japonés al español. Muestra SOLO la traducción, nada más.'},
            'fr': {'name': 'Français', 'instruction': 'Traduisez le texte japonais suivant en français. Affichez UNIQUEMENT la traduction, rien d\'autre.'},
            'pt': {'name': 'Português', 'instruction': 'Traduza o seguinte texto japonês para português. Mostre APENAS a tradução, nada mais.'}
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

@app.route('/api/genres')
def get_genres():
    """ジャンル一覧を取得"""
    try:
        conn = get_db_connection()
        genres = conn.execute('SELECT * FROM genre ORDER BY id').fetchall()
        conn.close()
        return jsonify([{'id': g['id'], 'name': g['name']} for g in genres])
    except Exception as e:
        print(f"ジャンル取得エラー: {str(e)}")
        return jsonify([])

@app.route('/api/ai-search', methods=['POST'])
def ai_search():
    """AI聖地検索（会話継続対応）"""
    try:
        data = request.json
        user_question = data.get('question', '')
        language = data.get('language', 'ja')
        history = data.get('history', [])
        last_context = data.get('lastContext', None)
        
        if not user_question:
            return jsonify({'error': '質問を入力してください'}), 400
        
        print(f"\n=== AI検索 ===")
        print(f"質問: {user_question}")
        print(f"前回コンテキスト: {last_context}")
        
        # ========================================
        # 1. 継続会話・フィルタの判定（多言語対応）
        # ========================================
        continuation_words = [
            # 日本語
            'もっと', '他に', '続き', 'もう少し', '別の', 'さらに', '次は', '他は',
            # 英語
            'more', 'other', 'another', 'next', 'continue', 'else',
            # 韓国語
            '더', '다른', '계속', '다음',
            # 中国語
            '更多', '其他', '继续', '下一个',
            # タイ語
            'เพิ่มเติม', 'อื่น',
            # ベトナム語
            'thêm', 'khác',
            # インドネシア語
            'lagi', 'lainnya',
        ]
        
        filter_words = [
            # 日本語
            'だけ', 'のみ', '絞', '限定',
            # 英語
            'only', 'filter', 'just',
            # 韓国語
            '만', '필터',
            # 中国語
            '只', '仅', '筛选',
            # タイ語
            'เท่านั้น',
            # ベトナム語
            'chỉ',
            # インドネシア語
            'saja', 'hanya',
        ]
        
        place_filters = ['神社', '寺', '駅', '学校', '公園', '海', '橋', '店', 'カフェ']
        
        question_lower = user_question.lower()
        is_continuation = any(word in user_question or word.lower() in question_lower for word in continuation_words)
        is_filter = any(word in user_question or word.lower() in question_lower for word in filter_words)
        filter_keyword = None
        
        # フィルタキーワードを抽出（日本語のみ、後で多言語対応）
        for pf in place_filters:
            if pf in user_question:
                filter_keyword = pf
                break
        
        print(f"継続: {is_continuation}, フィルタ: {is_filter}, フィルタKW: {filter_keyword}")
        
        # ========================================
        # 2. 検索条件を決定
        # ========================================
        if (is_continuation or is_filter) and last_context:
            # 継続またはフィルタの場合：前回のコンテキストを使用
            print("→ 継続/フィルタモード")
            locations = last_context.get('locations', [])
            animes = last_context.get('animes', [])
            
            if is_filter:
                # フィルタの場合：表示済みをリセット
                shown_ids = []
            else:
                # 継続の場合：表示済みを引き継ぐ
                shown_ids = last_context.get('shown_ids', [])
        else:
            # 新規検索の場合：質問から抽出
            print("→ 新規検索モード")
            locations = []
            animes = []
            shown_ids = []
            filter_keyword = None  # 新規検索ではフィルタなし
            
            # ========================================
            # 多言語対応：都道府県マップ（8言語）
            # ========================================
            prefecture_map = {
                # 日本語
                '北海道': '北海道', '青森': '青森県', '岩手': '岩手県', '宮城': '宮城県', 
                '秋田': '秋田県', '山形': '山形県', '福島': '福島県', '茨城': '茨城県', 
                '栃木': '栃木県', '群馬': '群馬県', '埼玉': '埼玉県', '千葉': '千葉県', 
                '神奈川': '神奈川県', '新潟': '新潟県', '富山': '富山県', '石川': '石川県', 
                '福井': '福井県', '山梨': '山梨県', '長野': '長野県', '岐阜': '岐阜県', 
                '静岡': '静岡県', '愛知': '愛知県', '三重': '三重県', '滋賀': '滋賀県', 
                '奈良': '奈良県', '和歌山': '和歌山県', '鳥取': '鳥取県', '島根': '島根県', 
                '岡山': '岡山県', '広島': '広島県', '山口': '山口県', '徳島': '徳島県', 
                '香川': '香川県', '愛媛': '愛媛県', '高知': '高知県', '佐賀': '佐賀県', 
                '長崎': '長崎県', '熊本': '熊本県', '大分': '大分県', '宮崎': '宮崎県', 
                '鹿児島': '鹿児島県', '沖縄': '沖縄県',
                '東京': '東京都', '京都': '京都府', '大阪': '大阪府', '兵庫': '兵庫県', '福岡': '福岡県',
                
                # 英語 (English)
                'hokkaido': '北海道', 'aomori': '青森県', 'iwate': '岩手県', 'miyagi': '宮城県',
                'akita': '秋田県', 'yamagata': '山形県', 'fukushima': '福島県', 'ibaraki': '茨城県',
                'tochigi': '栃木県', 'gunma': '群馬県', 'saitama': '埼玉県', 'chiba': '千葉県',
                'kanagawa': '神奈川県', 'niigata': '新潟県', 'toyama': '富山県', 'ishikawa': '石川県',
                'fukui': '福井県', 'yamanashi': '山梨県', 'nagano': '長野県', 'gifu': '岐阜県',
                'shizuoka': '静岡県', 'aichi': '愛知県', 'mie': '三重県', 'shiga': '滋賀県',
                'nara': '奈良県', 'wakayama': '和歌山県', 'tottori': '鳥取県', 'shimane': '島根県',
                'okayama': '岡山県', 'hiroshima': '広島県', 'yamaguchi': '山口県', 'tokushima': '徳島県',
                'kagawa': '香川県', 'ehime': '愛媛県', 'kochi': '高知県', 'saga': '佐賀県',
                'nagasaki': '長崎県', 'kumamoto': '熊本県', 'oita': '大分県', 'miyazaki': '宮崎県',
                'kagoshima': '鹿児島県', 'okinawa': '沖縄県',
                'tokyo': '東京都', 'kyoto': '京都府', 'osaka': '大阪府', 'hyogo': '兵庫県', 'fukuoka': '福岡県',
                
                # 韓国語 (한국어)
                '홋카이도': '北海道', '아오모리': '青森県', '이와테': '岩手県', '미야기': '宮城県',
                '아키타': '秋田県', '야마가타': '山形県', '후쿠시마': '福島県', '이바라키': '茨城県',
                '도치기': '栃木県', '군마': '群馬県', '사이타마': '埼玉県', '지바': '千葉県',
                '가나가와': '神奈川県', '니가타': '新潟県', '도야마': '富山県', '이시카와': '石川県',
                '후쿠이': '福井県', '야마나시': '山梨県', '나가노': '長野県', '기후': '岐阜県',
                '시즈오카': '静岡県', '아이치': '愛知県', '미에': '三重県', '시가': '滋賀県',
                '나라': '奈良県', '와카야마': '和歌山県', '돗토리': '鳥取県', '시마네': '島根県',
                '오카야마': '岡山県', '히로시마': '広島県', '야마구치': '山口県', '도쿠시마': '徳島県',
                '가가와': '香川県', '에히메': '愛媛県', '고치': '高知県', '사가': '佐賀県',
                '나가사키': '長崎県', '구마모토': '熊本県', '오이타': '大分県', '미야자키': '宮崎県',
                '가고시마': '鹿児島県', '오키나와': '沖縄県',
                '도쿄': '東京都', '교토': '京都府', '오사카': '大阪府', '효고': '兵庫県', '후쿠오카': '福岡県',
                
                # 中国語簡体字 (简体中文)
                '东京': '東京都', '京都': '京都府', '大阪': '大阪府',
                '广岛': '広島県', '冲绳': '沖縄県', '奈良': '奈良県',
                
                # 中国語繁体字 (繁體中文)
                '廣島': '広島県', '沖繩': '沖縄県',
                
                # ヒンディー語 (हिन्दी)
                'क्योटो': '京都府', 'टोक्यो': '東京都', 'ओसाका': '大阪府',
                'हिरोशिमा': '広島県', 'ओकिनावा': '沖縄県', 'नारा': '奈良県',
                'होक्काइदो': '北海道', 'क्यूशू': '福岡県',
                
                # スペイン語 (Español) - Kioto, Tokio等のスペイン語表記
                'kioto': '京都府', 'tokio': '東京都', 'osaka': '大阪府',
                'hiroshima': '広島県', 'okinawa': '沖縄県', 'nara': '奈良県',
                
                # フランス語 (Français) - 英語と同様だがアクセント付きも対応
                'kyôto': '京都府', 'tôkyô': '東京都',
                
                # ポルトガル語 (Português) - スペイン語と類似
                'quioto': '京都府', 'tóquio': '東京都',
            }
            
            # 小文字でも検索できるように
            question_lower = user_question.lower()
            
            for short_name, full_name in prefecture_map.items():
                # 日本語はそのまま、英語等は小文字で比較
                if short_name in user_question or short_name.lower() in question_lower:
                    locations.append(full_name)
                    break  # 最初に見つかったものだけ
            
            # アニメ名を抽出（DBから検索）
            conn = get_db_connection()
            anime_names = conn.execute('SELECT DISTINCT anime_name FROM spots').fetchall()
            for row in anime_names:
                anime_name = row['anime_name']
                if anime_name and anime_name in user_question:
                    animes.append(anime_name)
            conn.close()
        
        # ========================================
        # 多言語フィルタキーワード対応（8言語）
        # ========================================
        multilang_filters = {
            # 神社・寺
            '神社': '神社', 'shrine': '神社', '신사': '神社', 'ศาลเจ้า': '神社', 
            'kuil': '神社', 'đền': '神社', 'santuario': '神社', 'sanctuaire': '神社',
            'मंदिर': '神社', 'templo': '神社',
            '寺': '寺', 'temple': '寺', '절': '寺', 'วัด': '寺', 'chùa': '寺',
            
            # 駅
            '駅': '駅', 'station': '駅', '역': '駅', 'สถานี': '駅', 
            'stasiun': '駅', 'ga': '駅', '车站': '駅', '車站': '駅',
            'estación': '駅', 'estação': '駅', 'gare': '駅', 'स्टेशन': '駅',
            
            # 学校
            '学校': '学校', 'school': '学校', '학교': '学校', 'โรงเรียน': '学校',
            'sekolah': '学校', 'trường': '学校', 'escuela': '学校', 'escola': '学校',
            'école': '学校', 'स्कूल': '学校',
            
            # 公園
            '公園': '公園', 'park': '公園', '공원': '公園', 'สวน': '公園',
            'taman': '公園', 'công viên': '公園', '公园': '公園',
            'parque': '公園', 'parc': '公園', 'पार्क': '公園',
            
            # 海
            '海': '海', 'sea': '海', 'beach': '海', '바다': '海', 'ทะเล': '海',
            'laut': '海', 'pantai': '海', 'biển': '海', 'mar': '海', 'playa': '海',
            'plage': '海', 'mer': '海', 'समुद्र': '海', 'praia': '海',
            
            # 橋
            '橋': '橋', 'bridge': '橋', '다리': '橋', 'สะพาน': '橋',
            'jembatan': '橋', 'cầu': '橋', '桥': '橋', 'puente': '橋',
            'pont': '橋', 'ponte': '橋', 'पुल': '橋',
            
            # カフェ・店
            'カフェ': 'カフェ', 'cafe': 'カフェ', 'coffee': 'カフェ', '카페': 'カフェ',
            'café': 'カフェ', 'कैफ़े': 'カフェ',
            '店': '店', 'shop': '店', 'store': '店', '가게': '店',
            'tienda': '店', 'loja': '店', 'boutique': '店', 'magasin': '店', 'दुकान': '店',
            
            # アニメ（キーワードとして認識）
            'anime': None, 'アニメ': None, '애니메이션': None, '动漫': None,
            'エनीमे': None, 'animé': None,
        }
        
        # フィルタキーワードを多言語で検出
        if filter_keyword is None:
            for keyword, ja_keyword in multilang_filters.items():
                if keyword in user_question or keyword.lower() in question_lower:
                    filter_keyword = ja_keyword
                    print(f"多言語フィルタ検出: {keyword} → {ja_keyword}")
                    break
        
        print(f"検索条件 - 場所: {locations}, アニメ: {animes}, フィルタ: {filter_keyword}, 除外ID: {len(shown_ids)}件")
        
        # ========================================
        # 3. DBから聖地を検索（anime_url含む）
        # ========================================
        conn = get_db_connection()
        spots_data = []
        
        # ========================================
        # ジャンル検索（多言語対応）- DBのジャンル: 戦闘, ラブコメ, 日常, SF, ファンタジー, スポーツ, 音楽, 青春, ホラー
        # ========================================
        genre_map = {
            # 日本語（DBと完全一致）
            '青春': '青春', '戦闘': '戦闘', 'ラブコメ': 'ラブコメ', '日常': '日常',
            'SF': 'SF', 'ファンタジー': 'ファンタジー', 'スポーツ': 'スポーツ',
            '音楽': '音楽', 'ホラー': 'ホラー',
            # 日本語（別表現）
            'アクション': '戦闘', 'バトル': '戦闘', '恋愛': 'ラブコメ', 'ロマンス': 'ラブコメ',
            'コメディ': 'ラブコメ', '学園': '青春', '部活': '青春',
            # 英語
            'youth': '青春', 'school': '青春', 'romance': 'ラブコメ', 'romcom': 'ラブコメ',
            'love': 'ラブコメ', 'comedy': 'ラブコメ', 'action': '戦闘', 'battle': '戦闘',
            'fantasy': 'ファンタジー', 'sci-fi': 'SF', 'science fiction': 'SF',
            'slice of life': '日常', 'daily': '日常', 'everyday': '日常',
            'sports': 'スポーツ', 'music': '音楽', 'horror': 'ホラー',
            # 韓国語
            '청춘': '青春', '학원': '青春', '로맨스': 'ラブコメ', '코미디': 'ラブコメ',
            '액션': '戦闘', '판타지': 'ファンタジー', '일상': '日常', '스포츠': 'スポーツ',
            '음악': '音楽', '호러': 'ホラー',
            # 中国語
            '青春': '青春', '校园': '青春', '恋爱': 'ラブコメ', '喜剧': 'ラブコメ',
            '动作': '戦闘', '战斗': '戦闘', '奇幻': 'ファンタジー', '科幻': 'SF',
            '日常': '日常', '运动': 'スポーツ', '音乐': '音楽', '恐怖': 'ホラー',
            # スペイン語
            'juventud': '青春', 'romántico': 'ラブコメ', 'comedia': 'ラブコメ',
            'acción': '戦闘', 'fantasía': 'ファンタジー', 'deportes': 'スポーツ',
            # フランス語
            'jeunesse': '青春', 'romantique': 'ラブコメ', 'comédie': 'ラブコメ',
            'fantaisie': 'ファンタジー', 'horreur': 'ホラー',
            # ポルトガル語
            'juventude': '青春', 'romance': 'ラブコメ', 'comédia': 'ラブコメ',
            'ação': '戦闘', 'fantasia': 'ファンタジー', 'esportes': 'スポーツ',
            # ヒンディー語
            'युवा': '青春', 'रोमांस': 'ラブコメ', 'एक्शन': '戦闘',
        }
        
        detected_genre = None
        for genre_keyword, ja_genre in genre_map.items():
            if genre_keyword in user_question or genre_keyword.lower() in question_lower:
                detected_genre = ja_genre
                print(f"ジャンル検出: {genre_keyword} → {ja_genre}")
                break
        
        # ジャンルで検索
        if detected_genre:
            results = conn.execute('''
                SELECT DISTINCT s.*, a.anime_url 
                FROM spots s 
                LEFT JOIN anime a ON s.anime_name = a.anime
                JOIN anime_genre ag ON a.id = ag.anime_id
                JOIN genre g ON g.id = ag.genre_id
                WHERE g.name = ?
                ORDER BY RANDOM()
                LIMIT 30
            ''', [detected_genre]).fetchall()
            spots_data.extend([dict(row) for row in results])
            print(f"ジャンル「{detected_genre}」で{len(results)}件見つかりました")
        
        if animes:
            for anime in animes:
                results = conn.execute('''
                    SELECT s.*, a.anime_url 
                    FROM spots s 
                    LEFT JOIN anime a ON s.anime_name = a.anime
                    WHERE s.anime_name = ?
                ''', [anime]).fetchall()
                spots_data.extend([dict(row) for row in results])
        
        if locations:
            for loc in locations:
                results = conn.execute('''
                    SELECT s.*, a.anime_url 
                    FROM spots s 
                    LEFT JOIN anime a ON s.anime_name = a.anime
                    WHERE s.address LIKE ?
                ''', [f'%{loc}%']).fetchall()
                spots_data.extend([dict(row) for row in results])
        
        # 結果がなければ全体から検索
        if not spots_data:
            keywords = user_question.replace('の', ' ').replace('を', ' ').replace('教えて', '').split()
            for kw in keywords[:3]:
                if len(kw) >= 2:
                    results = conn.execute('''
                        SELECT s.*, a.anime_url 
                        FROM spots s 
                        LEFT JOIN anime a ON s.anime_name = a.anime
                        WHERE s.anime_name LIKE ? OR s.address LIKE ? OR s.name LIKE ?
                        LIMIT 20
                    ''', [f'%{kw}%', f'%{kw}%', f'%{kw}%']).fetchall()
                    spots_data.extend([dict(row) for row in results])
        
        conn.close()
        
        # 重複を除去
        seen = set()
        unique_spots = []
        for s in spots_data:
            if s['id'] not in seen:
                seen.add(s['id'])
                unique_spots.append(s)
        spots_data = unique_spots
        
        print(f"検索結果（フィルタ前）: {len(spots_data)}件")
        
        # ========================================
        # フィルタを適用（神社だけ、駅だけなど）
        # ========================================
        if filter_keyword:
            filtered_spots = []
            for spot in spots_data:
                spot_name = spot.get('name', '')
                spot_note = spot.get('note', '') or ''
                if filter_keyword in spot_name or filter_keyword in spot_note:
                    filtered_spots.append(spot)
            
            print(f"フィルタ後（{filter_keyword}）: {len(filtered_spots)}件")
            
            if filtered_spots:
                spots_data = filtered_spots
            else:
                # フィルタで0件の場合、メッセージを返す
                return jsonify({
                    'answer': f'「{filter_keyword}」に該当する聖地は見つかりませんでした。別の条件で検索してみてください！',
                    'related_spots': [],
                    'language': language,
                    'context': last_context
                })
        
        # ========================================
        # 4. 表示済みを除外して5件取得
        # ========================================
        available_spots = [s for s in spots_data if s['id'] not in shown_ids]
        display_spots = available_spots[:5]
        
        print(f"表示可能: {len(available_spots)}件, 今回表示: {len(display_spots)}件")
        
        if not display_spots:
            return jsonify({
                'answer': f'これ以上の聖地は見つかりませんでした。全{len(shown_ids)}件をご紹介しました！',
                'related_spots': [],
                'language': language,
                'context': None
            })
        
        # ========================================
        # 5. AIで回答を生成（DBのデータのみ使用）
        # ========================================
        lang_instructions = {
            'ja': '日本語で回答してください。',
            'en': 'Please answer in English.',
            'zh': '请用简体中文回答。',
            'ko': '한국어로 답변해 주세요.',
            'hi': 'कृपया हिंदी में उत्तर दें।',
            'es': 'Por favor responde en español.',
            'fr': 'Veuillez répondre en français.',
            'pt': 'Por favor, responda em português.'
        }
        lang_instruction = lang_instructions.get(language, 'Please answer in English.')
        
        # 【登場シーン】【見どころ】のラベルを多言語対応
        scene_labels = {
            'ja': ('登場シーン', '見どころ'),
            'en': ('Scene', 'Highlights'),
            'zh': ('登场场景', '看点'),
            'ko': ('등장 장면', '볼거리'),
            'hi': ('दृश्य', 'मुख्य आकर्षण'),
            'es': ('Escena', 'Destacados'),
            'fr': ('Scène', 'Points forts'),
            'pt': ('Cena', 'Destaques')
        }
        scene_label, highlight_label = scene_labels.get(language, ('Scene', 'Highlights'))
        
        # DBのデータをそのまま使う
        spots_info = []
        for spot in display_spots:
            spots_info.append({
                'anime': spot['anime_name'],
                'name': spot['name'],
                'address': spot['address'],
                'note': spot.get('note', '')[:100] if spot.get('note') else ''
            })
        
        continuation_msg = ""
        if is_continuation:
            continuation_msg = f"\n[This is a continuation - showing results {len(shown_ids)+1} to {len(shown_ids)+len(display_spots)}]"
        
        # 日本語以外の場合、英語タイトル併記を指示
        title_instruction = ""
        if language != 'ja':
            title_instruction = """
[About Anime Titles]
After the Japanese anime title, please add the English title in parentheses.
Example: **『五等分の花嫁』(The Quintessential Quintuplets)**
Example: **『君の名は。』(Your Name)**
Example: **『鬼滅の刃』(Demon Slayer)**
"""
        
        answer_prompt = f"""You are an expert guide for anime pilgrimage sites (seichi).
{lang_instruction}
{continuation_msg}
{title_instruction}

[IMPORTANT] Use the following database data to provide detailed information.

Pilgrimage site data:
{json.dumps(spots_info, ensure_ascii=False, indent=2)}

Format (must follow):
**『Anime Name』{' (English Title)' if language != 'ja' else ''}**(Year・Genre)
Brief synopsis of the anime in one sentence.

📍 Location Name
【{scene_label}】Which episode and what scene it appears in
【{highlight_label}】Points of interest when visiting

Rules:
1. Describe each location in 3-4 sentences
2. Include basic anime info (broadcast year, genre)
3. Explain the specific scene appearance
4. Share pilgrimage highlights and tips
5. Do not add locations not in the database
6. Do not include addresses (location name only)
7. Do not use excessive symbols or decorations

Please introduce the above {len(display_spots)} locations."""

        answer_response = client.chat.completions.create(
            messages=[{"role": "user", "content": answer_prompt}],
            model=MODEL_NAME,
            temperature=0.4,
            max_tokens=2000,
        )
        
        ai_answer = answer_response.choices[0].message.content
        ai_answer = re.sub(r'\[IDS:.*?\]', '', ai_answer).strip()
        
        # ========================================
        # 6. コンテキストを更新して返す
        # ========================================
        new_shown_ids = shown_ids + [s['id'] for s in display_spots]
        
        context = {
            'locations': locations,
            'animes': animes,
            'shown_ids': new_shown_ids,
            'total': len(spots_data)
        }
        
        remaining = len(available_spots) - len(display_spots)
        if remaining > 0:
            # 多言語対応の「もっと教えて」メッセージ（8言語）
            more_messages = {
                'ja': f'💡 まだ{remaining}件あります。「もっと教えて」で続きを見れます！',
                'en': f'💡 {remaining} more spots available. Say "show me more" to see more!',
                'zh': f'💡 还有{remaining}个景点。输入"更多"查看更多！',
                'ko': f'💡 {remaining}개 더 있습니다. "더 보여줘"라고 말해보세요!',
                'hi': f'💡 {remaining} और स्थान उपलब्ध हैं। "और दिखाओ" कहें!',
                'es': f'💡 Hay {remaining} lugares más. ¡Di "muéstrame más" para ver más!',
                'fr': f'💡 {remaining} autres lieux disponibles. Dites "montre-moi plus" pour en voir plus!',
                'pt': f'💡 Mais {remaining} locais disponíveis. Diga "mostre mais" para ver mais!'
            }
            more_msg = more_messages.get(language, more_messages['en'])
            ai_answer += f"\n\n{more_msg}"
        
        return jsonify({
            'answer': ai_answer,
            'related_spots': display_spots,
            'language': language,
            'context': context
        })
        
    except Exception as e:
        print(f"AI検索エラー: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'エラー: {str(e)}'}), 500

@app.route('/api/ai-recommend', methods=['POST'])
def ai_recommend():
    """AIおすすめ - ジャンルランキング形式"""
    try:
        data = request.json
        history = data.get('history', [])
        viewed_animes = data.get('viewed_animes', [])
        language = data.get('language', 'ja')
        
        if not history:
            return jsonify({'error': '閲覧履歴がありません'}), 400
        
        print(f"\n閲覧済みアニメ: {viewed_animes}")
        
        conn = get_db_connection()
        
        # ========================================
        # 1. 閲覧済みアニメのジャンルを集計（カウント）
        # ========================================
        genre_count = {}
        for anime_name in viewed_animes:
            genre_query = conn.execute('''
                SELECT g.name 
                FROM genre g
                JOIN anime_genre ag ON g.id = ag.genre_id
                JOIN anime a ON a.id = ag.anime_id
                WHERE a.anime = ?
            ''', [anime_name]).fetchall()
            for row in genre_query:
                genre_name = row['name']
                genre_count[genre_name] = genre_count.get(genre_name, 0) + 1
        
        # ジャンルを出現回数順にソート
        sorted_genres = sorted(genre_count.items(), key=lambda x: x[1], reverse=True)
        print(f"ジャンル集計: {sorted_genres}")
        
        if not sorted_genres:
            conn.close()
            return jsonify({'error': 'ジャンル情報が見つかりません', 'language': language}), 400
        
        # ========================================
        # 2. 各ジャンルごとにおすすめアニメを取得
        # ========================================
        recommendations = []
        
        for rank, (genre_name, count) in enumerate(sorted_genres[:3], 1):
            # 星の数を決定（1位=5つ星、2位=4つ星、3位=3つ星）
            stars = 6 - rank
            
            # このジャンルの未視聴アニメを取得
            viewed_placeholders = ','.join(['?' for _ in viewed_animes])
            recommend_query = f'''
                SELECT DISTINCT a.anime as anime_name
                FROM anime a
                JOIN anime_genre ag ON a.id = ag.anime_id
                JOIN genre g ON g.id = ag.genre_id
                WHERE g.name = ?
                AND a.anime NOT IN ({viewed_placeholders})
                ORDER BY RANDOM()
                LIMIT 5
            '''
            params = [genre_name] + viewed_animes
            recommend_animes = conn.execute(recommend_query, params).fetchall()
            
            # 各アニメの聖地情報を取得
            anime_spots = []
            for anime_row in recommend_animes:
                anime_name = anime_row['anime_name']
                spot = conn.execute(
                    'SELECT * FROM spots WHERE anime_name = ? ORDER BY RANDOM() LIMIT 1', 
                    [anime_name]
                ).fetchone()
                if spot:
                    anime_spots.append({
                        'anime_name': anime_name,
                        'spot': dict(spot)
                    })
            
            recommendations.append({
                'rank': rank,
                'genre': genre_name,
                'count': count,
                'stars': stars,
                'animes': anime_spots
            })
        
        conn.close()
        
        print(f"おすすめ結果: {len(recommendations)}ジャンル")
        
        # ========================================
        # 3. レスポンスを構築
        # ========================================
        return jsonify({
            'success': True,
            'genre_ranking': sorted_genres[:5],
            'recommendations': recommendations,
            'total_viewed': len(viewed_animes),
            'language': language
        })
        
    except Exception as e:
        print(f"AIおすすめエラー: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'エラー: {str(e)}'}), 500
        
    except Exception as e:
        print(f"AIおすすめエラー: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'エラー: {str(e)}'}), 500


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