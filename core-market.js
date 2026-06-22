// ===================================================
// core-market.js — 新闻生成 / 市场联动 / 股票效应
// 从 core.js 拆分：通过 SGame 全局对象访问共享状态
// ===================================================
(function() {
  var S = window.SGame;
  // G 代理：所有 G.xxx 读写透明转发到 S.G
  var G = new Proxy({}, {
    get: function(_, k) { var g = S.G; return g ? g[k] : undefined; },
    set: function(_, k, v) { var g = S.G; if (g) { g[k] = v; } return true; },
    has: function(_, k) { var g = S.G; return g ? k in g : false; }
  });
  var addLog = function() { return S.addLog.apply(S, arguments); };
  var _formatMoney = function(v) { return S.formatMoney(v); };
  var getEconomicMultiplier = S.getEconomicMultiplier;
  var getDifficulty = S.getDifficulty;

  function applyNewsStockEffect(category, isPositive, sector) {
    if (!G || typeof STOCKS === 'undefined') return;
    // 行业→股票风格映射
    const sectorToStyle = {
      '科技': 'tech', '金融': 'finance', '地产': 'real_estate',
      '零售': 'retail', '能源': 'energy', '医药': 'health',
      '物流': 'logistics', 'AI': 'tech', '区块链': 'finance',
      '新能源': 'energy', '5G': 'tech', '量子计算': 'tech',
    };
    const style = sectorToStyle[sector] || 'tech';
    const changePct = isPositive
      ? 0.05 + Math.random() * 0.10   // 利好：+5%~+15%
      : -(0.05 + Math.random() * 0.10); // 利空：-5%~-15%
    // 影响对应风格股票（遍历 STOCKS 定义，修改 G.stockPrices）
    Object.entries(STOCKS).forEach(([sid, stock]) => {
      if (sectorToStyle[stock.sector] === style) {
        const oldPrice = G.stockPrices[sid] || stock.basePrice;
        G.stockPrices[sid] = Math.max(1, +(oldPrice * (1 + changePct)).toFixed(2));
        G.stockChangeLog[sid] = parseFloat((changePct * 100).toFixed(2));
      }
    });
    // 竞争对手相关新闻：影响对应风格股票
    if (category === '财经' || category === '科技') {
      const extra = isPositive ? 0.02 : -0.02;
      Object.entries(STOCKS).forEach(([sid, stock]) => {
        if (sectorToStyle[stock.sector] === style) {
          const oldPrice = G.stockPrices[sid] || stock.basePrice;
          G.stockPrices[sid] = Math.max(1, +(oldPrice * (1 + extra)).toFixed(2));
        }
      });
    }
  }

  // ===================================================
  //  新闻生成系统
  // ===================================================
  function generateNews() {
    if (!G || typeof NEWS_TEMPLATES === 'undefined' || typeof NEWS_CATEGORIES === 'undefined') return;
    const category = NEWS_CATEGORIES[Math.floor(Math.random() * NEWS_CATEGORIES.length)];
    const catTemplates = NEWS_TEMPLATES.find(ct => ct.category === category);
    if (!catTemplates) return;
    const template = catTemplates.templates[Math.floor(Math.random() * catTemplates.templates.length)];
    const companies = ['鼎盛','恒通','新世纪','蓝天','远洋','星辰','海天','腾跃','华远','峰云'];
    const sectors = ['科技','金融','地产','零售','能源','医药','物流'];
    const fillVars = {
      company: companies[Math.floor(Math.random()*companies.length)],
      sector: sectors[Math.floor(Math.random()*sectors.length)],
      amount: Math.floor(Math.random()*90+10),
      quarter: Math.floor(Math.random()*4+1),
      growth: Math.floor(Math.random()*60+10),
      rate: (Math.random()*2+0.25).toFixed(1),
      num: Math.floor(Math.random()*900+100),
      round: ['天使','A','B','C','D'][Math.floor(Math.random()*5)],
      technology: ['5G','AI','区块链','量子计算','生物医药','新能源'][Math.floor(Math.random()*6)],
      project: ['TensorFlow','React','Vue','PyTorch','Docker','K8s'][Math.floor(Math.random()*6)],
      event: ['世界人工智能大会','达沃斯论坛','CES','MWC','进博会'][Math.floor(Math.random()*5)],
      city: ['杭州','深圳','成都','武汉','南京'][Math.floor(Math.random()*5)],
      policy: ['数字经济促进条例','营商环境优化方案','高新技术企业认定办法'][Math.floor(Math.random()*3)],
      platform: ['微博','抖音','快手','小红书'][Math.floor(Math.random()*4)],
      celebrity: ['张某某','李某某','王某','刘某'][Math.floor(Math.random()*4)],
      brand: ['华为','苹果','蔚来','小米','京东'][Math.floor(Math.random()*5)],
      change: ['持平','上涨0.1%','下降0.2%'][Math.floor(Math.random()*3)],
      country: ['美国','日本','德国','法国','韩国'][Math.floor(Math.random()*5)],
      action: ['加息','降息','维持'][Math.floor(Math.random()*3)],
      cpi: (Math.random()*4+1).toFixed(1),
    };
    let text = template;
    Object.keys(fillVars).forEach(k => { text = text.replace('{'+k+'}', fillVars[k]); });
    const isPositive = Math.random() > 0.35;
    const newsItem = {
      id: 'news_' + (G.newsHistory.length + 1),
      text, category, isPositive,
      timestamp: G.tickCount,
      heat: Math.floor(Math.random() * 9000 + 1000)
    };
    G.newsHistory.push(newsItem);
    if (G.newsHistory.length > 100) G.newsHistory.shift();
    G.news.unshift(newsItem);
    if (G.news.length > 10) G.news = G.news.slice(0, 10);
    // 业务影响
    if (typeof NEWS_BIZ_EFFECTS !== 'undefined') {
      const effects = NEWS_BIZ_EFFECTS[category];
      if (effects) {
        Object.keys(effects).forEach(bizId => {
          const range = effects[bizId];
          const mult = range[0] + Math.random() * (range[1] - range[0]);
          G.newsEffects[bizId] = 1 + mult;
        });
      }
    }
    // 竞争对手关联新闻
    if (Math.random() < 0.3 && G.rivals && G.rivals.length > 0) {
      const rival = G.rivals[Math.floor(Math.random() * G.rivals.length)];
      const rivalNews = {
        id: 'news_rival_' + (G.newsHistory.length + 1),
        text: rival.name + '（' + rival.boss + '）宣布进军' + fillVars.sector + '领域，业界关注。',
        category: '财经', isPositive: Math.random() > 0.4,
        timestamp: G.tickCount, heat: Math.floor(Math.random() * 8000 + 2000)
      };
      G.newsHistory.push(rivalNews);
      G.news.unshift(rivalNews);
      if (G.news.length > 10) G.news = G.news.slice(0, 10);
    }
    G._newsEffectsPending = true;

    // === 联动：新闻→股票 ===
    applyNewsStockEffect(category, isPositive, fillVars.sector);
  }

  // ========== 挂载到 SGame ==========
  S.applyNewsStockEffect = applyNewsStockEffect;
  S.generateNews = generateNews;
})();
