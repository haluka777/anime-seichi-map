// translations.js - UI翻訳データ

const translations = {
    ja: {
        // 検索バー
        searchPlaceholder: 'アニメ聖地マップを検索',
        
        // ハンバーガーメニュー
        menu: 'メニュー',
        viewHistory: '閲覧履歴',
        aiRecommend: 'AIおすすめ',
        aiSearch: 'チャットボット',
        imageSearch: '画像から聖地を探す',
        showSidebar: 'アニメ聖地一覧',
        saved: '保存済み',
        recent: '最近',
        addSpot: '聖地を追加',
        help: 'ヘルプ',
        routePlanner: 'ルートプランナー',
        languageLabel: '🌐 言語 / Language',
        
        // サイドバー
        spotList: 'アニメ聖地一覧',
        animeSearchPlaceholder: '🔍 アニメ名を検索...',
        allAnime: 'すべてのアニメ',
        spotsCount: '件の聖地',
        
        // ジャンルフィルター
        genreFilterLabel: '🏷️ ジャンルで絞り込み',
        
        // カテゴリ
        categoryAll: 'すべて',
        categoryShrine: '神社・寺院',
        categoryStation: '駅・鉄道',
        categorySchool: '学校',
        categoryPark: '公園',
        categorySea: '海・川',
        categoryBridge: '橋',
        categoryShop: '店舗',
        categoryTower: '展望台',
        
        // 現在地
        currentLocation: '現在地',
        
        // AI検索パネル
        aiSearchTitle: '🤖 AI聖地検索',
        aiInputPlaceholder: '聖地について質問する...',
        
        // 閲覧履歴
        historyTitle: '閲覧履歴',
        noHistory: '閲覧履歴はありません',
        
        // AIおすすめ
        recommendTitle: '🌟 AIおすすめ',
        
        // ルートプランナー
        routePlannerTitle: '🗺️ ルートプランナー',
        regionAll: '全国',
        showAll: '全て表示',
        searchSpotPlaceholder: '場所名・アニメ名を入力',
        fromCurrentLocation: '現在地から',
        fromFirstSpot: '最初の聖地から',
        createRoute: 'ルートを作成',
        clearSelection: '選択をクリア',
        selectedSpots: '選択中',
        prefectureFilter: '📍 都道府県で絞り込み',
        animeFilter: '📺 アニメで絞り込み',
        searchSpot: '🔍 聖地を検索',
        recentSpotsLabel: '⏱️ 最近見た聖地から選ぶ',
        showRecentSpots: '最近見た聖地を表示',
        selectedCount: '選択中:',
        clearAll: '全て解除',
        departurePoint: '出発地',
        createOptimalRoute: '最適ルートを作成 🤖',
        
        // 画像検索
        imageSearchTitle: '🔍 画像から聖地を探す',
        keywordSearch: '🔍 キーワード検索',
        keywordPlaceholder: '例：弘前城、鳥居 海、階段 新宿',
        searchButton: '🔍 画像を検索して分析',
        
        // 詳細パネル
        address: '住所',
        details: '詳細',
        translate: '翻訳',
        streetView: 'Street View',
        satelliteView: '航空写真',
        dragToView: '👆 ドラッグで360°見渡せます',
        satelliteHint: '🛰️ 上空からの航空写真',
        
        // あいうえおタブ
        tabAll: '全て',
        
        // エラーメッセージ
        errorLoading: 'データを読み込めませんでした',
        errorServer: 'サーバーに接続できません',
        
        // ボタン
        close: '閉じる',
        send: '送信',
        search: '検索'
    },
    
    en: {
        // Search bar
        searchPlaceholder: 'Search anime pilgrimage map',
        
        // Hamburger menu
        menu: 'Menu',
        viewHistory: 'View History',
        aiRecommend: 'AI Recommend',
        aiSearch: 'Chatbot',
        imageSearch: 'Search by Image',
        showSidebar: 'Anime Spot List',
        saved: 'Saved',
        recent: 'Recent',
        addSpot: 'Add Spot',
        help: 'Help',
        routePlanner: 'Route Planner',
        languageLabel: '🌐 Language',
        
        // Sidebar
        spotList: 'Anime Pilgrimage Spots',
        animeSearchPlaceholder: '🔍 Search anime...',
        allAnime: 'All Anime',
        spotsCount: ' spots',
        
        // Category
        // Category
        categoryAll: 'All',
        categoryShrine: 'Shrines & Temples',
        categoryStation: 'Stations & Railways',
        categorySchool: 'Schools',
        categoryPark: 'Parks',
        categorySea: 'Sea & Rivers',
        categoryBridge: 'Bridges',
        categoryShop: 'Shops',
        categoryTower: 'Observation Decks',
        
        // Current location
        currentLocation: 'Current Location',
        
        // AI search panel
        aiSearchTitle: '🤖 AI Spot Search',
        aiInputPlaceholder: 'Ask about pilgrimage spots...',
        
        // View history
        historyTitle: 'View History',
        noHistory: 'No history yet',
        
        // AI recommend
        recommendTitle: '🌟 AI Recommendations',
        
        // Route planner
        routePlannerTitle: '🗺️ Route Planner',
        regionAll: 'All Regions',
        showAll: 'Show All',
        searchSpotPlaceholder: 'Enter place or anime name',
        fromCurrentLocation: 'From current location',
        fromFirstSpot: 'From first spot',
        createRoute: 'Create Route',
        clearSelection: 'Clear Selection',
        selectedSpots: 'Selected',
        prefectureFilter: '📍 Filter by Prefecture',
        animeFilter: '📺 Filter by Anime',
        searchSpot: '🔍 Search Spots',
        recentSpotsLabel: '⏱️ Choose from Recent Spots',
        showRecentSpots: 'Show Recent Spots',
        selectedCount: 'Selected:',
        clearAll: 'Clear All',
        departurePoint: 'Departure Point',
        createOptimalRoute: 'Create Optimal Route 🤖',
        
        // Image search
        imageSearchTitle: '🔍 Search by Image',
        keywordSearch: '🔍 Keyword Search',
        keywordPlaceholder: 'e.g., castle, shrine beach, stairs Tokyo',
        searchButton: '🔍 Search & Analyze',
        
        // Detail panel
        address: 'Address',
        details: 'Details',
        translate: 'Translate',
        streetView: 'Street View',
        satelliteView: 'Satellite',
        dragToView: '👆 Drag to look around 360°',
        satelliteHint: '🛰️ Satellite view from above',
        
        // Aiueo tabs
        tabAll: 'All',
        
        // Error messages
        errorLoading: 'Failed to load data',
        errorServer: 'Cannot connect to server',
        
        // Buttons
        close: 'Close',
        send: 'Send',
        search: 'Search'
    },
    
    zh: {
        // 搜索栏
        searchPlaceholder: '搜索动漫圣地地图',
        
        // 汉堡菜单
        menu: '菜单',
        viewHistory: '浏览历史',
        aiRecommend: 'AI推荐',
        aiSearch: '聊天机器人',
        imageSearch: '图片搜索',
        showSidebar: '动漫圣地列表',
        saved: '已保存',
        recent: '最近',
        addSpot: '添加圣地',
        help: '帮助',
        routePlanner: '路线规划',
        languageLabel: '🌐 语言',
        
        // 侧边栏
        spotList: '动漫圣地列表',
        animeSearchPlaceholder: '🔍 搜索动漫名...',
        allAnime: '所有动漫',
        spotsCount: '个圣地',
        
        // 分类
        categoryAll: '全部',
        categoryShrine: '神社・寺庙',
        categoryStation: '车站・铁路',
        categorySchool: '学校',
        categoryPark: '公园',
        categorySea: '海・河',
        categoryBridge: '桥',
        categoryShop: '商店',
        categoryTower: '展望台',
        
        currentLocation: '当前位置',
        
        // AI搜索面板
        aiSearchTitle: '🤖 AI圣地搜索',
        aiInputPlaceholder: '询问关于圣地的问题...',
        
        // 浏览历史
        historyTitle: '浏览历史',
        noHistory: '暂无浏览历史',
        
        // AI推荐
        recommendTitle: '🌟 AI推荐',
        
        // 路线规划
        routePlannerTitle: '🗺️ 路线规划',
        regionAll: '全国',
        showAll: '显示全部',
        searchSpotPlaceholder: '输入地点或动漫名',
        fromCurrentLocation: '从当前位置',
        fromFirstSpot: '从第一个圣地',
        createRoute: '创建路线',
        clearSelection: '清除选择',
        selectedSpots: '已选择',
        prefectureFilter: '📍 按都道府县筛选',
        animeFilter: '📺 按动漫筛选',
        searchSpot: '🔍 搜索圣地',
        recentSpotsLabel: '⏱️ 从最近浏览中选择',
        showRecentSpots: '显示最近浏览',
        selectedCount: '已选:',
        clearAll: '全部清除',
        departurePoint: '出发地',
        createOptimalRoute: '创建最优路线 🤖',
        
        // 图片搜索
        imageSearchTitle: '🔍 图片搜索圣地',
        keywordSearch: '🔍 关键词搜索',
        keywordPlaceholder: '例：城堡、�的居 海边、台阶 东京',
        searchButton: '🔍 搜索并分析',
        
        // 详情面板
        address: '地址',
        details: '详情',
        translate: '翻译',
        streetView: '街景',
        satelliteView: '卫星图',
        dragToView: '👆 拖动查看360°全景',
        satelliteHint: '🛰️ 卫星航拍图',
        
        // 五十音标签
        tabAll: '全部',
        
        // 错误信息
        errorLoading: '加载数据失败',
        errorServer: '无法连接服务器',
        
        // 按钮
        close: '关闭',
        send: '发送',
        search: '搜索'
    },
    
    ko: {
        // 검색바
        searchPlaceholder: '애니메이션 성지 지도 검색',
        
        // 햄버거 메뉴
        menu: '메뉴',
        viewHistory: '열람 기록',
        aiRecommend: 'AI 추천',
        aiSearch: '챗봇',
        imageSearch: '이미지로 검색',
        showSidebar: '애니메이션 성지 목록',
        saved: '저장됨',
        recent: '최근',
        addSpot: '성지 추가',
        help: '도움말',
        routePlanner: '루트 플래너',
        languageLabel: '🌐 언어',
        
        // 사이드바
        spotList: '애니메이션 성지 목록',
        animeSearchPlaceholder: '🔍 애니메이션 검색...',
        allAnime: '모든 애니메이션',
        spotsCount: '개의 성지',
        
        // 카테고리
        categoryAll: '전체',
        categoryShrine: '신사・사찰',
        categoryStation: '역・철도',
        categorySchool: '학교',
        categoryPark: '공원',
        categorySea: '바다・강',
        categoryBridge: '다리',
        categoryShop: '상점',
        categoryTower: '전망대',
        
        currentLocation: '현재 위치',
        
        // AI 검색 패널
        aiSearchTitle: '🤖 AI 성지 검색',
        aiInputPlaceholder: '성지에 대해 질문하세요...',
        
        // 열람 기록
        historyTitle: '열람 기록',
        noHistory: '열람 기록이 없습니다',
        
        // AI 추천
        recommendTitle: '🌟 AI 추천',
        
        // 루트 플래너
        routePlannerTitle: '🗺️ 루트 플래너',
        regionAll: '전국',
        showAll: '전체 표시',
        searchSpotPlaceholder: '장소명 또는 애니메이션 이름 입력',
        fromCurrentLocation: '현재 위치에서',
        fromFirstSpot: '첫 번째 성지에서',
        createRoute: '루트 만들기',
        clearSelection: '선택 지우기',
        selectedSpots: '선택됨',
        prefectureFilter: '📍 도도부현으로 필터링',
        animeFilter: '📺 애니메이션으로 필터링',
        searchSpot: '🔍 성지 검색',
        recentSpotsLabel: '⏱️ 최근 본 성지에서 선택',
        showRecentSpots: '최근 본 성지 표시',
        selectedCount: '선택:',
        clearAll: '전체 해제',
        departurePoint: '출발지',
        createOptimalRoute: '최적 루트 만들기 🤖',
        
        // 이미지 검색
        imageSearchTitle: '🔍 이미지로 성지 검색',
        keywordSearch: '🔍 키워드 검색',
        keywordPlaceholder: '예: 성, 신사 바다, 계단 도쿄',
        searchButton: '🔍 검색 및 분석',
        
        // 상세 패널
        address: '주소',
        details: '상세',
        translate: '번역',
        streetView: '스트리트 뷰',
        satelliteView: '위성 사진',
        dragToView: '👆 드래그하여 360° 둘러보기',
        satelliteHint: '🛰️ 위에서 본 위성 사진',
        
        // 오십음 탭
        tabAll: '전체',
        
        // 오류 메시지
        errorLoading: '데이터를 불러올 수 없습니다',
        errorServer: '서버에 연결할 수 없습니다',
        
        // 버튼
        close: '닫기',
        send: '전송',
        search: '검색'
    },
    
    // ヒンディー語
    hi: {
        searchPlaceholder: 'एनीमे तीर्थ मानचित्र खोजें',
        menu: 'मेनू',
        viewHistory: 'देखने का इतिहास',
        aiRecommend: 'AI सुझाव',
        aiSearch: 'चैटबॉट',
        imageSearch: 'छवि से तीर्थ खोजें',
        showSidebar: 'एनीमे तीर्थ सूची',
        saved: 'सहेजा गया',
        recent: 'हाल का',
        addSpot: 'तीर्थ जोड़ें',
        help: 'मदद',
        routePlanner: 'रूट प्लानर',
        languageLabel: '🌐 भाषा / Language',
        spotList: 'एनीमे तीर्थ सूची',
        animeSearchPlaceholder: '🔍 एनीमे नाम खोजें...',
        allAnime: 'सभी एनीमे',
        spotsCount: 'तीर्थ स्थान',
        genreFilterLabel: '🏷️ शैली से फ़िल्टर करें',
        categoryAll: 'सभी',
        categoryShrine: 'मंदिर',
        categoryStation: 'स्टेशन・रेलवे',
        categorySchool: 'स्कूल',
        categoryPark: 'पार्क',
        categorySea: 'समुद्र・नदी',
        categoryBridge: 'पुल',
        categoryShop: 'दुकान',
        categoryTower: 'टावर',
        
        currentLocation: 'वर्तमान स्थान',
        aiSearchTitle: '🤖 AI तीर्थ खोज',
        aiInputPlaceholder: 'तीर्थ के बारे में पूछें...',
        historyTitle: 'देखने का इतिहास',
        noHistory: 'कोई इतिहास नहीं',
        recommendTitle: '🌟 AI सुझाव',
        routePlannerTitle: '🗺️ रूट प्लानर',
        regionAll: 'सभी क्षेत्र',
        showAll: 'सभी दिखाएं',
        searchSpotPlaceholder: 'स्थान या एनीमे नाम दर्ज करें',
        fromCurrentLocation: 'वर्तमान स्थान से',
        fromFirstSpot: 'पहले तीर्थ से',
        createRoute: 'रूट बनाएं',
        clearSelection: 'चयन साफ़ करें',
        selectedSpots: 'चयनित',
        prefectureFilter: '📍 प्रांत द्वारा फ़िल्टर करें',
        animeFilter: '📺 एनीमे द्वारा फ़िल्टर करें',
        searchSpot: '🔍 तीर्थ खोजें',
        recentSpotsLabel: '⏱️ हाल ही में देखे गए में से चुनें',
        showRecentSpots: 'हाल के तीर्थ दिखाएं',
        selectedCount: 'चयनित:',
        clearAll: 'सभी साफ़ करें',
        departurePoint: 'प्रस्थान बिंदु',
        createOptimalRoute: 'इष्टतम रूट बनाएं 🤖',
        imageSearchTitle: '🔍 छवि से तीर्थ खोजें',
        keywordSearch: '🔍 कीवर्ड खोज',
        keywordPlaceholder: 'उदाहरण: महल, मंदिर, स्टेशन',
        searchButton: '🔍 छवि खोजें और विश्लेषण करें',
        address: 'पता',
        details: 'विवरण',
        translate: 'अनुवाद',
        streetView: 'Street View',
        satelliteView: 'उपग्रह दृश्य',
        dragToView: '👆 360° देखने के लिए खींचें',
        satelliteHint: '🛰️ आकाश से उपग्रह छवि',
        tabAll: 'सभी',
        errorLoading: 'डेटा लोड नहीं हो सका',
        errorServer: 'सर्वर से कनेक्ट नहीं हो सका',
        close: 'बंद करें',
        send: 'भेजें',
        search: 'खोजें'
    },
    
    // スペイン語
    es: {
        searchPlaceholder: 'Buscar mapa de peregrinación anime',
        menu: 'Menú',
        viewHistory: 'Historial',
        aiRecommend: 'Recomendaciones IA',
        aiSearch: 'Chatbot',
        imageSearch: 'Buscar por imagen',
        showSidebar: 'Lista de lugares',
        saved: 'Guardado',
        recent: 'Reciente',
        addSpot: 'Agregar lugar',
        help: 'Ayuda',
        routePlanner: 'Planificador de ruta',
        languageLabel: '🌐 Idioma / Language',
        spotList: 'Lista de lugares anime',
        animeSearchPlaceholder: '🔍 Buscar nombre de anime...',
        allAnime: 'Todos los anime',
        spotsCount: 'lugares',
        genreFilterLabel: '🏷️ Filtrar por género',
        categoryAll: 'Todos',
        categoryShrine: 'Santuarios・Templos',
        categoryStation: 'Estaciones・Ferrocarriles',
        categorySchool: 'Escuelas',
        categoryPark: 'Parques',
        categorySea: 'Mar・Ríos',
        categoryBridge: 'Puentes',
        categoryShop: 'Tiendas',
        categoryTower: 'Miradores',
        
        currentLocation: 'Ubicación actual',
        aiSearchTitle: '🤖 Búsqueda IA de lugares',
        aiInputPlaceholder: 'Preguntar sobre lugares...',
        historyTitle: 'Historial',
        noHistory: 'Sin historial',
        recommendTitle: '🌟 Recomendaciones IA',
        routePlannerTitle: '🗺️ Planificador de ruta',
        regionAll: 'Todo Japón',
        showAll: 'Mostrar todo',
        searchSpotPlaceholder: 'Ingrese lugar o nombre de anime',
        fromCurrentLocation: 'Desde ubicación actual',
        fromFirstSpot: 'Desde el primer lugar',
        createRoute: 'Crear ruta',
        clearSelection: 'Limpiar selección',
        selectedSpots: 'Seleccionados',
        prefectureFilter: '📍 Filtrar por prefectura',
        animeFilter: '📺 Filtrar por anime',
        searchSpot: '🔍 Buscar lugares',
        recentSpotsLabel: '⏱️ Elegir de recientes',
        showRecentSpots: 'Mostrar recientes',
        selectedCount: 'Seleccionados:',
        clearAll: 'Limpiar todo',
        departurePoint: 'Punto de partida',
        createOptimalRoute: 'Crear ruta óptima 🤖',
        imageSearchTitle: '🔍 Buscar lugar por imagen',
        keywordSearch: '🔍 Búsqueda por palabra clave',
        keywordPlaceholder: 'Ej: castillo, templo, estación',
        searchButton: '🔍 Buscar y analizar imagen',
        address: 'Dirección',
        details: 'Detalles',
        translate: 'Traducir',
        streetView: 'Street View',
        satelliteView: 'Vista satelital',
        dragToView: '👆 Arrastra para ver 360°',
        satelliteHint: '🛰️ Imagen satelital desde el cielo',
        tabAll: 'Todos',
        errorLoading: 'No se pudieron cargar los datos',
        errorServer: 'No se pudo conectar al servidor',
        close: 'Cerrar',
        send: 'Enviar',
        search: 'Buscar'
    },
    
    // フランス語
    fr: {
        searchPlaceholder: 'Rechercher sur la carte anime',
        menu: 'Menu',
        viewHistory: 'Historique',
        aiRecommend: 'Recommandations IA',
        aiSearch: 'Chatbot',
        imageSearch: 'Rechercher par image',
        showSidebar: 'Liste des lieux',
        saved: 'Enregistré',
        recent: 'Récent',
        addSpot: 'Ajouter un lieu',
        help: 'Aide',
        routePlanner: 'Planificateur d\'itinéraire',
        languageLabel: '🌐 Langue / Language',
        spotList: 'Liste des lieux anime',
        animeSearchPlaceholder: '🔍 Rechercher un anime...',
        allAnime: 'Tous les anime',
        spotsCount: 'lieux',
        genreFilterLabel: '🏷️ Filtrer par genre',
        categoryAll: 'Tous',
        categoryShrine: 'Sanctuaires・Temples',
        categoryStation: 'Gares・Chemins de fer',
        categorySchool: 'Écoles',
        categoryPark: 'Parcs',
        categorySea: 'Mer・Rivières',
        categoryBridge: 'Ponts',
        categoryShop: 'Boutiques',
        categoryTower: 'Observatoires',
        
        currentLocation: 'Position actuelle',
        aiSearchTitle: '🤖 Recherche IA de lieux',
        aiInputPlaceholder: 'Poser une question sur les lieux...',
        historyTitle: 'Historique',
        noHistory: 'Aucun historique',
        recommendTitle: '🌟 Recommandations IA',
        routePlannerTitle: '🗺️ Planificateur d\'itinéraire',
        regionAll: 'Tout le Japon',
        showAll: 'Tout afficher',
        searchSpotPlaceholder: 'Entrez lieu ou nom d\'anime',
        fromCurrentLocation: 'Depuis position actuelle',
        fromFirstSpot: 'Depuis le premier lieu',
        createRoute: 'Créer itinéraire',
        clearSelection: 'Effacer sélection',
        selectedSpots: 'Sélectionnés',
        prefectureFilter: '📍 Filtrer par préfecture',
        animeFilter: '📺 Filtrer par anime',
        searchSpot: '🔍 Rechercher des lieux',
        recentSpotsLabel: '⏱️ Choisir parmi les récents',
        showRecentSpots: 'Afficher les récents',
        selectedCount: 'Sélectionnés:',
        clearAll: 'Tout effacer',
        departurePoint: 'Point de départ',
        createOptimalRoute: 'Créer itinéraire optimal 🤖',
        imageSearchTitle: '🔍 Rechercher lieu par image',
        keywordSearch: '🔍 Recherche par mot-clé',
        keywordPlaceholder: 'Ex: château, temple, gare',
        searchButton: '🔍 Rechercher et analyser l\'image',
        address: 'Adresse',
        details: 'Détails',
        translate: 'Traduire',
        streetView: 'Street View',
        satelliteView: 'Vue satellite',
        dragToView: '👆 Faites glisser pour voir à 360°',
        satelliteHint: '🛰️ Image satellite depuis le ciel',
        tabAll: 'Tous',
        errorLoading: 'Impossible de charger les données',
        errorServer: 'Impossible de se connecter au serveur',
        close: 'Fermer',
        send: 'Envoyer',
        search: 'Rechercher'
    },
    
    // ポルトガル語
    pt: {
        searchPlaceholder: 'Pesquisar mapa de peregrinação anime',
        menu: 'Menu',
        viewHistory: 'Histórico',
        aiRecommend: 'Recomendações IA',
        aiSearch: 'Chatbot',
        imageSearch: 'Pesquisar por imagem',
        showSidebar: 'Lista de locais',
        saved: 'Salvo',
        recent: 'Recente',
        addSpot: 'Adicionar local',
        help: 'Ajuda',
        routePlanner: 'Planejador de rota',
        languageLabel: '🌐 Idioma / Language',
        spotList: 'Lista de locais anime',
        animeSearchPlaceholder: '🔍 Pesquisar nome de anime...',
        allAnime: 'Todos os anime',
        spotsCount: 'locais',
        genreFilterLabel: '🏷️ Filtrar por gênero',
        categoryAll: 'Todos',
        categoryShrine: 'Santuários・Templos',
        categoryStation: 'Estações・Ferrovias',
        categorySchool: 'Escolas',
        categoryPark: 'Parques',
        categorySea: 'Mar・Rios',
        categoryBridge: 'Pontes',
        categoryShop: 'Lojas',
        categoryTower: 'Mirantes',
        
        currentLocation: 'Localização atual',
        aiSearchTitle: '🤖 Pesquisa IA de locais',
        aiInputPlaceholder: 'Perguntar sobre locais...',
        historyTitle: 'Histórico',
        noHistory: 'Sem histórico',
        recommendTitle: '🌟 Recomendações IA',
        routePlannerTitle: '🗺️ Planejador de rota',
        regionAll: 'Todo o Japão',
        showAll: 'Mostrar tudo',
        searchSpotPlaceholder: 'Digite local ou nome de anime',
        fromCurrentLocation: 'Da localização atual',
        fromFirstSpot: 'Do primeiro local',
        createRoute: 'Criar rota',
        clearSelection: 'Limpar seleção',
        selectedSpots: 'Selecionados',
        prefectureFilter: '📍 Filtrar por prefeitura',
        animeFilter: '📺 Filtrar por anime',
        searchSpot: '🔍 Pesquisar locais',
        recentSpotsLabel: '⏱️ Escolher dos recentes',
        showRecentSpots: 'Mostrar recentes',
        selectedCount: 'Selecionados:',
        clearAll: 'Limpar tudo',
        departurePoint: 'Ponto de partida',
        createOptimalRoute: 'Criar rota ideal 🤖',
        imageSearchTitle: '🔍 Pesquisar local por imagem',
        keywordSearch: '🔍 Pesquisa por palavra-chave',
        keywordPlaceholder: 'Ex: castelo, templo, estação',
        searchButton: '🔍 Pesquisar e analisar imagem',
        address: 'Endereço',
        details: 'Detalhes',
        translate: 'Traduzir',
        streetView: 'Street View',
        satelliteView: 'Vista de satélite',
        dragToView: '👆 Arraste para ver 360°',
        satelliteHint: '🛰️ Imagem de satélite do céu',
        tabAll: 'Todos',
        errorLoading: 'Não foi possível carregar os dados',
        errorServer: 'Não foi possível conectar ao servidor',
        close: 'Fechar',
        send: 'Enviar',
        search: 'Pesquisar'
    }
};

// 現在の言語でテキストを取得
function t(key) {
    return translations[currentLanguage]?.[key] || translations['ja'][key] || key;
}

// UI全体を翻訳
function translateUI() {
    // 検索バー
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.placeholder = t('searchPlaceholder');
    
    // アニメ検索
    const animeSearchInput = document.getElementById('anime-search-input');
    if (animeSearchInput) animeSearchInput.placeholder = t('animeSearchPlaceholder');
    
    // サイドバーヘッダー
    const sidebarTitle = document.querySelector('#sidebar-header h2');
    if (sidebarTitle) sidebarTitle.textContent = t('spotList');
    
    // すべてのアニメオプション
    const allAnimeOption = document.querySelector('#anime-filter option[value="all"]');
    if (allAnimeOption) allAnimeOption.textContent = t('allAnime');
    
    // ハンバーガーメニュー項目
    const menuItems = {
        'showHistory': 'viewHistory',
        'showRecommendations': 'aiRecommend',
        'toggleAIPanel': 'aiSearch',
        'openImageSearch': 'imageSearch',
        'toggleSidebar': 'showSidebar'
    };
    
    document.querySelectorAll('.menu-item').forEach(item => {
        const onclick = item.getAttribute('onclick');
        if (onclick) {
            for (const [func, key] of Object.entries(menuItems)) {
                if (onclick.includes(func)) {
                    const span = item.querySelector('span');
                    if (span) span.textContent = t(key);
                    break;
                }
            }
        }
    });
    
    // メニューヘッダー
    const menuHeader = document.querySelector('.menu-header > div');
    if (menuHeader) menuHeader.textContent = t('menu');
    
    // 言語セクションラベル
    const langLabel = document.querySelector('.menu-section-title');
    if (langLabel) langLabel.textContent = t('languageLabel');
    
    // メニュー内のdata-translate属性を持つ要素
    document.querySelectorAll('#hamburger-menu [data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            el.textContent = translations[currentLanguage][key];
        }
    });
    
    // AI検索パネル
    const aiTitle = document.querySelector('#ai-panel-header h2');
    if (aiTitle) aiTitle.textContent = t('aiSearchTitle');
    
    const aiInput = document.getElementById('ai-question-input');
    if (aiInput) aiInput.placeholder = t('aiInputPlaceholder');
    
    // 閲覧履歴
    const historyTitle = document.querySelector('#history-sidebar h2');
    if (historyTitle) historyTitle.textContent = t('historyTitle');
    
    // AIおすすめ
    const recommendTitleEl = document.querySelector('#recommend-sidebar h2[data-translate="recommendTitle"]');
    if (recommendTitleEl) recommendTitleEl.textContent = t('recommendTitle');
    
    // ルートプランナー
    const routeTitle = document.querySelector('#route-planner-panel h2');
    if (routeTitle) routeTitle.textContent = t('routePlannerTitle');
    
    // ルートプランナー内のラベル
    document.querySelectorAll('#route-planner-panel [data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            el.textContent = translations[currentLanguage][key];
        }
    });
    
    // ルートプランナー内のプレースホルダー
    document.querySelectorAll('#route-planner-panel [data-translate-placeholder]').forEach(el => {
        const key = el.getAttribute('data-translate-placeholder');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            el.placeholder = translations[currentLanguage][key];
        }
    });
    
    // ルートプランナーの検索ボックス
    const routeSearch = document.getElementById('route-search-input');
    if (routeSearch) routeSearch.placeholder = t('searchSpotPlaceholder');
    
    // 都道府県フィルタの「全国」
    const areaAll = document.querySelector('#route-area-filter option[value="all"]');
    if (areaAll) areaAll.textContent = t('regionAll');
    
    // アニメフィルタの「全て表示」
    const animeAll = document.querySelector('#route-anime-filter option[value="all"]');
    if (animeAll) animeAll.textContent = t('showAll');
    
    // 画像検索
    const imageTitle = document.querySelector('#image-search-panel h2');
    if (imageTitle) imageTitle.textContent = t('imageSearchTitle');
    
    // カテゴリ「すべて」
    const categoryAll = document.querySelector('.category-btn[data-category="all"] .category-text');
    if (categoryAll) categoryAll.textContent = t('categoryAll');
    
    // カテゴリフィルター全体を翻訳
    document.querySelectorAll('#category-filter [data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            el.textContent = translations[currentLanguage][key];
        }
    });
    
    // あいうえおタブ「全て」
    const tabAll = document.querySelector('.anime-tab[data-tab="all"]');
    if (tabAll) tabAll.textContent = t('tabAll');
    
    console.log('🌐 UI翻訳完了:', currentLanguage);
}