// ========================================
// グローバル変数（最初に定義）
// ========================================
let currentLanguage = 'ja';  // 翻訳機能用
let allSpots = [];  
let map;
let spots = [];
let markers = [];
let currentFilter = 'all';
let currentSearch = '';
let currentCategory = 'all';  // カテゴリフィルタ用
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
function changeLanguage(lang) {
    currentLanguage = lang;
    console.log('言語を変更しました:', lang);
    
    // 言語選択ボタンのアクティブ状態を更新
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const selectedBtn = document.querySelector(`[data-lang="${lang}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
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
    
    // 検索が空の場合
    if (!searchInput) {
        currentSearch = '';
        updateMarkers();
        renderList();
        updateCount();
        return;
    }
    
    // 入力中の場合は少し待つ（デバウンス）
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        await performSmartSearch(searchInput);
    }, 500);
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
        
        if (matchesAnime && matchesSearch) {
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
        return matchesAnime && matchesSearch && matchesCat;
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
    document.getElementById('count-display').textContent = `${visibleCount}件の聖地`;
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
    } catch (error) {
        console.error('エラー:', error);
        document.getElementById('loading').textContent = 'サーバーに接続できません';
    }
}

function createFilterOptions() {
    const animeSet = new Set();
    spots.forEach(spot => {
        if (spot.anime_name) animeSet.add(spot.anime_name);
    });

    // 全アニメリストを保存（フィルタ用）
    window.allAnimeList = Array.from(animeSet).sort();
    
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
    
    // ドロップダウンをクリア
    select.innerHTML = '<option value="all">すべてのアニメ</option>';
    
    // フィルタリング
    let filteredAnimes = window.allAnimeList.filter(anime => {
        const matchesSearch = searchText === '' || anime.toLowerCase().includes(searchText);
        const matchesTab = currentTab === 'all' || matchesAnimeTab(anime, currentTab);
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

// アニメ名がタブに一致するかチェック
function matchesAnimeTab(animeName, tab) {
    if (tab === 'all') return true;
    
    const firstChar = animeName.charAt(0);
    
    // A-Z（英数字）
    if (tab === 'A') {
        return /^[A-Za-z0-9]/.test(firstChar);
    }
    
    // あいうえお行の判定
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

    headerContent.innerHTML = `
        <div class="anime-badge">『${spot.anime_name || '不明'}』</div>
        <div class="spot-title">${spot.name}</div>
    `;

    bodyContent.innerHTML = `
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

function closeDetailPanel() {
    const panel = document.getElementById('detail-panel');
    panel.classList.remove('show');
}

// 同じ場所に複数のアニメがある場合の詳細パネル表示
function showMultipleDetailPanel(spotsAtLocation) {
    const panel = document.getElementById('detail-panel');
    const headerContent = document.getElementById('detail-header-content');
    const bodyContent = document.getElementById('detail-body-content');

    // ヘッダーに複数アニメがあることを表示
    const animeNames = [...new Set(spotsAtLocation.map(s => s.anime_name))];
    headerContent.innerHTML = `
        <div class="anime-badge" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            📍 ${spotsAtLocation.length}件のアニメ聖地
        </div>
        <div class="spot-title">${spotsAtLocation[0].name || spotsAtLocation[0].address}</div>
    `;

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
                    <div class="info-content">『${spot.anime_name || '不明'}』</div>
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

    bodyContent.innerHTML = tabsHtml + contentsHtml;

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
    
    input.value = '';
    input.disabled = true;
    sendBtn.disabled = true;
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'ai-loading';
    loadingDiv.innerHTML = '🤖 考え中...';
    chatArea.appendChild(loadingDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
    
    try {
        const lang = (typeof currentLanguage !== 'undefined') ? currentLanguage : 'ja';
        
        const response = await fetch('/api/ai-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                question: question,
                language: lang
            })
        });
        
        const data = await response.json();
        
        loadingDiv.remove();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        const aiMessage = document.createElement('div');
        aiMessage.className = 'ai-message ai';

        let content = `
            <div class="message-label">AI</div>
            <div class="message-content">${data.answer.replace(/\n/g, '<br>')}</div>
        `;

        // 関連する聖地がある場合、ボタンを追加
        if (data.related_spots && data.related_spots.length > 0) {
            // 一括表示ボタン
            const spotIds = data.related_spots.map(s => s.id).join(',');
            content += `<div style="margin-top: 12px;">
                <button onclick="showSpotsOnMap('${spotIds}')" 
                        style="padding: 8px 16px; background: #34a853; color: white; border: none; 
                        border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;">
                        🗺️ これらの聖地を地図に表示（${data.related_spots.length}件）
                </button>
            </div>`;
            
            // 個別ボタン
            content += '<div style="margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;">';
            
            data.related_spots.forEach(spot => {
                content += `<button onclick="jumpToSpotFromChat(${spot.id})" 
                            style="padding: 6px 12px; background: #1a73e8; color: white; border: none; 
                            border-radius: 4px; cursor: pointer; font-size: 12px;">
                            📍 ${spot.name}
                        </button>`;
            });
            
            content += '</div>';
        }

        aiMessage.innerHTML = content;
        chatArea.appendChild(aiMessage);
        
    } catch (error) {
        loadingDiv.remove();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'ai-error';
        errorDiv.textContent = `エラー: ${error.message}`;
        chatArea.appendChild(errorDiv);
    } finally {
        input.disabled = false;
        sendBtn.disabled = false;
        chatArea.scrollTop = chatArea.scrollHeight;
        input.focus();
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
    document.getElementById('count-display').textContent = `${visibleMarkers.length}件の聖地`;
    
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
// AIおすすめ（多言語対応）
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
    
    content.innerHTML = '<div class="ai-loading">🤖 AIがおすすめを考え中...</div>';
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
        
        let html = `
            <div class="ai-message ai">
                <div class="message-content">${data.recommendation.replace(/\n/g, '<br>')}</div>
            </div>
        `;

        content.innerHTML = html;
        
    } catch (error) {
        content.innerHTML = `<div class="ai-error">エラー: ${error.message}</div>`;
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
    hamburgerMenuOpen = false;
    
    // オーバーレイ
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.classList.remove('show');
    
    // サイドバー
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');
    sidebarOpen = false;
    
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
    recommendSidebarOpen = false;
    
    // 履歴サイドバー
    const historySidebar = document.getElementById('history-sidebar');
    if (historySidebar) historySidebar.classList.remove('show');
    historySidebarOpen = false;
    
    // 画像検索パネル
    const imageSearchPanel = document.getElementById('image-search-panel');
    if (imageSearchPanel) imageSearchPanel.classList.remove('open');
    
    // ルートプランナー（追加）
    const routePlanner = document.getElementById('route-planner-panel');
    if (routePlanner) routePlanner.classList.remove('open');
    
    // bodyのスクロールを有効化
    document.body.style.overflow = '';
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
        container.innerHTML = `<div class="list-info">${spots.length}件の聖地</div>`;
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