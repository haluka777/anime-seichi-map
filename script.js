// ========================================
// グローバル変数（最初に定義）
// ========================================

// URLパラメータから言語を取得
const urlParams = new URLSearchParams(window.location.search);
let currentLanguage = urlParams.get('lang') || 'ja';  // 翻訳機能用

let allSpots = [];  
let map;
let spots = [];
let markers = [];
let currentFilter = 'all';
let currentSearch = '';
let currentCategory = 'all';  // カテゴリフィルタ用
let currentAnimeTab = 'all';  // あいうえおタブ用
let currentGenreFilter = null;  // ジャンルフィルタ用
let allGenres = [];  // ジャンル一覧
let genreSpotIds = [];  // 選択中ジャンルの聖地ID一覧
let hamburgerMenuOpen = false;
let sidebarOpen = false;
let aiPanelOpen = false;
let historySidebarOpen = false;
let recommendSidebarOpen = false;
let viewHistory = [];
let isSearching = false;
let searchTimeout = null;
let currentLocationMarker = null; 
let markerClustererInstance = null;
let selectedSpotIds = [];
let filteredSpots = [];

// ========================================
// AIチャット会話履歴（継続会話用）
// ========================================
let chatHistory = [];  // {role: 'user'|'assistant', content: string}
let lastSearchContext = null;  // 直前の検索コンテキスト（場所、アニメ名など）

// カテゴリ判定用のキーワードマップ
const categoryKeywords = {
    shrine: ['神社', '寺', '稲荷', '大社', '神宮', '観音', '地蔵'],
    station: ['駅', '鉄道', '線路', 'ホーム', '停留場', '電停'],
    school: ['学校', '高校', '中学', '小学', '大学', '学園', '学院'],
    park: ['公園', 'パーク', '広場', '緑地'],
    sea: ['海岸', '海', '川', '港', '浜', '湖', '池', '滝', '渓谷'],
    bridge: ['橋', 'ブリッジ'],
    shop: ['商店', '店', 'カフェ', '食堂', 'ショップ', '喫茶', 'レストラン', 'モール'],
    tower: ['タワー', '展望', '塔', 'スカイ']
};

// ========================================
// 翻訳機能
// ========================================

// 言語設定を変更する関数
// 言語データ
const languageData = {
    ja: { flag: '🇯🇵', name: '日本語' },
    en: { flag: '🇬🇧', name: 'English' },
    zh: { flag: '🇨🇳', name: '中文' },
    ko: { flag: '🇰🇷', name: '한국어' },
    hi: { flag: '🇮🇳', name: 'हिन्दी' },
    es: { flag: '🇪🇸', name: 'Español' },
    fr: { flag: '🇫🇷', name: 'Français' },
    pt: { flag: '🇧🇷', name: 'Português' }
};

// ========================================
// UI翻訳データ（8言語対応）
// ========================================
const uiTranslations = {
    ja: {
        // ヘッダー・検索
        searchPlaceholder: '聖地を検索...',
        
        // カテゴリフィルタ
        categoryAll: 'すべて',
        categoryShrine: '神社・寺',
        categoryStation: '駅',
        categorySchool: '学校',
        categoryPark: '公園',
        categorySea: '海・川',
        categoryBridge: '橋',
        categoryShop: '店舗',
        categoryTower: 'タワー',
        
        // フィルタ
        allAnime: 'すべてのアニメ',
        spotsCount: '件の聖地',
        
        // AIチャット
        aiChatTitle: 'AI聖地検索',
        aiChatPlaceholder: '例: 京都のアニメ聖地を教えて',
        aiChatSend: '送信',
        aiChatSearching: '検索中...',
        aiSpotsFound: '件の聖地が見つかりました',
        aiShowOnMap: 'すべて地図に表示',
        aiTellMore: 'もっと教えて',
        aiError: 'エラー',
        
        // 詳細パネル
        detailTitle: '聖地詳細',
        detailAnimeName: '作品名',
        detailSpotName: '聖地名',
        detailAddress: '住所',
        detailTranslate: '翻訳',
        detailAddToRoute: 'ルートに追加',
        
        // メニュー
        menuTitle: 'メニュー',
        menuHistory: '閲覧履歴',
        menuRecommend: 'AIおすすめ',
        menuRoute: 'ルートプランナー',
        menuCurrentLocation: '現在地',
        menuSidebar: 'サイドバーを表示',
        
        // AIおすすめ
        recommendTitle: '🌟 AIおすすめ',
        recommendGenreAnalysis: '📊 あなたの好みのジャンル分析',
        recommendViewedWorks: '閲覧した作品',
        recommendWorksUnit: '件',
        recommendRank: '位',
        recommendTimes: '回',
        recommendViewCount: '閲覧回数',
        recommendNoWorks: 'おすすめ作品がありません',
        
        // 注意書き
        noticeTitle: '⚠️ ご利用にあたって',
        noticeData: 'すべてのアニメの聖地を網羅しているわけではありません',
        noticeAi: 'AIには自然な言葉で質問してください（例：「京都のアニメ聖地を教えて」）',
        noticeAccuracy: '聖地情報は変更される場合があります。訪問前にご確認ください',
        noticeTranslation: '翻訳はAIによる自動翻訳です。正確でない場合があります',
        noticePrivate: '聖地には私有地が含まれる場合があります。立入禁止区域には入らないでください',
        noticePhoto: '撮影時は周囲の迷惑にならないようご注意ください',
        noticeManner: '地元の方々への配慮をお願いします',
        
        // その他
        loading: '読み込み中...',
        noResults: '該当する聖地がありません'
    },
    en: {
        searchPlaceholder: 'Search locations...',
        
        categoryAll: 'All',
        categoryShrine: 'Shrine/Temple',
        categoryStation: 'Station',
        categorySchool: 'School',
        categoryPark: 'Park',
        categorySea: 'Sea/River',
        categoryBridge: 'Bridge',
        categoryShop: 'Shop',
        categoryTower: 'Tower',
        
        allAnime: 'All Anime',
        spotsCount: ' locations',
        
        aiChatTitle: 'AI Location Search',
        aiChatPlaceholder: 'e.g. Show me anime locations in Kyoto',
        aiChatSend: 'Send',
        aiChatSearching: 'Searching...',
        aiSpotsFound: ' locations found',
        aiShowOnMap: 'Show all on map',
        aiTellMore: 'Tell me more',
        aiError: 'Error',
        
        detailTitle: 'Location Details',
        detailAnimeName: 'Anime',
        detailSpotName: 'Location',
        detailAddress: 'Address',
        detailTranslate: 'Translate',
        detailAddToRoute: 'Add to Route',
        
        menuTitle: 'Menu',
        menuHistory: 'History',
        menuRecommend: 'AI Recommend',
        menuRoute: 'Route Planner',
        menuCurrentLocation: 'My Location',
        menuSidebar: 'Show Sidebar',
        
        loading: 'Loading...',
        noResults: 'No locations found',
        
        // AIおすすめ
        recommendTitle: '🌟 AI Recommend',
        recommendGenreAnalysis: '📊 Your Genre Analysis',
        recommendViewedWorks: 'Viewed works',
        recommendWorksUnit: '',
        recommendRank: '',
        recommendTimes: ' times',
        recommendViewCount: 'View count',
        recommendNoWorks: 'No recommendations available',
        
        // 注意書き
        noticeTitle: '⚠️ Important Notice',
        noticeData: 'This map does not cover all anime pilgrimage sites',
        noticeAi: 'Ask AI in natural language (e.g. "Show me anime spots in Kyoto")',
        noticeAccuracy: 'Location info may change. Please verify before visiting',
        noticeTranslation: 'Translations are AI-generated and may not be accurate',
        noticePrivate: 'Some locations are private property. Do not enter restricted areas',
        noticePhoto: 'Please be considerate when taking photos',
        noticeManner: 'Please be respectful to local residents'
    },
    zh: {
        searchPlaceholder: '搜索圣地...',
        
        categoryAll: '全部',
        categoryShrine: '神社/寺庙',
        categoryStation: '车站',
        categorySchool: '学校',
        categoryPark: '公园',
        categorySea: '海/河',
        categoryBridge: '桥',
        categoryShop: '商店',
        categoryTower: '塔',
        
        allAnime: '所有动漫',
        spotsCount: '个圣地',
        
        aiChatTitle: 'AI圣地搜索',
        aiChatPlaceholder: '例如: 告诉我京都的动漫圣地',
        aiChatSend: '发送',
        aiChatSearching: '搜索中...',
        aiSpotsFound: '个圣地被找到',
        aiShowOnMap: '在地图上显示全部',
        aiTellMore: '告诉我更多',
        aiError: '错误',
        
        detailTitle: '圣地详情',
        detailAnimeName: '动漫名',
        detailSpotName: '圣地名',
        detailAddress: '地址',
        detailTranslate: '翻译',
        detailAddToRoute: '添加到路线',
        
        menuTitle: '菜单',
        menuHistory: '浏览历史',
        menuRecommend: 'AI推荐',
        menuRoute: '路线规划',
        menuCurrentLocation: '我的位置',
        menuSidebar: '显示侧边栏',
        
        loading: '加载中...',
        noResults: '没有找到圣地',
        
        // AIおすすめ
        recommendTitle: '🌟 AI推荐',
        recommendGenreAnalysis: '📊 你的类型分析',
        recommendViewedWorks: '已浏览作品',
        recommendWorksUnit: '部',
        recommendRank: '位',
        recommendTimes: '次',
        recommendViewCount: '浏览次数',
        recommendNoWorks: '没有推荐作品',
        
        // 注意書き
        noticeTitle: '⚠️ 使用须知',
        noticeData: '本地图并未涵盖所有动漫圣地',
        noticeAi: '请用自然语言向AI提问（例：「告诉我京都的动漫圣地」）',
        noticeAccuracy: '圣地信息可能会变更，请在访问前确认',
        noticeTranslation: '翻译由AI自动生成，可能不够准确',
        noticePrivate: '部分圣地为私有财产，请勿进入禁止区域',
        noticePhoto: '拍照时请注意不要打扰他人',
        noticeManner: '请尊重当地居民'
    },
    ko: {
        searchPlaceholder: '성지 검색...',
        
        categoryAll: '전체',
        categoryShrine: '신사/사찰',
        categoryStation: '역',
        categorySchool: '학교',
        categoryPark: '공원',
        categorySea: '바다/강',
        categoryBridge: '다리',
        categoryShop: '상점',
        categoryTower: '타워',
        
        allAnime: '모든 애니메이션',
        spotsCount: '개의 성지',
        
        aiChatTitle: 'AI 성지 검색',
        aiChatPlaceholder: '예: 교토의 애니메이션 성지를 알려줘',
        aiChatSend: '전송',
        aiChatSearching: '검색 중...',
        aiSpotsFound: '개의 성지를 찾았습니다',
        aiShowOnMap: '지도에 모두 표시',
        aiTellMore: '더 알려줘',
        aiError: '오류',
        
        detailTitle: '성지 상세',
        detailAnimeName: '애니메이션',
        detailSpotName: '성지명',
        detailAddress: '주소',
        detailTranslate: '번역',
        detailAddToRoute: '경로에 추가',
        
        menuTitle: '메뉴',
        menuHistory: '열람 기록',
        menuRecommend: 'AI 추천',
        menuRoute: '경로 플래너',
        menuCurrentLocation: '내 위치',
        menuSidebar: '사이드바 표시',
        
        loading: '로딩 중...',
        noResults: '해당하는 성지가 없습니다',
        
        // AIおすすめ
        recommendTitle: '🌟 AI 추천',
        recommendGenreAnalysis: '📊 당신의 장르 분석',
        recommendViewedWorks: '열람한 작품',
        recommendWorksUnit: '개',
        recommendRank: '위',
        recommendTimes: '회',
        recommendViewCount: '열람 횟수',
        recommendNoWorks: '추천 작품이 없습니다',
        
        // 注意書き
        noticeTitle: '⚠️ 이용 안내',
        noticeData: '모든 애니메이션 성지를 망라하고 있지 않습니다',
        noticeAi: 'AI에게 자연스러운 언어로 질문하세요 (예: 「교토의 애니메이션 성지를 알려줘」)',
        noticeAccuracy: '성지 정보는 변경될 수 있습니다. 방문 전에 확인하세요',
        noticeTranslation: '번역은 AI 자동 번역입니다. 정확하지 않을 수 있습니다',
        noticePrivate: '일부 성지는 사유지입니다. 출입 금지 구역에 들어가지 마세요',
        noticePhoto: '촬영 시 주변에 피해를 주지 않도록 주의하세요',
        noticeManner: '지역 주민들에 대한 배려를 부탁드립니다'
    },
    hi: {
        searchPlaceholder: 'स्थान खोजें...',
        
        categoryAll: 'सभी',
        categoryShrine: 'मंदिर',
        categoryStation: 'स्टेशन',
        categorySchool: 'स्कूल',
        categoryPark: 'पार्क',
        categorySea: 'समुद्र/नदी',
        categoryBridge: 'पुल',
        categoryShop: 'दुकान',
        categoryTower: 'टावर',
        
        allAnime: 'सभी एनीमे',
        spotsCount: ' स्थान',
        
        aiChatTitle: 'AI स्थान खोज',
        aiChatPlaceholder: 'उदाहरण: क्योटो में एनीमे स्थान दिखाओ',
        aiChatSend: 'भेजें',
        aiChatSearching: 'खोज रहा है...',
        aiSpotsFound: ' स्थान मिले',
        aiShowOnMap: 'मानचित्र पर सभी दिखाएं',
        aiTellMore: 'और बताओ',
        aiError: 'त्रुटि',
        
        detailTitle: 'स्थान विवरण',
        detailAnimeName: 'एनीमे',
        detailSpotName: 'स्थान',
        detailAddress: 'पता',
        detailTranslate: 'अनुवाद',
        detailAddToRoute: 'रूट में जोड़ें',
        
        menuTitle: 'मेनू',
        menuHistory: 'इतिहास',
        menuRecommend: 'AI सुझाव',
        menuRoute: 'रूट प्लानर',
        menuCurrentLocation: 'मेरा स्थान',
        menuSidebar: 'साइडबार दिखाएं',
        
        loading: 'लोड हो रहा है...',
        noResults: 'कोई स्थान नहीं मिला',
        
        // AIおすすめ
        recommendTitle: '🌟 AI सुझाव',
        recommendGenreAnalysis: '📊 आपकी शैली विश्लेषण',
        recommendViewedWorks: 'देखी गई रचनाएं',
        recommendWorksUnit: '',
        recommendRank: '',
        recommendTimes: ' बार',
        recommendViewCount: 'देखने की संख्या',
        recommendNoWorks: 'कोई सुझाव उपलब्ध नहीं',
        
        // 注意書き
        noticeTitle: '⚠️ उपयोग के लिए नोट',
        noticeData: 'इस मानचित्र में सभी एनीमे तीर्थ स्थल शामिल नहीं हैं',
        noticeAi: 'AI से प्राकृतिक भाषा में पूछें (उदाहरण: "क्योटो में एनीमे स्थान दिखाओ")',
        noticeAccuracy: 'स्थान की जानकारी बदल सकती है। यात्रा से पहले पुष्टि करें',
        noticeTranslation: 'अनुवाद AI द्वारा स्वचालित है और सटीक नहीं हो सकता',
        noticePrivate: 'कुछ स्थान निजी संपत्ति हैं। प्रतिबंधित क्षेत्रों में प्रवेश न करें',
        noticePhoto: 'फोटो लेते समय दूसरों को परेशान न करें',
        noticeManner: 'कृपया स्थानीय निवासियों का सम्मान करें'
    },
    es: {
        searchPlaceholder: 'Buscar lugares...',
        
        categoryAll: 'Todos',
        categoryShrine: 'Santuario/Templo',
        categoryStation: 'Estación',
        categorySchool: 'Escuela',
        categoryPark: 'Parque',
        categorySea: 'Mar/Río',
        categoryBridge: 'Puente',
        categoryShop: 'Tienda',
        categoryTower: 'Torre',
        
        allAnime: 'Todos los Anime',
        spotsCount: ' lugares',
        
        aiChatTitle: 'Búsqueda AI',
        aiChatPlaceholder: 'Ej: Muéstrame lugares de anime en Kioto',
        aiChatSend: 'Enviar',
        aiChatSearching: 'Buscando...',
        aiSpotsFound: ' lugares encontrados',
        aiShowOnMap: 'Mostrar todo en el mapa',
        aiTellMore: 'Cuéntame más',
        aiError: 'Error',
        
        detailTitle: 'Detalles del Lugar',
        detailAnimeName: 'Anime',
        detailSpotName: 'Lugar',
        detailAddress: 'Dirección',
        detailTranslate: 'Traducir',
        detailAddToRoute: 'Añadir a Ruta',
        
        menuTitle: 'Menú',
        menuHistory: 'Historial',
        menuRecommend: 'Recomendaciones AI',
        menuRoute: 'Planificador de Ruta',
        menuCurrentLocation: 'Mi Ubicación',
        menuSidebar: 'Mostrar Barra Lateral',
        
        loading: 'Cargando...',
        noResults: 'No se encontraron lugares',
        
        // AIおすすめ
        recommendTitle: '🌟 Recomendaciones AI',
        recommendGenreAnalysis: '📊 Tu Análisis de Género',
        recommendViewedWorks: 'Obras vistas',
        recommendWorksUnit: '',
        recommendRank: '°',
        recommendTimes: ' veces',
        recommendViewCount: 'Veces visto',
        recommendNoWorks: 'No hay recomendaciones',
        
        // 注意書き
        noticeTitle: '⚠️ Aviso Importante',
        noticeData: 'Este mapa no cubre todos los lugares de peregrinación de anime',
        noticeAi: 'Pregunta al AI en lenguaje natural (ej: "Muéstrame lugares de anime en Kioto")',
        noticeAccuracy: 'La información puede cambiar. Verifica antes de visitar',
        noticeTranslation: 'Las traducciones son automáticas y pueden no ser precisas',
        noticePrivate: 'Algunos lugares son propiedad privada. No entres en áreas restringidas',
        noticePhoto: 'Ten cuidado de no molestar a otros al tomar fotos',
        noticeManner: 'Por favor, respeta a los residentes locales'
    },
    fr: {
        searchPlaceholder: 'Rechercher des lieux...',
        
        categoryAll: 'Tous',
        categoryShrine: 'Sanctuaire/Temple',
        categoryStation: 'Gare',
        categorySchool: 'École',
        categoryPark: 'Parc',
        categorySea: 'Mer/Rivière',
        categoryBridge: 'Pont',
        categoryShop: 'Boutique',
        categoryTower: 'Tour',
        
        allAnime: 'Tous les Anime',
        spotsCount: ' lieux',
        
        aiChatTitle: 'Recherche AI',
        aiChatPlaceholder: 'Ex: Montre-moi les lieux d\'anime à Kyoto',
        aiChatSend: 'Envoyer',
        aiChatSearching: 'Recherche...',
        aiSpotsFound: ' lieux trouvés',
        aiShowOnMap: 'Tout afficher sur la carte',
        aiTellMore: 'Dis-moi plus',
        aiError: 'Erreur',
        
        detailTitle: 'Détails du Lieu',
        detailAnimeName: 'Anime',
        detailSpotName: 'Lieu',
        detailAddress: 'Adresse',
        detailTranslate: 'Traduire',
        detailAddToRoute: 'Ajouter à l\'itinéraire',
        
        menuTitle: 'Menu',
        menuHistory: 'Historique',
        menuRecommend: 'Recommandations AI',
        menuRoute: 'Planificateur d\'itinéraire',
        menuCurrentLocation: 'Ma Position',
        menuSidebar: 'Afficher la Barre Latérale',
        
        loading: 'Chargement...',
        noResults: 'Aucun lieu trouvé',
        
        // AIおすすめ
        recommendTitle: '🌟 Recommandations AI',
        recommendGenreAnalysis: '📊 Votre Analyse de Genre',
        recommendViewedWorks: 'Œuvres vues',
        recommendWorksUnit: '',
        recommendRank: 'e',
        recommendTimes: ' fois',
        recommendViewCount: 'Nombre de vues',
        recommendNoWorks: 'Aucune recommandation',
        
        // 注意書き
        noticeTitle: '⚠️ Avis Important',
        noticeData: 'Cette carte ne couvre pas tous les lieux de pèlerinage anime',
        noticeAi: 'Posez vos questions à l\'AI en langage naturel (ex: "Montre-moi les lieux d\'anime à Kyoto")',
        noticeAccuracy: 'Les informations peuvent changer. Vérifiez avant de visiter',
        noticeTranslation: 'Les traductions sont automatiques et peuvent être inexactes',
        noticePrivate: 'Certains lieux sont des propriétés privées. N\'entrez pas dans les zones interdites',
        noticePhoto: 'Soyez respectueux lors de la prise de photos',
        noticeManner: 'Veuillez respecter les résidents locaux'
    },
    pt: {
        searchPlaceholder: 'Pesquisar locais...',
        
        categoryAll: 'Todos',
        categoryShrine: 'Santuário/Templo',
        categoryStation: 'Estação',
        categorySchool: 'Escola',
        categoryPark: 'Parque',
        categorySea: 'Mar/Rio',
        categoryBridge: 'Ponte',
        categoryShop: 'Loja',
        categoryTower: 'Torre',
        
        allAnime: 'Todos os Anime',
        spotsCount: ' locais',
        
        aiChatTitle: 'Pesquisa AI',
        aiChatPlaceholder: 'Ex: Mostre-me locais de anime em Kyoto',
        aiChatSend: 'Enviar',
        aiChatSearching: 'Pesquisando...',
        aiSpotsFound: ' locais encontrados',
        aiShowOnMap: 'Mostrar tudo no mapa',
        aiTellMore: 'Conte-me mais',
        aiError: 'Erro',
        
        detailTitle: 'Detalhes do Local',
        detailAnimeName: 'Anime',
        detailSpotName: 'Local',
        detailAddress: 'Endereço',
        detailTranslate: 'Traduzir',
        detailAddToRoute: 'Adicionar à Rota',
        
        menuTitle: 'Menu',
        menuHistory: 'Histórico',
        menuRecommend: 'Recomendações AI',
        menuRoute: 'Planejador de Rota',
        menuCurrentLocation: 'Minha Localização',
        menuSidebar: 'Mostrar Barra Lateral',
        
        loading: 'Carregando...',
        noResults: 'Nenhum local encontrado',
        
        // AIおすすめ
        recommendTitle: '🌟 Recomendações AI',
        recommendGenreAnalysis: '📊 Sua Análise de Gênero',
        recommendViewedWorks: 'Obras vistas',
        recommendWorksUnit: '',
        recommendRank: '°',
        recommendTimes: ' vezes',
        recommendViewCount: 'Vezes visto',
        recommendNoWorks: 'Sem recomendações',
        
        // 注意書き
        noticeTitle: '⚠️ Aviso Importante',
        noticeData: 'Este mapa não cobre todos os locais de peregrinação de anime',
        noticeAi: 'Pergunte ao AI em linguagem natural (ex: "Mostre-me locais de anime em Kyoto")',
        noticeAccuracy: 'As informações podem mudar. Verifique antes de visitar',
        noticeTranslation: 'As traduções são automáticas e podem não ser precisas',
        noticePrivate: 'Alguns locais são propriedade privada. Não entre em áreas restritas',
        noticePhoto: 'Tenha cuidado para não incomodar outros ao tirar fotos',
        noticeManner: 'Por favor, respeite os moradores locais'
    }
};

// 翻訳テキストを取得
function getTranslation(key) {
    const lang = currentLanguage || 'ja';
    if (uiTranslations[lang] && uiTranslations[lang][key]) {
        return uiTranslations[lang][key];
    }
    // フォールバック: 日本語
    return uiTranslations['ja'][key] || key;
}

// UI全体を翻訳する関数
function translateUI() {
    const t = uiTranslations[currentLanguage] || uiTranslations['ja'];
    
    // 検索プレースホルダー
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.placeholder = t.searchPlaceholder;
    }
    
    // カテゴリフィルタボタン（ID指定で翻訳）
    const categoryTextItems = {
        'cat-text-all': t.categoryAll,
        'cat-text-shrine': t.categoryShrine,
        'cat-text-station': t.categoryStation,
        'cat-text-school': t.categorySchool,
        'cat-text-park': t.categoryPark,
        'cat-text-sea': t.categorySea,
        'cat-text-bridge': t.categoryBridge,
        'cat-text-shop': t.categoryShop,
        'cat-text-tower': t.categoryTower
    };
    
    for (const [id, text] of Object.entries(categoryTextItems)) {
        const el = document.getElementById(id);
        if (el && text) {
            el.textContent = text;
        }
    }
    
    // アニメフィルタのデフォルトオプション
    const animeFilter = document.getElementById('anime-filter');
    if (animeFilter && animeFilter.options.length > 0) {
        animeFilter.options[0].textContent = t.allAnime;
    }
    
    // AIチャット
    const aiInput = document.getElementById('ai-question-input');
    if (aiInput) {
        aiInput.placeholder = t.aiChatPlaceholder;
    }
    
    const aiSendBtn = document.getElementById('ai-send-btn');
    if (aiSendBtn) {
        aiSendBtn.textContent = t.aiChatSend;
    }
    
    // メニュー項目（data-translate属性がある要素）
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (t[key]) {
            el.textContent = t[key];
        }
    });
    
    // ========================================
    // メニュー翻訳（ID指定で直接翻訳）
    // ========================================
    
    // メニュータイトル
    const menuTitle = document.getElementById('menu-title');
    if (menuTitle) {
        menuTitle.textContent = t.menuTitle;
    }
    
    // メニュー項目
    const menuTextItems = {
        'menu-text-history': t.menuHistory,
        'menu-text-recommend': t.menuRecommend,
        'menu-text-ai-search': t.aiChatTitle,
        'menu-text-sidebar': t.menuSidebar,
        'menu-text-route': t.menuRoute
    };
    
    for (const [id, text] of Object.entries(menuTextItems)) {
        const el = document.getElementById(id);
        if (el && text) {
            el.textContent = text;
        }
    }
    
    // ========================================
    // サイドバータイトル翻訳
    // ========================================
    const recommendSidebarTitle = document.getElementById('recommend-sidebar-title');
    if (recommendSidebarTitle) {
        recommendSidebarTitle.textContent = t.recommendTitle || '🌟 AIおすすめ';
    }
    
    const historySidebarTitle = document.getElementById('history-sidebar-title');
    if (historySidebarTitle) {
        historySidebarTitle.textContent = t.menuHistory;
    }
    
    // ========================================
    // 注意書き翻訳
    // ========================================
    const noticeItems = {
        'notice-title': t.noticeTitle,
        'notice-data': t.noticeData,
        'notice-ai': t.noticeAi,
        'notice-accuracy': t.noticeAccuracy,
        'notice-translation': t.noticeTranslation,
        'notice-private': t.noticePrivate,
        'notice-photo': t.noticePhoto,
        'notice-manner': t.noticeManner
    };
    
    for (const [id, text] of Object.entries(noticeItems)) {
        const el = document.getElementById(id);
        if (el && text) {
            el.textContent = text;
        }
    }
    
    console.log('🌐 UI翻訳完了:', currentLanguage);
}

// 言語モーダルを開く
function openLanguageModal() {
    const overlay = document.getElementById('language-modal-overlay');
    overlay.classList.remove('modal-hidden');
    document.body.style.overflow = 'hidden';
}

// 言語モーダルを閉じる
function closeLanguageModal() {
    const overlay = document.getElementById('language-modal-overlay');
    overlay.classList.add('modal-hidden');
    document.body.style.overflow = '';
}

// 言語を選択
function selectLanguage(lang) {
    currentLanguage = lang;
    console.log('言語を変更しました:', lang);
    
    // ボタン表示を更新
    const data = languageData[lang];
    document.getElementById('current-lang-flag').textContent = data.flag;
    
    // モーダル内のアクティブ状態を更新
    document.querySelectorAll('.lang-modal-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    
    // モーダルを閉じる
    closeLanguageModal();
    
    // UI全体を翻訳
    if (typeof translateUI === 'function') {
        translateUI();
    }
    
    // Google Mapsの言語を変更するためにページをリロード
    // 現在のURLから既存のlangパラメータを削除して新しいものを追加
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    
    // 現在と違う言語が選択された場合のみリロード
    const currentUrlLang = new URL(window.location.href).searchParams.get('lang') || 'ja';
    if (currentUrlLang !== lang) {
        window.location.href = url.toString();
    }
}

function changeLanguage(lang) {
    selectLanguage(lang);
}

// テキストを翻訳する関数
async function translateText(text, targetLanguage) {
    try {
        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                target_language: targetLanguage
            })
        });
        
        if (!response.ok) {
            throw new Error('翻訳に失敗しました');
        }
        
        const data = await response.json();
        return data.translated;
    } catch (error) {
        console.error('翻訳エラー:', error);
        return text;
    }
}

// 詳細パネルのテキストを翻訳する関数
async function translateDetailPanel() {
    const bodyContent = document.getElementById('detail-body-content');
    if (!bodyContent) {
        alert('詳細パネルが開いていません');
        return;
    }
    
    if (currentLanguage === 'ja') {
        alert('日本語が選択されています');
        return;
    }
    
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '翻訳中...';
    button.disabled = true;
    
    try {
        const infoContents = bodyContent.querySelectorAll('.info-content');
        for (let content of infoContents) {
            // リンクは翻訳しない
            if (content.textContent.trim() && !content.querySelector('a')) {
                const originalText = content.textContent;
                const translated = await translateText(originalText, currentLanguage);
                content.setAttribute('data-original', originalText);
                content.textContent = translated;
            }
        }
        button.textContent = '✓ 翻訳完了';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    } catch (error) {
        alert('翻訳エラー: ' + error.message);
        button.textContent = originalText;
    } finally {
        button.disabled = false;
    }
}

// ========================================
// 多言語対応検索機能
// ========================================

async function applyFilter() {
    currentFilter = document.getElementById('anime-filter').value;
    const searchInput = document.getElementById('search-input').value.trim();
    
    // 検索が空の場合 → 全件表示にリセット
    if (!searchInput) {
        currentSearch = '';
        
        // 強制的に全マーカーを再表示
        resetAllMarkers();
        
        renderList();
        updateCount();
        
        // 地図を日本全体が見える位置にリセット
        if (map) {
            map.setCenter({ lat: 36.5, lng: 138.0 });
            map.setZoom(5);
        }
        
        console.log('🔄 検索クリア: 全件表示にリセット');
        return;
    }
    
    // 入力中の場合は少し待つ（デバウンス）
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        await performSmartSearch(searchInput);
    }, 500);
}

// 全マーカーを強制リセット
function resetAllMarkers() {
    // クラスタをクリア
    if (markerClustererInstance) {
        markerClustererInstance.clearMarkers();
    }
    
    // 全マーカーを一旦非表示
    markers.forEach(marker => {
        marker.setMap(null);
    });
    
    // フィルタ条件に合うマーカーだけ表示
    const visibleMarkers = [];
    markers.forEach((marker, index) => {
        const spot = spots[index];
        if (!spot) return;
        
        const matchesAnime = currentFilter === 'all' || spot.anime_name === currentFilter;
        const matchesCat = matchesCategory(spot, currentCategory);
        const matchesGenre = currentGenreFilter === null || genreSpotIds.includes(spot.id);
        
        // currentSearchは既に''なので、全件マッチ
        if (matchesAnime && matchesCat && matchesGenre) {
            visibleMarkers.push(marker);
        }
    });
    
    // クラスタリングを再構築
    markerClustererInstance = new markerClusterer.MarkerClusterer({ markers: visibleMarkers, map });
    
    console.log('✅ リセット完了: ' + visibleMarkers.length + '件のピンを表示');
}

async function performSmartSearch(query) {
    if (isSearching) return;
    isSearching = true;
    
    try {
        // まず普通に検索
        currentSearch = query.toLowerCase();
        updateMarkers();
        const directMatches = getVisibleSpots();
        
        // マッチがあれば完了
        if (directMatches.length > 0) {
            renderList();
            updateCount();
            isSearching = false;
            return;
        }
        
        // マッチがない場合、AI翻訳検索
        console.log('AI翻訳検索を開始:', query);
        
        const response = await fetch('/api/smart-search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: query })
        });
        
        const data = await response.json();
        
        if (data.needs_translation && data.translated_query) {
            console.log('翻訳結果:', data.translated_query);
            
            // 翻訳されたクエリで再検索
            currentSearch = data.translated_query.toLowerCase();
            updateMarkers();
            renderList();
            updateCount();
            
            // ユーザーに通知（オプション）
            const visibleSpots = getVisibleSpots();
            if (visibleSpots.length > 0) {
                console.log(`"${data.original_query}" → "${data.translated_query}" で検索しました`);
            }
        } else {
            // 翻訳後もマッチなし
            renderList();
            updateCount();
        }
        
    } catch (error) {
        console.error('スマート検索エラー:', error);
        // エラー時は通常検索
        currentSearch = query.toLowerCase();
        updateMarkers();
        renderList();
        updateCount();
    } finally {
        isSearching = false;
    }
}

function updateMarkers() {
    // まず全マーカーを一旦非表示にする
    markers.forEach(marker => {
        marker.setMap(null);
    });
    
    // フィルタリングされたマーカーを取得
    const visibleMarkers = [];
    markers.forEach((marker, index) => {
        const spot = spots[index];
        const matchesAnime = currentFilter === 'all' || spot.anime_name === currentFilter;
        const matchesSearch = currentSearch === '' || 
            (spot.name && spot.name.toLowerCase().includes(currentSearch)) ||
            (spot.address && spot.address.toLowerCase().includes(currentSearch)) ||
            (spot.note && spot.note.toLowerCase().includes(currentSearch)) ||
            (spot.anime_name && spot.anime_name.toLowerCase().includes(currentSearch));
        const matchesCat = matchesCategory(spot, currentCategory);
        const matchesGenre = currentGenreFilter === null || genreSpotIds.includes(spot.id);
        
        if (matchesAnime && matchesSearch && matchesCat && matchesGenre) {
            visibleMarkers.push(marker);
        }
    });
    
    // クラスタリングを更新
    if (markerClustererInstance) {
        markerClustererInstance.clearMarkers();
    }
    markerClustererInstance = new markerClusterer.MarkerClusterer({ markers: visibleMarkers, map });
}

// スポットがカテゴリに一致するかチェック
function matchesCategory(spot, category) {
    if (category === 'all') return true;
    
    // 種類カテゴリのチェック
    if (categoryKeywords[category]) {
        const keywords = categoryKeywords[category];
        const name = spot.name || '';
        const note = spot.note || '';
        return keywords.some(kw => name.includes(kw) || note.includes(kw));
    }
    
    return false;
}

function getVisibleSpots() {
    return spots.filter(spot => {
        const matchesAnime = currentFilter === 'all' || spot.anime_name === currentFilter;
        const matchesSearch = currentSearch === '' || 
            (spot.name && spot.name.toLowerCase().includes(currentSearch)) ||
            (spot.address && spot.address.toLowerCase().includes(currentSearch)) ||
            (spot.note && spot.note.toLowerCase().includes(currentSearch)) ||
            (spot.anime_name && spot.anime_name.toLowerCase().includes(currentSearch));
        const matchesCat = matchesCategory(spot, currentCategory);
        const matchesGenre = currentGenreFilter === null || genreSpotIds.includes(spot.id);
        return matchesAnime && matchesSearch && matchesCat && matchesGenre;
    });
}

// カテゴリフィルタ関数（マーカーを表示/非表示）
function filterByCategory(category) {
    currentCategory = category;
    
    // ボタンのアクティブ状態を更新
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-category="${category}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // 各マーカーの表示/非表示を切り替え
    spots.forEach((spot, index) => {
        const marker = markers[index];
        if (marker) {
            const shouldShow = matchesCategory(spot, category) && 
                              (currentFilter === 'all' || spot.anime_name === currentFilter) &&
                              (currentSearch === '' || 
                               (spot.name && spot.name.toLowerCase().includes(currentSearch)) ||
                               (spot.address && spot.address.toLowerCase().includes(currentSearch)) ||
                               (spot.anime_name && spot.anime_name.toLowerCase().includes(currentSearch)));
            
            marker.setMap(shouldShow ? map : null);
        }
    });
    
    // クラスタリングを更新
    const visibleMarkers = markers.filter((marker, index) => {
        const spot = spots[index];
        return matchesCategory(spot, currentCategory) && 
               (currentFilter === 'all' || spot.anime_name === currentFilter) &&
               (currentSearch === '' || 
                (spot.name && spot.name.toLowerCase().includes(currentSearch)) ||
                (spot.address && spot.address.toLowerCase().includes(currentSearch)) ||
                (spot.anime_name && spot.anime_name.toLowerCase().includes(currentSearch)));
    });
    
    if (markerClustererInstance) {
        markerClustererInstance.clearMarkers();
    }
    markerClustererInstance = new markerClusterer.MarkerClusterer({ markers: visibleMarkers, map });
    
    // リストと件数を更新
    renderList();
    updateCount();
    
    // 該当するスポットがある場合、表示範囲を調整
    const visibleSpots = getVisibleSpots();
    if (visibleSpots.length > 0 && category !== 'all') {
        // 複数スポットがある場合は全体が見える範囲にズーム
        if (visibleSpots.length > 1) {
            const bounds = new google.maps.LatLngBounds();
            visibleSpots.forEach(spot => {
                bounds.extend({ lat: spot.latitude, lng: spot.longitude });
            });
            map.fitBounds(bounds, { padding: 50 });
        } else {
            // 1件だけならその場所にズーム
            const firstSpot = visibleSpots[0];
            map.panTo({ lat: firstSpot.latitude, lng: firstSpot.longitude });
            map.setZoom(12);
        }
    }
    
    console.log(`カテゴリ「${category}」でフィルタ: ${visibleSpots.length}件`);
}

// 現在地取得ボタン用の関数
function getCurrentLocation() {
    if (!navigator.geolocation) {
        alert('位置情報に対応していません');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            map.setCenter({ lat, lng });
            map.setZoom(14);
            showCurrentLocationMarker(lat, lng);
        },
        (error) => {
            alert('現在地を取得できませんでした');
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function updateCount() {
    const visibleCount = getVisibleSpots().length;
    const spotsCountText = getTranslation('spotsCount');
    document.getElementById('count-display').textContent = `${visibleCount}${spotsCountText}`;
}

// ========================================
// 元の機能
// ========================================

// ページ読み込み時に履歴を復元
window.addEventListener('load', function() {
    const savedHistory = localStorage.getItem('viewHistory');
    if (savedHistory) {
        try {
            viewHistory = JSON.parse(savedHistory);
        } catch (e) {
            console.error('履歴の読み込みエラー:', e);
            viewHistory = [];
        }
    }
});

async function loadSpots() {
    try {
        const response = await fetch('/api/spots');
        spots = await response.json();
        allSpots = spots;
        
        console.log('✅ 聖地データ読み込み:', allSpots.length + '件');
        
        createFilterOptions();
        displayMap();
        renderList();
        updateCount();
        
        // ジャンル一覧を読み込み
        loadGenres();
    } catch (error) {
        console.error('エラー:', error);
        document.getElementById('loading').textContent = 'サーバーに接続できません';
    }
}

// ジャンル一覧を読み込み
async function loadGenres() {
    try {
        const response = await fetch('/api/genres');
        allGenres = await response.json();
        renderGenreButtons();
        console.log('✅ ジャンル読み込み:', allGenres.length + '件');
    } catch (error) {
        console.error('ジャンル読み込みエラー:', error);
    }
}

// ジャンルボタンを描画
function renderGenreButtons() {
    const container = document.getElementById('genre-filter');
    if (!container) return;
    
    // ジャンルアイコンマップ
    const genreIcons = {
        '戦闘': '⚔️',
        'ラブコメ': '💕',
        '日常': '☀️',
        'SF': '🚀',
        'ファンタジー': '✨',
        'スポーツ': '⚽',
        '音楽': '🎵',
        '青春': '🌸',
        'ホラー': '👻'
    };
    
    container.innerHTML = allGenres.map(g => 
        `<button class="genre-btn" data-id="${g.id}" data-name="${g.name}" onclick="filterByGenre(${g.id}, '${g.name}')">
            ${genreIcons[g.name] || '🏷️'} ${g.name}
        </button>`
    ).join('');
}

// アコーディオン開閉
function toggleGenreAccordion() {
    const content = document.getElementById('genre-filter');
    const icon = document.getElementById('genre-accordion-icon');
    
    const isOpening = !content.classList.contains('open');
    
    content.classList.toggle('open');
    icon.classList.toggle('open');
    
    // 閉じた時は聖地一覧を先頭にスクロール
    if (!isOpening) {
        const spotsList = document.getElementById('spots-list');
        if (spotsList) {
            spotsList.scrollTop = 0;
        }
    }
}

// ジャンルでフィルタリング
async function filterByGenre(genreId, genreName) {
    const buttons = document.querySelectorAll('.genre-btn');
    const badge = document.getElementById('genre-selected-badge');
    
    // 同じボタンをクリック → フィルタ解除
    if (currentGenreFilter === genreId) {
        currentGenreFilter = null;
        genreSpotIds = [];
        buttons.forEach(btn => btn.classList.remove('active'));
        badge.classList.remove('show');
        badge.textContent = '';
        console.log('🏷️ ジャンルフィルタ解除');
    } else {
        // 新しいジャンルでフィルタ
        currentGenreFilter = genreId;
        buttons.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.id) === genreId);
        });
        
        // 選択中バッジを表示
        badge.textContent = genreName;
        badge.classList.add('show');
        
        try {
            const response = await fetch(`/api/anime-by-genre/${genreId}`);
            const filteredSpots = await response.json();
            genreSpotIds = filteredSpots.map(s => s.id);
            console.log(`🏷️ ジャンルフィルタ: ${genreSpotIds.length}件`);
        } catch (error) {
            console.error('ジャンルフィルタエラー:', error);
            genreSpotIds = [];
        }
    }
    
    // 他のフィルタをリセット
    currentFilter = 'all';
    document.getElementById('anime-filter').value = 'all';
    
    // あいうえおタブを「全て」にリセット
    document.querySelectorAll('.anime-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    const allTab = document.querySelector('.anime-tab[data-tab="all"]');
    if (allTab) allTab.classList.add('active');
    currentAnimeTab = 'all';
    
    // フィルタを適用
    applyFilter();
    renderList();
    updateCount();
}

function createFilterOptions() {
    const animeMap = new Map(); // anime_name → anime_yomi のマップ
    spots.forEach(spot => {
        if (spot.anime_name) {
            // 読み仮名がある場合は保存
            if (!animeMap.has(spot.anime_name)) {
                animeMap.set(spot.anime_name, spot.anime_yomi || spot.anime_name);
            }
        }
    });

    // 全アニメリストを保存（フィルタ用）- 読み仮名でソート
    window.allAnimeList = Array.from(animeMap.keys()).sort((a, b) => {
        const yomiA = animeMap.get(a) || a;
        const yomiB = animeMap.get(b) || b;
        return yomiA.localeCompare(yomiB, 'ja');
    });
    
    // 読み仮名マップも保存
    window.animeYomiMap = animeMap;
    
    const select = document.getElementById('anime-filter');
    window.allAnimeList.forEach(anime => {
        const option = document.createElement('option');
        option.value = anime;
        option.textContent = anime;
        select.appendChild(option);
    });
}

// アニメ名検索フィルター
function filterAnimeDropdown() {
    const searchInput = document.getElementById('anime-search-input');
    const searchText = searchInput ? searchInput.value.toLowerCase() : '';
    const select = document.getElementById('anime-filter');
    
    // 現在のタブを取得
    const activeTab = document.querySelector('.anime-tab.active');
    const currentTab = activeTab ? activeTab.dataset.tab : 'all';
    
    // 現在選択されているアニメを保存
    const currentSelection = select.value;
    
    // ドロップダウンをクリア（多言語対応）
    select.innerHTML = `<option value="all">${getTranslation('allAnime')}</option>`;
    
    // フィルタリング（読み仮名を使用）
    let filteredAnimes = window.allAnimeList.filter(anime => {
        const yomi = window.animeYomiMap ? window.animeYomiMap.get(anime) : null;
        const matchesSearch = searchText === '' || 
            anime.toLowerCase().includes(searchText) || 
            (yomi && yomi.toLowerCase().includes(searchText));
        const matchesTab = currentTab === 'all' || matchesAnimeTab(anime, currentTab, yomi);
        return matchesSearch && matchesTab;
    });
    
    filteredAnimes.forEach(anime => {
        const option = document.createElement('option');
        option.value = anime;
        option.textContent = anime;
        select.appendChild(option);
    });
    
    // 以前の選択がフィルタ結果に含まれていれば維持、なければ「すべて」
    if (filteredAnimes.includes(currentSelection)) {
        select.value = currentSelection;
    } else {
        select.value = 'all';
    }
}

// あいうえおタブでフィルター
function filterByTab(tab) {
    // タブのアクティブ状態を更新
    document.querySelectorAll('.anime-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    // 「全て」タブの場合、検索もリセット
    if (tab === 'all') {
        const searchInput = document.getElementById('anime-search-input');
        if (searchInput) searchInput.value = '';
    }
    
    // ドロップダウンを更新
    filterAnimeDropdown();
    
    // ドロップダウンの選択を「すべてのアニメ」にリセット
    const select = document.getElementById('anime-filter');
    select.value = 'all';
    
    // 地図の表示も更新
    applyFilter();
}

// アニメ名がタブに一致するかチェック（読み仮名を使用）
function matchesAnimeTab(animeName, tab, animeYomi = null) {
    if (tab === 'all') return true;
    
    // 読み仮名があればそれを使う、なければアニメ名の最初の文字
    const targetString = animeYomi || animeName;
    const firstChar = targetString.charAt(0);
    
    // A-Z（英数字）
    if (tab === 'A') {
        return /^[A-Za-z0-9]/.test(animeName.charAt(0));
    }
    
    // あいうえお行の判定（読み仮名ベース）
    const hiraganaRanges = {
        'あ': ['あ', 'い', 'う', 'え', 'お', 'ア', 'イ', 'ウ', 'エ', 'オ'],
        'か': ['か', 'き', 'く', 'け', 'こ', 'が', 'ぎ', 'ぐ', 'げ', 'ご', 'カ', 'キ', 'ク', 'ケ', 'コ', 'ガ', 'ギ', 'グ', 'ゲ', 'ゴ'],
        'さ': ['さ', 'し', 'す', 'せ', 'そ', 'ざ', 'じ', 'ず', 'ぜ', 'ぞ', 'サ', 'シ', 'ス', 'セ', 'ソ', 'ザ', 'ジ', 'ズ', 'ゼ', 'ゾ'],
        'た': ['た', 'ち', 'つ', 'て', 'と', 'だ', 'ぢ', 'づ', 'で', 'ど', 'タ', 'チ', 'ツ', 'テ', 'ト', 'ダ', 'ヂ', 'ヅ', 'デ', 'ド'],
        'な': ['な', 'に', 'ぬ', 'ね', 'の', 'ナ', 'ニ', 'ヌ', 'ネ', 'ノ'],
        'は': ['は', 'ひ', 'ふ', 'へ', 'ほ', 'ば', 'び', 'ぶ', 'べ', 'ぼ', 'ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ', 'ハ', 'ヒ', 'フ', 'ヘ', 'ホ', 'バ', 'ビ', 'ブ', 'ベ', 'ボ', 'パ', 'ピ', 'プ', 'ペ', 'ポ'],
        'ま': ['ま', 'み', 'む', 'め', 'も', 'マ', 'ミ', 'ム', 'メ', 'モ'],
        'や': ['や', 'ゆ', 'よ', 'ヤ', 'ユ', 'ヨ'],
        'ら': ['ら', 'り', 'る', 'れ', 'ろ', 'ラ', 'リ', 'ル', 'レ', 'ロ'],
        'わ': ['わ', 'を', 'ん', 'ワ', 'ヲ', 'ン']
    };
    
    if (hiraganaRanges[tab]) {
        return hiraganaRanges[tab].includes(firstChar);
    }
    
    return false;
}

function displayMap() {
    console.log('🗺️ displayMap called');
    
    const center = spots.length > 0 
        ? { lat: spots[0].latitude, lng: spots[0].longitude }
        : { lat: 35.6762, lng: 139.6503 };

    // 地図がまだ初期化されていない場合のみ作成
    if (!map) {
        map = new google.maps.Map(document.getElementById('map'), {
            zoom: spots.length > 0 ? 10 : 6,
            center: center,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            gestureHandling: 'greedy'  // Ctrlキー不要でズーム可能
        });
        console.log('✅ Map created');
    }

    // マーカーを作成
    markers = [];
    spots.forEach((spot, index) => {
        const marker = new google.maps.Marker({
            position: { lat: spot.latitude, lng: spot.longitude },
            title: spot.name
        });

        marker.addListener('click', () => {
            selectSpot(index, marker);
        });

        markers.push(marker);
    });

    console.log(`✅ Created ${markers.length} markers`);

    // マーカークラスタリングを適用
    if (markerClustererInstance) {
        markerClustererInstance.clearMarkers();
    }
    markerClustererInstance = new markerClusterer.MarkerClusterer({ markers, map });
    console.log('✅ MarkerClusterer applied');
}

function renderList() {
    const listContainer = document.getElementById('spots-list');
    listContainer.innerHTML = '';

    const visibleSpots = getVisibleSpots();

    if (visibleSpots.length === 0) {
        listContainer.innerHTML = '<div id="loading">該当する聖地が見つかりません</div>';
        return;
    }

    visibleSpots.forEach((spot) => {
        const originalIndex = spots.indexOf(spot);
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <div class="list-item-anime">${spot.anime_name || '不明'}</div>
            <div class="list-item-name">${spot.name}</div>
            <div class="list-item-address">${spot.address || '住所なし'}</div>
        `;
        item.onclick = () => selectSpot(originalIndex, markers[originalIndex]);
        listContainer.appendChild(item);
    });
}

function selectSpot(index, marker) {
    const spot = spots[index];
    
    // 同じ座標にある全てのスポットを取得
    const spotsAtLocation = spots.filter(s => 
        Math.abs(s.latitude - spot.latitude) < 0.0001 && 
        Math.abs(s.longitude - spot.longitude) < 0.0001
    );
    
    // 閲覧履歴に追加
    addToHistory(spot);
    
    map.panTo(marker.getPosition());
    map.setZoom(15);
    
    // 複数のスポットがある場合はまとめて表示
    if (spotsAtLocation.length > 1) {
        showMultipleDetailPanel(spotsAtLocation);
    } else {
        showDetailPanel(spot);
    }

    document.querySelectorAll('.list-item').forEach(item => {
        item.classList.remove('active');
    });

    const visibleSpots = getVisibleSpots();
    const listIndex = visibleSpots.indexOf(spot);
    if (listIndex >= 0) {
        document.querySelectorAll('.list-item')[listIndex].classList.add('active');
    }
}

// 閲覧履歴に追加
function addToHistory(spot) {
    const exists = viewHistory.find(h => h.id === spot.id);
    if (!exists) {
        viewHistory.unshift({
            id: spot.id,
            name: spot.name,
            anime_name: spot.anime_name,
            timestamp: new Date().toISOString()
        });
        
        if (viewHistory.length > 20) {
            viewHistory.pop();
        }
        
        localStorage.setItem('viewHistory', JSON.stringify(viewHistory));
    }
}

function showDetailPanel(spot) {
    const panel = document.getElementById('detail-panel');
    const headerContent = document.getElementById('detail-header-content');
    const bodyContent = document.getElementById('detail-body-content');

    // Street View埋め込み用（メイン）
    const streetViewEmbed = spot.latitude && spot.longitude 
        ? `<iframe 
             src="https://www.google.com/maps/embed/v1/streetview?key=AIzaSyAS7HYsHYhWa8uIk0bdBS73PKypRpHzaFo&location=${spot.latitude},${spot.longitude}&heading=0&pitch=0&fov=90"
             class="streetview-iframe"
             allowfullscreen
             loading="lazy"
             referrerpolicy="no-referrer-when-downgrade">
           </iframe>`
        : '';
    
    // 航空写真（フォールバック）
    const satelliteEmbed = spot.latitude && spot.longitude
        ? `<iframe 
             src="https://www.google.com/maps/embed/v1/view?key=AIzaSyAS7HYsHYhWa8uIk0bdBS73PKypRpHzaFo&center=${spot.latitude},${spot.longitude}&zoom=18&maptype=satellite"
             class="streetview-iframe"
             allowfullscreen
             loading="lazy"
             referrerpolicy="no-referrer-when-downgrade">
           </iframe>`
        : '';

    headerContent.innerHTML = `
        <div class="anime-badge">
            ${spot.anime_url ? 
                `<a href="${spot.anime_url}" target="_blank" style="color: #1a73e8; text-decoration: none;">
                    『${spot.anime_name || '不明'}』<span style="font-size: 12px;"> 🔗</span>
                </a>` : 
                `『${spot.anime_name || '不明'}』`
            }
        </div>
        <div class="spot-title">${spot.name}</div>
    `;

    bodyContent.innerHTML = `
        ${spot.latitude && spot.longitude ? `
            <div class="streetview-container">
                <div class="view-tabs">
                    <button class="view-tab active" onclick="switchViewTab('streetview')">📍 Street View</button>
                    <button class="view-tab" onclick="switchViewTab('satellite')">🛰️ 航空写真</button>
                </div>
                <div id="streetview-view" class="view-content active">
                    ${streetViewEmbed}
                    <div class="streetview-hint">👆 ドラッグで360°見渡せます</div>
                </div>
                <div id="satellite-view" class="view-content">
                    ${satelliteEmbed}
                    <div class="streetview-hint">🛰️ 上空からの航空写真</div>
                </div>
            </div>
        ` : ''}

        ${spot.address ? `
            <div class="info-section">
                <div class="info-label">
                    <svg class="info-label-icon" viewBox="0 0 24 24">
                        <path fill="#5f6368" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    住所
                </div>
                <div class="info-content">
                    <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.address)}" 
                       target="_blank" 
                       style="color: #1a73e8; text-decoration: none;">
                        ${spot.address}
                    </a>
                </div>
            </div>
        ` : ''}

        ${spot.note ? `
            <div class="info-section">
                <div class="info-label">
                    <svg class="info-label-icon" viewBox="0 0 24 24">
                        <path fill="#5f6368" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                    </svg>
                    詳細
                </div>
                <div class="info-content">${spot.note}</div>
            </div>
        ` : ''}
    `;

    panel.classList.add('show');
    
    if (aiPanelOpen) {
        panel.classList.add('ai-active');
    }
}

// Street View / 航空写真 切り替え関数
function switchViewTab(viewType) {
    document.querySelectorAll('.view-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.view-content').forEach(content => content.classList.remove('active'));
    
    if (viewType === 'streetview') {
        document.querySelector('.view-tab:first-child').classList.add('active');
        document.getElementById('streetview-view').classList.add('active');
    } else {
        document.querySelector('.view-tab:last-child').classList.add('active');
        document.getElementById('satellite-view').classList.add('active');
    }
}

function closeDetailPanel() {
    const panel = document.getElementById('detail-panel');
    panel.classList.remove('show');
}

// 同じ場所に複数のアニメがある場合の詳細パネル表示
function showMultipleDetailPanel(spotsAtLocation) {
    const panel = document.getElementById('detail-panel');
    const headerContent = document.getElementById('detail-header-content');
    const bodyContent = document.getElementById('detail-body-content');

    const firstSpot = spotsAtLocation[0];
    
    // Street View埋め込み用（メイン）
    const streetViewEmbed = firstSpot.latitude && firstSpot.longitude 
        ? `<iframe 
             src="https://www.google.com/maps/embed/v1/streetview?key=AIzaSyAS7HYsHYhWa8uIk0bdBS73PKypRpHzaFo&location=${firstSpot.latitude},${firstSpot.longitude}&heading=0&pitch=0&fov=90"
             class="streetview-iframe"
             allowfullscreen
             loading="lazy"
             referrerpolicy="no-referrer-when-downgrade">
           </iframe>`
        : '';
    
    // 航空写真（フォールバック）
    const satelliteEmbed = firstSpot.latitude && firstSpot.longitude
        ? `<iframe 
             src="https://www.google.com/maps/embed/v1/view?key=AIzaSyAS7HYsHYhWa8uIk0bdBS73PKypRpHzaFo&center=${firstSpot.latitude},${firstSpot.longitude}&zoom=18&maptype=satellite"
             class="streetview-iframe"
             allowfullscreen
             loading="lazy"
             referrerpolicy="no-referrer-when-downgrade">
           </iframe>`
        : '';

    // ヘッダーに複数アニメがあることを表示
    const animeNames = [...new Set(spotsAtLocation.map(s => s.anime_name))];
    headerContent.innerHTML = `
        <div class="anime-badge" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            📍 ${spotsAtLocation.length}件のアニメ聖地
        </div>
        <div class="spot-title">${spotsAtLocation[0].name || spotsAtLocation[0].address}</div>
    `;

    // Street View / 航空写真 HTML
    let mapViewHtml = firstSpot.latitude && firstSpot.longitude ? `
        <div class="streetview-container">
            <div class="view-tabs">
                <button class="view-tab active" onclick="switchViewTab('streetview')">📍 Street View</button>
                <button class="view-tab" onclick="switchViewTab('satellite')">🛰️ 航空写真</button>
            </div>
            <div id="streetview-view" class="view-content active">
                ${streetViewEmbed}
                <div class="streetview-hint">👆 ドラッグで360°見渡せます</div>
            </div>
            <div id="satellite-view" class="view-content">
                ${satelliteEmbed}
                <div class="streetview-hint">🛰️ 上空からの航空写真</div>
            </div>
        </div>
    ` : '';

    // 各スポットの情報をタブ形式で表示
    let tabsHtml = '<div class="spot-tabs">';
    spotsAtLocation.forEach((spot, idx) => {
        tabsHtml += `
            <button class="spot-tab ${idx === 0 ? 'active' : ''}" onclick="switchSpotTab(${idx})">
                ${spot.anime_name || '不明'}
            </button>
        `;
    });
    tabsHtml += '</div>';

    let contentsHtml = '<div class="spot-tab-contents">';
    spotsAtLocation.forEach((spot, idx) => {
        contentsHtml += `
            <div class="spot-tab-content ${idx === 0 ? 'active' : ''}" data-tab-index="${idx}">
                <div class="info-section">
                    <div class="info-label">
                        <svg class="info-label-icon" viewBox="0 0 24 24">
                            <path fill="#5f6368" d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/>
                        </svg>
                        アニメ
                    </div>
                    <div class="info-content">
                        ${spot.anime_url ? 
                            `<a href="${spot.anime_url}" target="_blank" style="color: #1a73e8; text-decoration: none; font-weight: 500;">
                                『${spot.anime_name || '不明'}』
                                <span style="font-size: 11px; color: #5f6368; margin-left: 4px;">🔗 公式サイト</span>
                            </a>` : 
                            `『${spot.anime_name || '不明'}』`
                        }
                    </div>
                </div>
                
                ${spot.address ? `
                    <div class="info-section">
                        <div class="info-label">
                            <svg class="info-label-icon" viewBox="0 0 24 24">
                                <path fill="#5f6368" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                            住所
                        </div>
                        <div class="info-content">
                            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.address)}" 
                               target="_blank" 
                               style="color: #1a73e8; text-decoration: none;">
                                ${spot.address}
                            </a>
                        </div>
                    </div>
                ` : ''}
                
                ${spot.note ? `
                    <div class="info-section">
                        <div class="info-label">
                            <svg class="info-label-icon" viewBox="0 0 24 24">
                                <path fill="#5f6368" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                            </svg>
                            詳細
                        </div>
                        <div class="info-content">${spot.note}</div>
                    </div>
                ` : ''}
            </div>
        `;
    });
    contentsHtml += '</div>';

    bodyContent.innerHTML = mapViewHtml + tabsHtml + contentsHtml;

    panel.classList.add('show');
    
    if (aiPanelOpen) {
        panel.classList.add('ai-active');
    }
}

// タブ切り替え関数
function switchSpotTab(index) {
    document.querySelectorAll('.spot-tab').forEach((tab, idx) => {
        tab.classList.toggle('active', idx === index);
    });
    document.querySelectorAll('.spot-tab-content').forEach((content, idx) => {
        content.classList.toggle('active', idx === index);
    });
}

function toggleHamburgerMenu() {
    hamburgerMenuOpen = !hamburgerMenuOpen;
    const menu = document.getElementById('hamburger-menu');
    const overlay = document.getElementById('overlay');

    if (hamburgerMenuOpen) {
        menu.classList.add('open');
        overlay.classList.add('show');
    } else {
        menu.classList.remove('open');
        overlay.classList.remove('show');
    }
}

function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
    const sidebar = document.getElementById('sidebar');

    if (sidebarOpen) {
        sidebar.classList.add('open');
        toggleHamburgerMenu();
    } else {
        sidebar.classList.remove('open');
    }
}

function closeAll() {
    document.getElementById('hamburger-menu').classList.remove('open');
    document.getElementById('overlay').classList.remove('show');
    hamburgerMenuOpen = false;
}

function toggleAIPanel() {
    aiPanelOpen = !aiPanelOpen;
    const panel = document.getElementById('ai-panel');
    
    if (aiPanelOpen) {
        // 他のパネルを全て閉じる
        closeAllPanels();
        
        panel.classList.add('show');
        aiPanelOpen = true; // closeAllPanelsでfalseになるので再設定
        
        // bodyのスクロールを無効化（スマホ用）
        document.body.style.overflow = 'hidden';
    } else {
        panel.classList.remove('show');
        
        // bodyのスクロールを有効化
        document.body.style.overflow = '';
    }
}

// ========================================
// AI検索（多言語対応）
// ========================================
async function sendAIQuestion() {
    const input = document.getElementById('ai-question-input');
    const question = input.value.trim();
    
    if (!question) return;
    
    const chatArea = document.getElementById('ai-chat-area');
    const sendBtn = document.getElementById('ai-send-btn');
    
    const userMessage = document.createElement('div');
    userMessage.className = 'ai-message user';
    userMessage.innerHTML = `<div class="message-content">${question}</div>`;
    chatArea.appendChild(userMessage);
    
    // 会話履歴にユーザーの質問を追加
    chatHistory.push({ role: 'user', content: question });
    
    input.value = '';
    input.disabled = true;
    sendBtn.disabled = true;
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'ai-loading';
    loadingDiv.innerHTML = '🤖 ' + getTranslation('aiChatSearching');
    chatArea.appendChild(loadingDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
    
    try {
        const lang = (typeof currentLanguage !== 'undefined') ? currentLanguage : 'ja';
        
        // 直近5件の会話履歴を送信
        const recentHistory = chatHistory.slice(-10);
        
        const response = await fetch('/api/ai-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                question: question,
                language: lang,
                history: recentHistory,
                lastContext: lastSearchContext
            })
        });
        
        const data = await response.json();
        
        console.log('API応答:', data);
        console.log('related_spots:', data.related_spots);
        
        // 検索コンテキストを保存
        if (data.context) {
            lastSearchContext = data.context;
        }
        
        // 会話履歴にAIの回答を追加
        chatHistory.push({ role: 'assistant', content: data.answer });
        
        // 履歴が多くなりすぎたら古いものを削除
        if (chatHistory.length > 20) {
            chatHistory = chatHistory.slice(-20);
        }
        
        loadingDiv.remove();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        const aiMessage = document.createElement('div');
        aiMessage.className = 'ai-message ai';

        // ========================================
        // シンプル版：全部表示
        // ========================================
        
        // アニメ名とURLのマッピングを作成
        const animeUrlMap = {};
        if (data.related_spots) {
            data.related_spots.forEach(spot => {
                if (spot.anime_name && spot.anime_url) {
                    animeUrlMap[spot.anime_name] = spot.anime_url;
                }
            });
        }
        
        // AI回答を整形（アニメ名を色付き、段落分け）
        let formattedAnswer = data.answer || '回答を取得できませんでした';
        
        // **『アニメ名』 (English Title)** パターンを変換（リンク付き）
        formattedAnswer = formattedAnswer.replace(/\*\*『(.+?)』\s*(\([^)]+\))?\*\*/g, (match, animeName, englishTitle) => {
            const url = animeUrlMap[animeName];
            const displayTitle = englishTitle ? `『${animeName}』 ${englishTitle}` : `『${animeName}』`;
            if (url) {
                return `<div style="margin-top: 16px; margin-bottom: 4px;"><a href="${url}" target="_blank" style="color: #1a73e8; font-weight: bold; font-size: 15px; text-decoration: none;">🎬 ${displayTitle} <span style="font-size: 12px;">🔗</span></a></div>`;
            } else {
                return `<div style="margin-top: 16px; margin-bottom: 4px;"><span style="color: #1a73e8; font-weight: bold; font-size: 15px;">🎬 ${displayTitle}</span></div>`;
            }
        });
        
        // **アニメ名** を色付きに変換（別パターン - 残った**を処理）
        formattedAnswer = formattedAnswer.replace(/\*\*(.+?)\*\*/g, 
            '<span style="color: #1a73e8; font-weight: bold;">$1</span>');
        
        // 📍 聖地名 を強調（シンプルにspanだけ）
        formattedAnswer = formattedAnswer.replace(/📍\s*/g, 
            '<br><span style="color: #333; font-weight: 500;">📍 </span>');
        
        // 【登場シーン】【見どころ】を色付け（8言語対応）
        const scenePatterns = [
            '登場シーン', 'Scene', '登场场景', '등장 장면', 'दृश्य', 'Escena', 'Scène', 'Cena'
        ];
        const highlightPatterns = [
            '見どころ', 'Highlights', '看点', '볼거리', 'मुख्य आकर्षण', 'Destacados', 'Points forts', 'Destaques'
        ];
        
        scenePatterns.forEach(pattern => {
            const regex = new RegExp(`【${pattern}】`, 'g');
            formattedAnswer = formattedAnswer.replace(regex, 
                `<br><span style="color: #e91e63; font-weight: 500;">【${pattern}】</span>`);
        });
        
        highlightPatterns.forEach(pattern => {
            const regex = new RegExp(`【${pattern}】`, 'g');
            formattedAnswer = formattedAnswer.replace(regex, 
                `<br><span style="color: #4caf50; font-weight: 500;">【${pattern}】</span>`);
        });
        
        // 改行を整形
        formattedAnswer = formattedAnswer.replace(/\n\n/g, '<br><br>');
        formattedAnswer = formattedAnswer.replace(/\n/g, '<br>');
        
        // メッセージID
        const messageId = 'msg-' + Date.now();
        
        // AI回答を全部表示（続きを見るなし）
        let content = `
            <div class="message-label">🤖 AI</div>
            <div class="message-content" style="font-size: 14px; line-height: 1.6;">
                ${formattedAnswer}
            </div>
        `;

        // 関連する聖地がある場合、カード形式で表示
        const spots = data.related_spots || [];
        console.log('spots数:', spots.length);
        
        if (spots.length > 0) {
            // 件数サマリー（多言語対応）
            const spotsFoundText = getTranslation('aiSpotsFound');
            content += `
                <div style="margin-top: 12px; padding: 8px 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white; font-size: 13px;">
                    📍 ${spots.length}${spotsFoundText}
                </div>
            `;
            
            // 一括表示ボタン（多言語対応）
            const spotIds = spots.map(s => s.id).join(',');
            const showOnMapText = getTranslation('aiShowOnMap');
            content += `
                <button onclick="showSpotsOnMap('${spotIds}')" 
                    style="margin-top: 8px; width: 100%; padding: 10px; background: #34a853; color: white; border: none; 
                    border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500;">
                    🗺️ ${showOnMapText}
                </button>
            `;
            
            // 聖地カード（5件すべて表示）
            content += `<div style="margin-top: 10px;">`;
            
            for (let i = 0; i < spots.length; i++) {
                const spot = spots[i];
                content += `
                    <div style="display: flex; align-items: center; padding: 10px; margin-bottom: 8px; 
                            background: #f8f9fa; border-radius: 10px; 
                            border-left: 3px solid #1a73e8;">
                        <div style="width: 24px; height: 24px; background: #1a73e8; color: white; 
                                    border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                                    font-size: 12px; font-weight: bold; margin-right: 10px; flex-shrink: 0;">
                            ${i + 1}
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-size: 13px; font-weight: 500;">
                                ${spot.anime_url ? 
                                    `<a href="${spot.anime_url}" target="_blank" 
                                        onclick="event.stopPropagation();" 
                                        style="color: #1a73e8; text-decoration: none;">
                                        ${spot.anime_name || 'アニメ名なし'} 🔗
                                    </a>` : 
                                    `<span style="color: #1a73e8;">${spot.anime_name || 'アニメ名なし'}</span>`
                                }
                            </div>
                            <div style="font-size: 12px; color: #333; cursor: pointer;" 
                                 onclick="jumpToSpotFromChat(${spot.id})">
                                📍 ${spot.name || '聖地名なし'} <span style="color: #999;">›</span>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            content += '</div>';
        }
        
        console.log('最終content長さ:', content.length);

        aiMessage.innerHTML = content;
        chatArea.appendChild(aiMessage);
        
        
    } catch (error) {
        loadingDiv.remove();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'ai-error';
        errorDiv.textContent = `${getTranslation('aiError')}: ${error.message}`;
        chatArea.appendChild(errorDiv);
    } finally {
        input.disabled = false;
        sendBtn.disabled = false;
        chatArea.scrollTop = chatArea.scrollHeight;
        input.focus();
    }
}

// ========================================
// チャットUI用ヘルパー関数
// ========================================

// 聖地カードを生成
function createSpotCard(spot, number) {
    return `
        <div onclick="jumpToSpotFromChat(${spot.id})" 
             style="display: flex; align-items: center; padding: 10px; margin-bottom: 8px; 
                    background: #f8f9fa; border-radius: 10px; cursor: pointer; 
                    transition: all 0.2s; border-left: 3px solid #1a73e8;"
             onmouseover="this.style.background='#e8f0fe'; this.style.transform='translateX(3px)';"
             onmouseout="this.style.background='#f8f9fa'; this.style.transform='translateX(0)';">
            <div style="width: 24px; height: 24px; background: #1a73e8; color: white; 
                        border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                        font-size: 12px; font-weight: bold; margin-right: 10px; flex-shrink: 0;">
                ${number}
            </div>
            <div style="flex: 1; min-width: 0;">
                <div style="font-size: 13px; font-weight: 500; color: #1a73e8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${spot.anime_name}
                </div>
                <div style="font-size: 12px; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    📍 ${spot.name}
                </div>
            </div>
            <div style="color: #999; font-size: 16px; margin-left: 8px;">›</div>
        </div>
    `;
}

// 全文表示の切り替え
function toggleFullMessage(messageId) {
    const shortEl = document.getElementById(messageId + '-short');
    const fullEl = document.getElementById(messageId + '-full');
    const btnEl = document.getElementById(messageId + '-btn');
    
    if (fullEl.style.display === 'none') {
        shortEl.style.display = 'none';
        fullEl.style.display = 'inline';
        btnEl.innerHTML = '▲ 閉じる';
    } else {
        shortEl.style.display = 'inline';
        fullEl.style.display = 'none';
        btnEl.innerHTML = '▼ 続きを見る';
    }
}

// もっと見るの切り替え
function toggleMoreSpots(messageId) {
    const moreEl = document.getElementById(messageId + '-more-spots');
    const btnEl = document.getElementById(messageId + '-more-btn');
    
    if (moreEl.style.display === 'none') {
        moreEl.style.display = 'block';
        btnEl.innerHTML = '－ 閉じる';
        btnEl.style.background = '#e0e0e0';
    } else {
        moreEl.style.display = 'none';
        btnEl.innerHTML = btnEl.getAttribute('data-original') || '＋ もっと見る';
        btnEl.style.background = '#f0f0f0';
    }
}

// チャットから聖地にジャンプ
function jumpToSpotFromChat(spotId) {
    const spot = spots.find(s => s.id === spotId);
    if (spot) {
        const index = spots.indexOf(spot);
        selectSpot(index, markers[index]);
    }
}

// AI検索結果の聖地を地図に一括表示
function showSpotsOnMap(idsString) {
    console.log('showSpotsOnMap called with:', idsString);
    const ids = idsString.split(',').map(id => parseInt(id.trim()));
    console.log('Parsed IDs:', ids);
    
    // カテゴリフィルタをリセット
    currentCategory = 'all';
    currentFilter = 'all';
    currentSearch = '';
    document.getElementById('search-input').value = '';
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    const allBtn = document.querySelector('[data-category="all"]');
    if (allBtn) allBtn.classList.add('active');
    
    // クラスタリングをクリア
    if (markerClustererInstance) {
        markerClustererInstance.clearMarkers();
    }
    
    // すべてのマーカーを一旦非表示
    markers.forEach(marker => marker.setMap(null));
    
    // 該当するマーカーを収集
    const bounds = new google.maps.LatLngBounds();
    const visibleMarkers = [];
    
    spots.forEach((spot, index) => {
        if (ids.includes(spot.id)) {
            visibleMarkers.push(markers[index]);
            bounds.extend({ lat: spot.latitude, lng: spot.longitude });
            console.log('Found spot:', spot.name, spot.id);
        }
    });
    
    console.log('Visible markers count:', visibleMarkers.length);
    
    // クラスタリングに追加（これでマーカーが表示される）
    if (visibleMarkers.length > 0) {
        markerClustererInstance = new markerClusterer.MarkerClusterer({ 
            markers: visibleMarkers, 
            map: map 
        });
        
        // 地図を該当エリアにズーム
        if (visibleMarkers.length === 1) {
            const firstSpot = spots.find(s => ids.includes(s.id));
            map.setCenter({ lat: firstSpot.latitude, lng: firstSpot.longitude });
            map.setZoom(14);
        } else {
            map.fitBounds(bounds, { padding: 50 });
        }
    }
    
    // 件数表示を更新
    document.getElementById('count-display').textContent = `${visibleMarkers.length}${getTranslation('spotsCount')}`;
    
    // AIパネルを閉じる
    toggleAIPanel();
    
    console.log(`AI検索結果: ${visibleMarkers.length}件のピンを表示`);
}

// アニメで絞り込み
function filterByAnime(animeName) {
    document.getElementById('anime-filter').value = animeName;
    applyFilter();
    
    // AI検索パネルを閉じる
    if (aiPanelOpen) {
        toggleAIPanel();
    }
}

// 閲覧履歴を描画
function renderHistory() {
    const content = document.getElementById('history-content');
    
    if (viewHistory.length === 0) {
        content.innerHTML = `
            <div class="empty-history">
                まだ閲覧履歴がありません。<br>
                聖地をクリックしてみてください!
            </div>
        `;
        return;
    }

    let html = '';
    viewHistory.forEach(item => {
        const date = new Date(item.timestamp);
        const dateStr = date.toLocaleDateString('ja-JP', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        html += `
            <div class="history-item" onclick="jumpToSpot(${item.id})">
                <div class="history-item-anime">『${item.anime_name}』</div>
                <div class="history-item-name">${item.name}</div>
                <div class="history-item-date">${dateStr}</div>
            </div>
        `;
    });
    
    content.innerHTML = html;
}

function showHistory() {
    console.log('showHistory called');
    
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const overlay = document.getElementById('overlay');
    hamburgerMenu.classList.remove('open');
    overlay.classList.remove('show');
    hamburgerMenuOpen = false;
    
    const sidebar = document.getElementById('history-sidebar');
    renderHistory();
    sidebar.classList.add('show');
    historySidebarOpen = true;
}

function toggleHistorySidebar() {
    historySidebarOpen = !historySidebarOpen;
    const sidebar = document.getElementById('history-sidebar');
    sidebar.classList.toggle('show');
}

function jumpToSpot(spotId) {
    const spot = spots.find(s => s.id === spotId);
    if (spot) {
        const index = spots.indexOf(spot);
        selectSpot(index, markers[index]);
        toggleHistorySidebar();
    }
}

// ========================================
// AIおすすめ（ジャンルランキング形式）
// ========================================
async function showRecommendations() {
    if (viewHistory.length === 0) {
        alert('閲覧履歴がないため、おすすめを生成できません。');
        return;
    }

    const hamburgerMenu = document.getElementById('hamburger-menu');
    const overlay = document.getElementById('overlay');
    hamburgerMenu.classList.remove('open');
    overlay.classList.remove('show');
    hamburgerMenuOpen = false;

    const sidebar = document.getElementById('recommend-sidebar');
    const content = document.getElementById('recommend-content');
    
    content.innerHTML = '<div class="ai-loading">🤖 ' + getTranslation('aiChatSearching') + '</div>';
    sidebar.classList.add('show');
    recommendSidebarOpen = true;

    try {
        const viewedAnimes = [...new Set(viewHistory.map(h => h.anime_name))];
        
        const lang = (typeof currentLanguage !== 'undefined') ? currentLanguage : 'ja';
        
        const response = await fetch('/api/ai-recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                history: viewHistory,
                viewed_animes: viewedAnimes,
                language: lang
            })
        });
        
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);
        
        // 翻訳テキストを取得
        const t = {
            genreAnalysis: getTranslation('recommendGenreAnalysis'),
            viewedWorks: getTranslation('recommendViewedWorks'),
            worksUnit: getTranslation('recommendWorksUnit'),
            rank: getTranslation('recommendRank'),
            times: getTranslation('recommendTimes'),
            viewCount: getTranslation('recommendViewCount'),
            noWorks: getTranslation('recommendNoWorks')
        };
        
        // ジャンルランキング形式で表示
        let html = `
            <div style="margin-bottom: 20px; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white;">
                <div style="font-size: 14px; opacity: 0.9;">${t.genreAnalysis}</div>
                <div style="font-size: 12px; margin-top: 5px; opacity: 0.8;">${t.viewedWorks}: ${data.total_viewed}${t.worksUnit}</div>
            </div>
        `;
        
        // ジャンルランキング表示
        if (data.genre_ranking && data.genre_ranking.length > 0) {
            html += '<div style="margin-bottom: 20px;">';
            data.genre_ranking.forEach((item, index) => {
                const [genre, count] = item;
                const barWidth = (count / data.genre_ranking[0][1]) * 100;
                const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#a55eea'];
                html += `
                    <div style="margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 3px;">
                            <span>${index + 1}${t.rank} ${genre}</span>
                            <span>${count}${t.times}</span>
                        </div>
                        <div style="background: #e0e0e0; border-radius: 10px; height: 8px; overflow: hidden;">
                            <div style="background: ${colors[index % 5]}; height: 100%; width: ${barWidth}%; border-radius: 10px; transition: width 0.5s;"></div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        // おすすめアニメ表示（ジャンル別）
        if (data.recommendations && data.recommendations.length > 0) {
            data.recommendations.forEach(rec => {
                // 星の色を決定（1位=金、2位=銀、3位=銅）
                const starColors = ['#ffd700', '#c0c0c0', '#cd7f32'];
                const starColor = starColors[rec.rank - 1] || '#ffd700';
                const stars = '★'.repeat(rec.stars) + '☆'.repeat(5 - rec.stars);
                
                // 1位のジャンルは強調カラー
                const isTopGenre = rec.rank === 1;
                const headerBg = isTopGenre 
                    ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' 
                    : rec.rank === 2 
                        ? 'linear-gradient(135deg, #feca57 0%, #f39c12 100%)'
                        : 'linear-gradient(135deg, #48dbfb 0%, #0abde3 100%)';
                
                html += `
                    <div style="margin-bottom: 20px; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <div style="background: ${headerBg}; padding: 12px 15px; color: white;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: bold; font-size: 15px;">${rec.rank}${t.rank} ${rec.genre}</span>
                                <span style="font-size: 16px; color: ${starColor}; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${stars}</span>
                            </div>
                            <div style="font-size: 11px; opacity: 0.9; margin-top: 3px;">${t.viewCount}: ${rec.count}${t.times}</div>
                        </div>
                        <div style="background: white; padding: 12px;">
                `;
                
                // アニメリスト
                if (rec.animes && rec.animes.length > 0) {
                    rec.animes.forEach(item => {
                        const animeName = item.anime_name;
                        const spot = item.spot;
                        
                        // 1位ジャンルのアニメ名は強調色
                        const animeNameStyle = isTopGenre 
                            ? 'color: #ee5a24; font-weight: bold;' 
                            : 'color: #333;';
                        
                        html += `
                            <div style="padding: 10px; margin-bottom: 8px; background: #f8f9fa; border-radius: 8px; cursor: pointer; transition: background 0.2s;"
                                 onclick="jumpToSpotFromChat(${spot.id})"
                                 onmouseover="this.style.background='#e9ecef'"
                                 onmouseout="this.style.background='#f8f9fa'">
                                <div style="font-size: 14px; ${animeNameStyle}">『${animeName}』</div>
                                <div style="font-size: 12px; color: #666; margin-top: 4px;">📍 ${spot.name}</div>
                                <div style="font-size: 11px; color: #999; margin-top: 2px;">${spot.address}</div>
                            </div>
                        `;
                    });
                } else {
                    html += `<div style="color: #999; font-size: 13px;">${t.noWorks}</div>`;
                }
                
                html += '</div></div>';
            });
        }

        content.innerHTML = html;
        
    } catch (error) {
        content.innerHTML = `<div class="ai-error">${getTranslation('aiError')}: ${error.message}</div>`;
    }
}

function toggleRecommendSidebar() {
    recommendSidebarOpen = !recommendSidebarOpen;
    const sidebar = document.getElementById('recommend-sidebar');
    sidebar.classList.toggle('show');
}

function initMap() {
    console.log('🗺️ initMap called');
    // 聖地データを読み込む（地図はloadSpots内で初期化）
    loadSpots();
}

// Google Maps APIのコールバック用にグローバルに公開
window.initMap = initMap;

// Enterキーで送信
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('ai-question-input');
    if (input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAIQuestion();
            }
        });
    }
    
    // URLパラメータから言語を取得して初期化
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get('lang') || 'ja';
    currentLanguage = lang;
    
    // 言語ボタンの表示を更新
    const data = languageData[lang];
    if (data) {
        const flagEl = document.getElementById('current-lang-flag');
        if (flagEl) flagEl.textContent = data.flag;
        
        // モーダル内のアクティブ状態を更新
        document.querySelectorAll('.lang-modal-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
    }
    
    // UI全体を翻訳
    if (typeof translateUI === 'function') {
        translateUI();
    }
    
    console.log('🌐 言語設定:', lang);
});

// ページ読み込み時に自動で現在地を取得
window.addEventListener('load', function() {
    setTimeout(() => {
        autoGetCurrentLocation();
    }, 1000);
});

// 自動現在地取得（静かに取得）
function autoGetCurrentLocation() {
    if (!navigator.geolocation) {
        console.log('位置情報に対応していません');
        return;
    }

    console.log('📍 現在地を自動取得中...');

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            console.log(`✅ 現在地取得成功: ${lat}, ${lng}`);

            map.setCenter({ lat, lng });
            map.setZoom(12);

            showCurrentLocationMarker(lat, lng);
        },
        (error) => {
            console.log('現在地取得失敗（通常動作を継続）');
        },
        {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 60000
        }
    );
}

// 現在地マーカーを表示
function showCurrentLocationMarker(lat, lng) {
    if (currentLocationMarker) {
        currentLocationMarker.setMap(null);
    }

    currentLocationMarker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: '現在地',
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
        },
        zIndex: 9999
    });

    new google.maps.Circle({
        map: map,
        center: { lat, lng },
        radius: 500,
        fillColor: '#4285F4',
        fillOpacity: 0.1,
        strokeColor: '#4285F4',
        strokeOpacity: 0.3,
        strokeWeight: 1
    });
}

// 手動で現在地を更新（ボタン用）
function updateCurrentLocation() {
    if (!navigator.geolocation) {
        alert('位置情報に対応していません');
        return;
    }

    console.log('📍 現在地を更新中...');

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            console.log(`✅ 現在地更新: ${lat}, ${lng}`);

            map.setCenter({ lat, lng });
            map.setZoom(15);

            showCurrentLocationMarker(lat, lng);

            showNotification('現在地を更新しました');
        },
        (error) => {
            alert('現在地の取得に失敗しました');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// 通知を表示
function showNotification(message) {
    const existing = document.querySelector('.location-notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'location-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========================================
// ルートプランナーのJavaScript
// ========================================

function openRoutePlanner() {
    // 他のパネルを全て閉じる
    closeAllPanels();
    
    const panel = document.getElementById('route-planner-panel');
    if (!panel) return;
    
    panel.classList.add('open');
    
    // bodyのスクロールを無効化（スマホ用）
    document.body.style.overflow = 'hidden';
    
    initializeFilters();
    filterSpotList();
}

function closeRoutePlanner() {
    const panel = document.getElementById('route-planner-panel');
    if (panel) panel.classList.remove('open');
    
    clearSelection();
    
    const animeFilter = document.getElementById('route-anime-filter');
    const areaFilter = document.getElementById('route-area-filter');
    const searchInput = document.getElementById('route-search-input');
    const routeResult = document.getElementById('route-result');
    
    if (animeFilter) animeFilter.value = 'all';
    if (areaFilter) areaFilter.value = 'all';
    if (searchInput) searchInput.value = '';
    if (routeResult) routeResult.style.display = 'none';
    
    // bodyのスクロールを有効化
    document.body.style.overflow = '';
}

// 全てのパネルを閉じるヘルパー関数
function closeAllPanels() {
    // ハンバーガーメニュー
    const menu = document.getElementById('hamburger-menu');
    if (menu) menu.classList.remove('open');
    
    // オーバーレイ
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.classList.remove('show');
    
    // サイドバー
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');
    
    // 詳細パネル
    const detailPanel = document.getElementById('detail-panel');
    if (detailPanel) detailPanel.classList.remove('show');
    
    // AIパネル
    const aiPanel = document.getElementById('ai-panel');
    if (aiPanel) aiPanel.classList.remove('show');
    aiPanelOpen = false;
    
    // おすすめサイドバー
    const recommendSidebar = document.getElementById('recommend-sidebar');
    if (recommendSidebar) recommendSidebar.classList.remove('show');
    
    // 履歴サイドバー
    const historySidebar = document.getElementById('history-sidebar');
    if (historySidebar) historySidebar.classList.remove('show');
    
    // 画像検索パネル
    const imageSearchPanel = document.getElementById('image-search-panel');
    if (imageSearchPanel) imageSearchPanel.classList.remove('open');
}

function initializeFilters() {
    const animeFilter = document.getElementById('route-anime-filter');
    animeFilter.innerHTML = '<option value="all">全て表示</option>';
    
    const animeSet = new Set();
    allSpots.forEach(spot => {
        if (spot.anime_name) {
            animeSet.add(spot.anime_name);
        }
    });
    
    Array.from(animeSet).sort().forEach(anime => {
        const option = document.createElement('option');
        option.value = anime;
        option.textContent = anime;
        animeFilter.appendChild(option);
    });
    
    const areaFilter = document.getElementById('route-area-filter');
    areaFilter.innerHTML = '<option value="all">全国</option>';
    
    const allPrefectures = [
        '北海道',
        '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
        '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
        '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
        '岐阜県', '静岡県', '愛知県', '三重県',
        '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
        '鳥取県', '島根県', '岡山県', '広島県', '山口県',
        '徳島県', '香川県', '愛媛県', '高知県',
        '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県',
        '沖縄県'
    ];
    
    const existingPrefectures = new Set();
    
    allSpots.forEach(spot => {
        if (spot.address) {
            for (let pref of allPrefectures) {
                if (spot.address.includes(pref)) {
                    existingPrefectures.add(pref);
                    break;
                }
            }
        }
    });
    
    allPrefectures.forEach(prefecture => {
        if (existingPrefectures.has(prefecture)) {
            const option = document.createElement('option');
            option.value = prefecture;
            option.textContent = prefecture;
            areaFilter.appendChild(option);
        }
    });
}

function filterSpotList() {
    const animeFilter = document.getElementById('route-anime-filter').value;
    const areaFilter = document.getElementById('route-area-filter').value;
    const searchText = document.getElementById('route-search-input').value.toLowerCase();
    
    filteredSpots = allSpots.filter(spot => {
        if (areaFilter !== 'all') {
            if (!spot.address || !spot.address.includes(areaFilter)) {
                return false;
            }
        }
        
        if (animeFilter !== 'all' && spot.anime_name !== animeFilter) {
            return false;
        }
        
        if (searchText) {
            const matchName = spot.name && spot.name.toLowerCase().includes(searchText);
            const matchAnime = spot.anime_name && spot.anime_name.toLowerCase().includes(searchText);
            const matchAddress = spot.address && spot.address.toLowerCase().includes(searchText);
            
            if (!matchName && !matchAnime && !matchAddress) {
                return false;
            }
        }
        
        return true;
    });
    
    loadSpotSelectionList(filteredSpots);
}

function showRecentSpots() {
    if (!viewHistory || viewHistory.length === 0) {
        alert('閲覧履歴がありません');
        return;
    }
    
    const recentIds = viewHistory.map(h => h.id);
    filteredSpots = allSpots.filter(spot => recentIds.includes(spot.id));
    
    loadSpotSelectionList(filteredSpots);
    
    document.getElementById('route-anime-filter').value = 'all';
    document.getElementById('route-area-filter').value = 'all';
    document.getElementById('route-search-input').value = '';
}

function clearSelection() {
    selectedSpotIds = [];
    
    document.querySelectorAll('.spot-checkbox-item').forEach(item => {
        item.classList.remove('selected');
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.checked = false;
        }
    });
    
    updateSelectionCount();
}

function updateSelectionCount() {
    document.getElementById('selected-count').textContent = selectedSpotIds.length;
    
    const btn = document.getElementById('create-route-btn');
    btn.disabled = selectedSpotIds.length < 2;
}

function loadSpotSelectionList(spots) {
    const container = document.getElementById('spot-selection-list');
    container.innerHTML = '';
    
    if (!spots || spots.length === 0) {
        container.innerHTML = '<div class="list-info">該当する聖地がありません</div>';
        return;
    }
    
    const animeFilter = document.getElementById('route-anime-filter').value;
    const areaFilter = document.getElementById('route-area-filter').value;
    
    let filterInfo = '';
    if (areaFilter !== 'all') {
        filterInfo = `📍 ${areaFilter}の聖地`;
        if (animeFilter !== 'all') {
            filterInfo += ` / 📺 ${animeFilter}`;
        }
    } else if (animeFilter !== 'all') {
        filterInfo = `📺 ${animeFilter}の聖地`;
    }
    
    if (filterInfo) {
        container.innerHTML = `<div class="list-info" style="background: #e8f0fe; color: #1a73e8; font-weight: 500;">${filterInfo} (${spots.length}件)</div>`;
    } else {
        container.innerHTML = `<div class="list-info">${spots.length}${getTranslation('spotsCount')}</div>`;
    }
    
    spots.forEach(spot => {
        const item = document.createElement('div');
        item.className = 'spot-checkbox-item';
        
        if (selectedSpotIds.includes(spot.id)) {
            item.classList.add('selected');
        }
        
        item.onclick = function(e) {
            if (e.target.type !== 'checkbox') {
                const checkbox = this.querySelector('input[type="checkbox"]');
                checkbox.click();
            }
        };
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = spot.id;
        checkbox.id = `spot-${spot.id}`;
        checkbox.checked = selectedSpotIds.includes(spot.id);
        checkbox.onclick = function(e) {
            e.stopPropagation();
            handleSpotSelection(this);
        };
        
        const info = document.createElement('div');
        info.className = 'spot-info';
        
        const name = document.createElement('div');
        name.className = 'spot-info-name';
        name.textContent = spot.name || '名称不明';
        
        const anime = document.createElement('div');
        anime.className = 'spot-info-anime';
        anime.textContent = `『${spot.anime_name || '不明'}』`;
        
        const address = document.createElement('div');
        address.className = 'spot-info-address';
        address.textContent = spot.address || '住所情報なし';
        
        info.appendChild(name);
        info.appendChild(anime);
        info.appendChild(address);
        
        item.appendChild(checkbox);
        item.appendChild(info);
        
        container.appendChild(item);
    });
}

function handleSpotSelection(checkbox) {
    const spotId = parseInt(checkbox.value);
    const item = checkbox.closest('.spot-checkbox-item');
    
    if (checkbox.checked) {
        if (selectedSpotIds.length < 5) {
            selectedSpotIds.push(spotId);
            item.classList.add('selected');
        } else {
            checkbox.checked = false;
            alert('最大5箇所まで選択できます');
        }
    } else {
        selectedSpotIds = selectedSpotIds.filter(id => id !== spotId);
        item.classList.remove('selected');
    }
    
    updateSelectionCount();
}

async function createRoute() {
    if (selectedSpotIds.length < 2) {
        alert('2箇所以上選択してください');
        return;
    }
    
    const btn = document.getElementById('create-route-btn');
    btn.disabled = true;
    btn.textContent = '計算中... ⏳';
    
    const startType = document.querySelector('input[name="start-type"]:checked').value;
    let startLocation = null;
    
    if (startType === 'current' && navigator.geolocation) {
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 5000
                });
            });
            
            startLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
        } catch (error) {
            console.log('現在地取得失敗、最初の聖地から開始');
        }
    }
    
    try {
        const response = await fetch('/api/route-planner', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                spot_ids: selectedSpotIds,
                start_location: startLocation
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            alert(result.error);
        } else {
            displayRouteResult(result);
        }
    } catch (error) {
        console.error('ルート作成エラー:', error);
        alert('ルート作成に失敗しました。サーバーが起動しているか確認してください。');
    } finally {
        btn.disabled = false;
        btn.textContent = '最適ルートを作成 🤖';
    }
}

function displayRouteResult(result) {
    const container = document.getElementById('route-result');
    container.style.display = 'block';
    
    let html = '';
    
    html += `
        <div class="route-summary">
            <h3>📊 ルート概要</h3>
            <div class="summary-item">
                <span>訪問箇所:</span>
                <strong>${result.spot_count}箇所</strong>
            </div>
            <div class="summary-item">
                <span>合計距離:</span>
                <strong>${result.total_distance_km} km</strong>
            </div>
            <div class="summary-item">
                <span>移動時間:</span>
                <strong>約${result.total_duration_minutes}分</strong>
            </div>
        </div>
    `;
    
    result.route.forEach((step, index) => {
        const spot = step.spot;
        const routeInfo = step.route_info;
        
        const suggestion = result.ai_suggestions.suggestions.find(
            s => s.name === spot.name
        );
        
        html += `
            <div class="route-step">
                <div class="step-header">
                    <div class="step-number">${index + 1}</div>
                    <div class="step-name">${spot.name}</div>
                </div>
                <div class="step-duration">
                    滞在時間: ${suggestion ? suggestion.duration_minutes : 30}分
                </div>
                <div class="step-comment">
                    ${suggestion ? suggestion.comment : ''}
                </div>
            </div>
        `;
        
        if (index < result.route.length - 1 && routeInfo.success) {
            html += `
                <div class="route-arrow">
                    ↓ ${routeInfo.duration_text} (${routeInfo.distance_text})
                </div>
            `;
        }
    });
    
    html += `
        <button class="google-maps-btn" onclick="openInGoogleMaps()">
            🗺️ Googleマップで開く
        </button>
    `;
    
    container.innerHTML = html;
    
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function openInGoogleMaps() {
    const selectedSpots = allSpots.filter(spot => 
        selectedSpotIds.includes(spot.id)
    );
    
    if (selectedSpots.length < 2) return;
    
    const startType = document.querySelector('input[name="start-type"]:checked').value;
    let origin;
    
    if (startType === 'current') {
        origin = 'current+location';
    } else {
        origin = `${selectedSpots[0].latitude},${selectedSpots[0].longitude}`;
    }
    
    const destination = `${selectedSpots[selectedSpots.length-1].latitude},${selectedSpots[selectedSpots.length-1].longitude}`;
    
    let waypoints = '';
    
    if (startType === 'current') {
        waypoints = selectedSpots.slice(0, -1).map(spot => 
            `${spot.latitude},${spot.longitude}`
        ).join('|');
    } else {
        if (selectedSpots.length > 2) {
            waypoints = selectedSpots.slice(1, -1).map(spot => 
                `${spot.latitude},${spot.longitude}`
            ).join('|');
        }
    }
    
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    
    if (waypoints) {
        url += `&waypoints=${waypoints}`;
    }
    
    url += '&travelmode=driving';
    
    console.log('Googleマップ URL:', url);
    window.open(url, '_blank');
}

// ========================================
// 画像検索のJavaScript
// ========================================