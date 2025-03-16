// 本地搜索功能
window.addEventListener('DOMContentLoaded', () => {
  const searchButton = document.getElementById('search-button');
  let searchData = null;
  let searchModal = null;
  let searchInput = null;
  let searchResultsContainer = null;
  let searchOverlay = null;
  let searchTimeout = null;

  // 创建遮罩层
  function createOverlay() {
    if (searchOverlay) return;
    
    searchOverlay = document.createElement('div');
    searchOverlay.className = 'search-overlay';
    document.body.appendChild(searchOverlay);
    
    searchOverlay.addEventListener('click', () => {
      hideSearchModal();
    });
  }

  // 创建搜索模态框
  function createSearchModal() {
    if (searchModal) return;
    
    // 创建模态框容器
    searchModal = document.createElement('div');
    searchModal.className = 'search-modal';
    searchModal.style.display = 'none';
    document.body.appendChild(searchModal);
    
    // 添加关闭按钮
    const closeButton = document.createElement('div');
    closeButton.className = 'search-close';
    closeButton.innerHTML = '×';
    closeButton.addEventListener('click', () => {
      hideSearchModal();
    });
    searchModal.appendChild(closeButton);
    
    // 添加搜索输入框
    const searchInputContainer = document.createElement('div');
    searchInputContainer.className = 'search-input-container';
    searchModal.appendChild(searchInputContainer);
    
    searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'search-input';
    searchInput.placeholder = '输入关键词搜索...';
    searchInput.addEventListener('input', () => {
      // 实时搜索，添加防抖
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      searchTimeout = setTimeout(() => {
        performSearch();
      }, 300);
    });
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
    searchInputContainer.appendChild(searchInput);
    
    // 添加结果列表容器
    searchResultsContainer = document.createElement('div');
    searchResultsContainer.className = 'search-results-list';
    searchModal.appendChild(searchResultsContainer);
  }

  // 隐藏搜索模态框
  function hideSearchModal() {
    if (searchModal) {
      searchModal.style.display = 'none';
    }
    if (searchOverlay) {
      searchOverlay.style.display = 'none';
    }
  }

  // 显示搜索模态框
  function showSearchModal() {
    createSearchModal();
    createOverlay();
    searchModal.style.display = 'block';
    searchOverlay.style.display = 'block';
    
    // 聚焦到搜索输入框
    setTimeout(() => {
      searchInput.focus();
    }, 100);
  }

  // 加载搜索数据
  function loadSearchData() {
    if (searchData) return Promise.resolve(searchData);
    
    return fetch('/search.xml')
      .then(response => response.text())
      .then(text => {
        // 解析XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');
        const entries = xmlDoc.getElementsByTagName('entry');
        
        searchData = Array.from(entries).map(entry => {
          return {
            title: entry.getElementsByTagName('title')[0].textContent,
            url: entry.getElementsByTagName('url')[0].textContent,
            content: entry.getElementsByTagName('content')[0].textContent,
            tags: Array.from(entry.getElementsByTagName('tag')).map(tag => tag.textContent)
          };
        });
        
        return searchData;
      })
      .catch(error => {
        console.error('加载搜索数据失败:', error);
        return [];
      });
  }

  // 执行搜索
  function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      searchResultsContainer.innerHTML = '';
      return;
    }
    
    searchResultsContainer.innerHTML = '<div class="search-loading">搜索中...</div>';
    
    loadSearchData()
      .then(data => {
        // 搜索逻辑
        const results = data.filter(item => {
          return item.title.toLowerCase().includes(query) || 
                 item.content.toLowerCase().includes(query) ||
                 item.tags.some(tag => tag.toLowerCase().includes(query));
        });
        
        // 显示结果
        if (results.length === 0) {
          searchResultsContainer.innerHTML = '<div class="search-no-results">没有找到相关结果</div>';
          return;
        }
        
        searchResultsContainer.innerHTML = '';
        results.forEach(item => {
          const resultItem = document.createElement('div');
          resultItem.className = 'search-result-item';
          
          const title = document.createElement('a');
          title.className = 'search-result-title';
          title.href = item.url;
          title.textContent = item.title;
          
          const content = document.createElement('div');
          content.className = 'search-result-content';
          
          // 提取包含关键词的片段
          let contentText = item.content.replace(/<[^>]+>/g, '');
          const keywordIndex = contentText.toLowerCase().indexOf(query);
          if (keywordIndex > -1) {
            const startIndex = Math.max(0, keywordIndex - 50);
            const endIndex = Math.min(contentText.length, keywordIndex + query.length + 50);
            contentText = (startIndex > 0 ? '...' : '') + 
                          contentText.substring(startIndex, endIndex) + 
                          (endIndex < contentText.length ? '...' : '');
          } else {
            contentText = contentText.substring(0, 100) + '...';
          }
          
          // 高亮关键词
          contentText = contentText.replace(new RegExp(query, 'gi'), match => `<span class="search-keyword">${match}</span>`);
          content.innerHTML = contentText;
          
          resultItem.appendChild(title);
          resultItem.appendChild(content);
          searchResultsContainer.appendChild(resultItem);
        });
      });
  }

  // 绑定搜索按钮点击事件
  if (searchButton) {
    searchButton.addEventListener('click', (e) => {
      e.preventDefault();
      showSearchModal();
    });
  }

  // ESC键关闭搜索模态框
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && searchModal && searchModal.style.display === 'block') {
      hideSearchModal();
    }
  });
}); 