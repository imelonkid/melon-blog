---
title: 关于我
date: 2023-03-15
layout: page
---

<style>
/* 关于页面的样式 */
.about-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 0;
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 3rem;
}

.avatar {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #ebc65a;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
}

.profile-name {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.profile-title {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 1rem;
}

.profile-bio {
  max-width: 600px;
  text-align: center;
  line-height: 1.8;
  margin-bottom: 1.5rem;
}

.social-links {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.social-links a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f5f5f5;
  color: #333;
  transition: all 0.3s ease;
}

.social-links a:hover {
  background: #ebc65a;
  color: white;
  transform: translateY(-3px);
}

.about-section {
  margin-bottom: 3rem;
}

.about-section-title {
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #ebc65a;
  display: inline-block;
}

/* 江湖掠影标题样式 */
.about-section:last-of-type .about-section-title {
  font-size: 2rem;
  color: #333;
  text-align: center;
  display: block;
  margin-bottom: 2rem;
  position: relative;
}

.about-section:last-of-type .about-section-title::after {
  content: '';
  display: block;
  width: 80px;
  height: 3px;
  background: #ebc65a;
  margin: 0.8rem auto 0;
}

.about-section-content {
  line-height: 1.8;
}

.about-section-content p {
  margin-bottom: 1rem;
}

.emoji {
  font-size: 1.4rem;
  margin: 0 0.2rem;
  vertical-align: middle;
}

.highlight-box {
  background: rgba(255, 255, 255, 0.8);
  border-left: 4px solid #ebc65a;
  padding: 1.5rem;
  margin: 1.5rem 0;
  border-radius: 0 8px 8px 0;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.skills-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin: 1.5rem 0;
}

.skill {
  background: #f5f5f5;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.skill:hover {
  background: #ebc65a;
  color: white;
  transform: translateY(-3px);
}

.timeline {
  position: relative;
  margin: 2rem 0 2rem 60px;
  padding-left: 30px;
  border-left: 2px solid #e0e0e0;
}

.timeline::before {
  display: none;
}

.timeline-item {
  position: relative;
  padding-left: 2rem;
  margin-bottom: 3rem;
  border-left: none;
}

.timeline-item::before {
  content: '';
  position: absolute;
  top: 0.5rem;
  left: -41px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid #4169E1;
  z-index: 1;
}

.timeline-time {
  font-weight: 600;
  color: #4169E1;
  margin-bottom: 0.8rem;
  font-size: 1.3rem;
}

.timeline-title {
  font-weight: 700;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  color: #333;
}

.timeline-description ol {
  padding-left: 1.2rem;
  list-style-type: decimal;
}

.timeline-description li {
  margin-bottom: 0.5rem;
  color: #555;
  font-size: 1rem;
}

.timeline-item:nth-child(1)::before {
  border-color: #2196F3;
}

.timeline-item:nth-child(2)::before {
  border-color: #FF8C00;
}

.timeline-item:nth-child(3)::before {
  border-color: #2E8B57;
}

.timeline-item:nth-child(1) .timeline-time {
  color: #2196F3;
}

.timeline-item:nth-child(2) .timeline-time {
  color: #FF8C00;
}

.timeline-item:nth-child(3) .timeline-time {
  color: #2E8B57;
}

.company-logo {
  position: absolute;
  left: -80px;
  top: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  z-index: 2;
}

.company-logo img {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.skills-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
}

.skills-table th, .skills-table td {
  padding: 0.8rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.skills-table th {
  font-weight: 600;
  background: #f9f9f9;
}

.skills-table tr:hover {
  background: #f5f5f5;
}

.quote-box {
  font-style: italic;
  font-size: 1.2rem;
  color: #666;
  text-align: center;
  max-width: 700px;
  margin: 2rem auto;
  padding: 1.5rem;
  position: relative;
}

.quote-box::before, .quote-box::after {
  content: '"';
  font-size: 3rem;
  color: rgba(0, 0, 0, 0.1);
  position: absolute;
}

.quote-box::before {
  top: -1rem;
  left: -1rem;
}

.quote-box::after {
  bottom: -2rem;
  right: -1rem;
}

.gallery-container {
  display: grid;
  align-items: center;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin: 2.5rem auto;
  margin: 2rem 0;
}

.gallery-item {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.gallery-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.gallery-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.gallery-caption {
  padding: 0.8rem;
  text-align: center;
  background: white;
  font-size: 1.1rem;
  font-weight: 500;
  color: #333;
  border-top: 1px solid #f0f0f0;
}

@media screen and (max-width: 768px) {
  .profile-header .avatar {
    width: 120px;
    height: 120px;
  }
  
  .profile-name {
    font-size: 2rem;
  }
  
  .gallery-container {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media screen and (max-width: 480px) {
  .profile-header .avatar {
    width: 100px;
    height: 100px;
  }
  
  .profile-name {
    font-size: 1.8rem;
  }
  
  .gallery-container {
    grid-template-columns: 1fr;
  }
}

/* 微信二维码弹窗样式 */
.wechat-modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  justify-content: center;
  align-items: center;
}

.wechat-modal.active {
  display: flex;
}

.wechat-modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  max-width: 300px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  position: relative;
}

.wechat-qrcode {
  width: 200px;
  height: 200px;
  margin: 0 auto 10px;
}

.wechat-modal-close {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 20px;
  cursor: pointer;
  color: #666;
}

.wechat-modal-close:hover {
  color: #000;
}
</style>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">

<div class="about-page">
  <div class="profile-header">
    <img src="/images/common/favicon.ico" alt="朝花夕拾" class="avatar">
    <h1 class="profile-name">朝花夕拾</h1>
    <p class="profile-title">A Development Engineer, a Life Liver, a Hope Holder</p>
    <div class="profile-bio">
      江湖人称Melonkid，长于武功，精通互联网技艺。曾任百度、阿里、美团等知名门派高手，拥有着丰富的实战经验。
    </div>
    <div class="social-links">
      <a href="https://github.com/imelonkid" target="_blank"><i class="fab fa-github"></i></a>
      <a href="javascript:void(0);" id="wechat-link"><i class="fab fa-weixin"></i></a>
      <a href="mailto:example@example.com"><i class="fas fa-envelope"></i></a>
    </div>
  </div>
  
  <!-- 微信二维码弹窗 -->
  <div class="wechat-modal" id="wechat-modal">
    <div class="wechat-modal-content">
      <span class="wechat-modal-close" id="wechat-modal-close">&times;</span>
      <img src="/images/about/wechat.png" alt="微信二维码" class="wechat-qrcode">
      <p>扫描二维码添加微信</p>
    </div>
  </div>
  
  <div class="about-section">
    <h2 class="about-section-title">关于我</h2>
    <div class="about-section-content">
      <div class="highlight-box">
        <p>我修炼多年，对代码已经达到了出神入化的境界。我的武器是键盘和鼠标，我的余招是数据分析和算法设计。在江湖上，我与同门之间不断切磋交流，探讨武功技巧。<span class="emoji">⚔️</span></p>
      </div>
      <p>我不仅有着过人的武功，也注重江湖中的人情世故。团队合作是我长项之一，我善于与同门共同探讨问题，携手推进各种项目。在江湖中，我们相互协作，共同提高，才能赢得最终的胜利。我对技术的掌握不满足于现状，不断修行，不断追求卓越，我深知只有不断修行，才能在江湖中立足。只有精进武功，才能在互联网的江湖中披荆斩棘。<span class="emoji">🚀</span></p>
      <p>我希望能够借助自己的武艺，为江湖中的人们提供更加优质的技术服务，让江湖更加便利，让人民生活更加美好。<span class="emoji">✨</span></p>
      <p>江湖险恶，但是我愿意与您一起共创辉煌！<span class="emoji">🤝</span></p>
    </div>
  </div>
  
  <div class="about-section">
    <h2 class="about-section-title">技能特长</h2>
    <div class="about-section-content">
      <div class="skills-container">
        <span class="skill">JavaScript</span>
        <span class="skill">TypeScript</span>
        <span class="skill">React</span>
        <span class="skill">Vue</span>
        <span class="skill">Node.js</span>
        <span class="skill">Python</span>
        <span class="skill">Java</span>
        <span class="skill">Go</span>
        <span class="skill">Docker</span>
        <span class="skill">Kubernetes</span>
        <span class="skill">AWS</span>
        <span class="skill">数据分析</span>
        <span class="skill">机器学习</span>
        <span class="skill">深度学习</span>
        <span class="skill">算法设计</span>
      </div>  
      <table class="skills-table">
        <thead>
          <tr>
            <th>技能领域</th>
            <th>熟练程度</th>
            <th>实战经验</th>
          </tr>
        </thead>
        <tbody>
         <tr>
            <td>后端开发</td>
            <td>★★★★★</td>
            <td>8年+</td>
          </tr>
          <tr>
            <td>前端开发</td>
            <td>★★★☆☆</td>
            <td>3年+</td>
          </tr>
          <tr>
            <td>人工智能</td>
            <td>★★★☆☆</td>
            <td>3年+</td>
          </tr>
           <tr>
            <td>DevOps</td>
            <td>★★☆☆☆</td>
            <td>5年+</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  
  <div class="about-section">
    <h2 class="about-section-title">江湖经历</h2>
    <div class="about-section-content">
      <div class="timeline">
        <div class="timeline-item">
          <div class="company-logo">
            <img src="/images/about/meituan.jpeg" alt="美团">
          </div>
          <div class="timeline-time">2021.08 - 至今</div>
          <div class="timeline-title">美团 - 技术专家 - 优选</div>
          <div class="timeline-description">
            <ol>
              <li>优选加工系统维护</li>
              <li>优选仓储实时预警平台健身</li>
            </ol>
          </div>
        </div>
        <div class="timeline-item">
          <div class="company-logo">
            <img src="https://img.icons8.com/?size=100&id=Npot870xd7C3&format=png&color=000000" alt="阿里巴巴">
          </div>
          <div class="timeline-time">2017.05 - 2021.06</div>
          <div class="timeline-title">阿里巴巴 - 高级开发工程师 - 菜鸟/蚂蚁金服</div>
          <div class="timeline-description">
            <ol>
              <li>菜鸟时空数据引擎搭建</li>
              <li>菜鸟mpass搭建</li>
              <li>村淘业务运营</li>
              <li>数字人民币研发</li>
            </ol>
          </div>
        </div>
        <div class="timeline-item">
          <div class="company-logo">
            <img src="https://img.icons8.com/color/48/000000/baidu.png" alt="百度">
          </div>
          <div class="timeline-time">2016.03 - 2017.05</div>
          <div class="timeline-title">百度 - 研发工程师 - 百度游戏</div>
          <div class="timeline-description">
            <ol>
              <li>游戏分发平台日常维护</li>
              <li>搭建anySDK、数据中心</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="quote-box">
    技术如武功，精进不已；团队如门派，协作共赢；创新如武学，推陈出新。
  </div>
  
  <div class="about-section">
    <h2 class="about-section-title">江湖掠影</h2>
    <div class="about-section-content">
      <div class="gallery-container">
        <div class="gallery-item">
          <img src="/images/about/baidushare.jpg" alt="技术分享">
          <div class="gallery-caption">技术分享</div>
        </div>
        <div class="gallery-item">
          <img src="/images/about/mayiplay.jpg" alt="游山玩水">
          <div class="gallery-caption">游山玩水</div>
        </div>
        <div class="gallery-item">
          <img src="/images/about/baiduplay.jpg" alt="王者争霸">
          <div class="gallery-caption">王者争霸</div>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  // 确保Font Awesome图标正确加载
  if (!document.querySelector('link[href*="font-awesome"]')) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    document.head.appendChild(link);
  }
  
  // 微信二维码弹窗功能
  const wechatLink = document.getElementById('wechat-link');
  const wechatModal = document.getElementById('wechat-modal');
  const wechatModalClose = document.getElementById('wechat-modal-close');
  
  if (wechatLink && wechatModal && wechatModalClose) {
    wechatLink.addEventListener('click', function(e) {
      e.preventDefault();
      wechatModal.classList.add('active');
    });
    
    wechatModalClose.addEventListener('click', function() {
      wechatModal.classList.remove('active');
    });
    
    wechatModal.addEventListener('click', function(e) {
      if (e.target === wechatModal) {
        wechatModal.classList.remove('active');
      }
    });
  }
});
</script> 